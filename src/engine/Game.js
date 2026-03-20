import { IdleSystem } from './IdleSystem.js';
import { EventSystem } from './EventSystem.js';


export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.nodes = [];
    this.connections = [];
    this.points = 0; // Renamed from flux
    this.camera = { x: 0, y: 0, zoom: 1.0 };
    this.plotSize = 800;
    this.purchasedPlots = new Set(); // Start empty, main.js will purchase 0,0
    this.lastTime = 0;
    this.isRunning = false;
    
    this.idleSystem = new IdleSystem(this);
    this.eventSystem = new EventSystem(this);
    this.chromaBoosts = {}; // Stores level of boost per color
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    
    // Renderer will be called from main.js or here later
    
    requestAnimationFrame((time) => this.loop(time));
  }

  update(deltaTime) {
    this.idleSystem.update(deltaTime);
    this.eventSystem.update(deltaTime);
    
    // Auto-save every 5 seconds
    this.autoSaveTimer = (this.autoSaveTimer || 0) + deltaTime;
    if (this.autoSaveTimer >= 5000) {
        this.saveGame();
        this.autoSaveTimer = 0;
    }
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  getPlotCost(x, y) {
    const dist = Math.abs(x) + Math.abs(y);
    return 50 * (dist + 1);
  }

  getPlotBiome(x, y) {
    if (x === 0 && y === 0) return 'neutral';
    
    // Assign biome based on angle
    const angle = Math.atan2(y, x);
    if (angle >= -Math.PI/4 && angle < Math.PI/4) return '#ffaa00'; // Right: Orange
    if (angle >= Math.PI/4 && angle < 3*Math.PI/4) return '#ff3366'; // Bottom: Pink
    if (angle >= -3*Math.PI/4 && angle < -Math.PI/4) return '#00e5ff'; // Top: Cyan
    return '#bd00ff'; // Left: Purple
  }

  getAvailablePlots() {
    const available = new Set();
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    
    for (let plotStr of this.purchasedPlots) {
      const [px, py] = plotStr.split(',').map(Number);
      for (let [dx, dy] of dirs) {
        const nx = px + dx;
        const ny = py + dy;
        const nStr = `${nx},${ny}`;
        if (!this.purchasedPlots.has(nStr)) {
          available.add(nStr);
        }
      }
    }
    
    return Array.from(available).map(str => {
      const [x, y] = str.split(',').map(Number);
      return { x, y, cost: this.getPlotCost(x, y) };
    });
  }

  purchasePlot(x, y, generator, isFree = false) {
    const plotStr = `${x},${y}`;
    if (this.purchasedPlots.has(plotStr)) return false;
    
    const cost = this.getPlotCost(x, y);
    if (!isFree && this.points < cost) return false;
    
    if (!isFree) {
        this.points -= cost;
    }
    
    this.purchasedPlots.add(plotStr);
    
    if (generator) {
        generator.generatePlot(x, y);
    }
    
    return true;
  }

  recalibratePlot(x, y, generator) {
    const cost = Math.floor(this.getPlotCost(x, y) * 0.25);
    const finalCost = Math.max(10, cost); // Minimum 10 points
    
    if (this.points < finalCost) return false;
    this.points -= finalCost;

    const minX = x * this.plotSize;
    const maxX = minX + this.plotSize;
    const minY = y * this.plotSize;
    const maxY = minY + this.plotSize;

    // Filter out nodes in this plot
    const nodesToRemove = new Set();
    this.nodes = this.nodes.filter(n => {
        if (n.x >= minX && n.x < maxX && n.y >= minY && n.y < maxY) {
            nodesToRemove.add(n);
            return false;
        }
        return true;
    });

    // Remove any connection touching a removed node
    this.connections = this.connections.filter(c => 
        !nodesToRemove.has(c.source) && !nodesToRemove.has(c.target)
    );

    // Regenerate
    if (generator) {
        generator.generatePlot(x, y);
    }
    return true;
  }

  saveGame() {
    const serializedNodes = this.nodes.map(n => ({
      x: n.x, y: n.y, radius: n.radius, color: n.color, isHub: n.isHub, isOutpost: n.isOutpost
    }));

    const serializedConns = this.connections.map(c => ({
      sourceIndex: this.nodes.indexOf(c.source),
      targetIndex: this.nodes.indexOf(c.target),
      fluxSaturated: c.fluxSaturated,
      saturationLevel: c.saturationLevel
    }));

    const saveData = {
      points: this.points,
      camera: this.camera,
      purchasedPlots: Array.from(this.purchasedPlots),
      chromaBoosts: this.chromaBoosts,
      nodes: serializedNodes,
      connections: serializedConns,
      lastSaveTime: Date.now()
    };

    localStorage.setItem('fluxNetworkSave', JSON.stringify(saveData));
  }

  loadGame() {
    const saved = localStorage.getItem('fluxNetworkSave');
    if (!saved) return false;

    try {
      const data = JSON.parse(saved);
      this.points = data.points || 0;
      this.camera = data.camera || { x: 0, y: 0 };
      this.purchasedPlots = new Set(data.purchasedPlots || []);
      this.chromaBoosts = data.chromaBoosts || {};
      
      this.nodes = (data.nodes || []).map(n => ({...n}));
      
      // Re-map references
      this.connections = (data.connections || []).map(c => ({
        source: this.nodes[c.sourceIndex],
        target: this.nodes[c.targetIndex],
        fluxSaturated: c.fluxSaturated,
        saturationLevel: c.saturationLevel || 0
      })).filter(c => c.source && c.target); // Safety check
      
      return data.lastSaveTime || Date.now();
    } catch (e) {
      console.error("Failed to load save", e);
      return false;
    }
  }
}
