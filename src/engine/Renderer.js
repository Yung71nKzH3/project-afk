export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCallback = null;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.resizeCallback) {
      this.resizeCallback();
    }
  }

  clear() {
    this.ctx.fillStyle = '#1a1a2e'; // Dark navy premium background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawNode(node) {
    this.ctx.beginPath();
    
    if (node.isOutpost) {
      // Draw diamond for outpost
      this.ctx.moveTo(node.x, node.y - node.radius);
      this.ctx.lineTo(node.x + node.radius, node.y);
      this.ctx.lineTo(node.x, node.y + node.radius);
      this.ctx.lineTo(node.x - node.radius, node.y);
      this.ctx.closePath();
    } else {
      // Draw circle for normal nodes and hubs
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    }
    
    // Glow effect
    this.ctx.shadowBlur = node.isHub ? 30 : 15;
    this.ctx.shadowColor = node.color;
    
    this.ctx.fillStyle = node.color;
    this.ctx.fill();
    
    // Core (lighter)
    this.ctx.beginPath();
    if (node.isOutpost) {
      const coreR = node.radius * 0.4;
      this.ctx.moveTo(node.x, node.y - coreR);
      this.ctx.lineTo(node.x + coreR, node.y);
      this.ctx.lineTo(node.x, node.y + coreR);
      this.ctx.lineTo(node.x - coreR, node.y);
      this.ctx.closePath();
    } else {
      this.ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    
    // Hub extra ring
    if (node.isHub) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = node.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.globalAlpha = 0.5;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  drawConnection(conn, time) {
    this.ctx.beginPath();
    this.ctx.moveTo(conn.source.x, conn.source.y);
    this.ctx.lineTo(conn.target.x, conn.target.y);
    
    // Line style based on saturation
    this.ctx.strokeStyle = conn.source.color;
    this.ctx.lineWidth = conn.fluxSaturated ? 5 : 3;
    
    // Connecting glow and pulse if saturated
    let alpha = 0.6;
    let blur = 10;
    
    if (conn.fluxSaturated) {
        // Sine wave pulse based on time
        const pulse = (Math.sin(time / 200) + 1) / 2; // 0 to 1
        alpha = 0.6 + (pulse * 0.4); // 0.6 to 1.0
        blur = 15 + (pulse * 10);    // 15 to 25
    }

    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = conn.source.color;
    this.ctx.globalAlpha = alpha;
    
    this.ctx.stroke();
    
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;
  }

  drawActiveLine(startX, startY, endX, endY, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 10]); // Dashed line for active drag
    
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset
  }

  drawPlots(game) {
    this.ctx.lineWidth = 2;
    // Draw bought plots boundaries
    for (let plotStr of game.purchasedPlots) {
        const [px, py] = plotStr.split(',').map(Number);
        const biomeColor = game.getPlotBiome(px, py);
        
        if (biomeColor === 'neutral') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        } else {
            // Draw faint colored background based on biome
            this.ctx.fillStyle = biomeColor;
            this.ctx.globalAlpha = 0.05; // very faint
            this.ctx.fillRect(px * game.plotSize, py * game.plotSize, game.plotSize, game.plotSize);
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.strokeStyle = biomeColor;
            this.ctx.globalAlpha = 0.2;
        }
        
        this.ctx.strokeRect(px * game.plotSize, py * game.plotSize, game.plotSize, game.plotSize);
        this.ctx.globalAlpha = 1.0; // reset
        
        // Draw RECAL button
        if (px !== 0 || py !== 0) { // Keep origin pristine
            const cost = Math.max(10, Math.floor(game.getPlotCost(px, py) * 0.25));
            const canAfford = game.points >= cost;
            
            const topX = px * game.plotSize + game.plotSize - 60;
            const topY = py * game.plotSize + 60;
            
            this.ctx.fillStyle = canAfford ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)';
            this.ctx.beginPath();
            this.ctx.arc(topX, topY, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeStyle = canAfford ? 'rgba(255, 51, 102, 0.8)' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.stroke();
            
            // Icon
            this.ctx.fillStyle = canAfford ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '14px "Inter", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`R`, topX, topY);
            
            this.ctx.font = '10px "Inter", sans-serif';
            this.ctx.fillText(`${cost}`, topX, topY + 30);
            this.ctx.textAlign = 'left';
        }
    }
    
    // Draw available plots
    const available = game.getAvailablePlots();
    for (let p of available) {
        // Draw dashed border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.setLineDash([15, 15]);
        this.ctx.strokeRect(p.x * game.plotSize, p.y * game.plotSize, game.plotSize, game.plotSize);
        this.ctx.setLineDash([]);
        
        // Draw "Claim" Icon
        const centerX = p.x * game.plotSize + game.plotSize / 2;
        const centerY = p.y * game.plotSize + game.plotSize / 2;
        
        const canAfford = game.points >= p.cost;
        
        this.ctx.fillStyle = canAfford ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = canAfford ? 'rgba(0, 229, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
        this.ctx.stroke();
        
        this.ctx.fillStyle = canAfford ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '16px "Inter", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`CLAIM`, centerX, centerY - 10);
        this.ctx.font = '14px "Inter", sans-serif';
        this.ctx.fillText(`${p.cost} PTS`, centerX, centerY + 15);
        this.ctx.textAlign = 'left'; // Reset
    }
  }

  drawEvents(game, time) {
    for (let ev of game.eventSystem.activeEvents) {
        this.ctx.beginPath();
        this.ctx.arc(ev.x, ev.y, ev.radius, 0, Math.PI * 2);
        
        const isGolden = ev.isGolden;
        const color = isGolden ? '#ffcc00' : '#b87333'; // Bright gold vs dim bronze
        const pulseSpeed = isGolden ? 150 : 400; // Golden pulses faster
        
        const pulse = (Math.sin(time / pulseSpeed) + 1) / 2; // 0 to 1
        
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.5 + (pulse * 0.5);
        this.ctx.shadowBlur = 15 + (pulse * 25);
        this.ctx.shadowColor = color;
        this.ctx.fill();
        
        // Inner core
        this.ctx.beginPath();
        this.ctx.arc(ev.x, ev.y, ev.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
        this.ctx.fill();
    }
  }

  render(game, inputHandler, time) {
    this.clear();
    
    this.ctx.save();
    // Move the world according to camera
    this.ctx.scale(game.camera.zoom, game.camera.zoom);
    this.ctx.translate(-game.camera.x, -game.camera.y);
    
    // Draw Plot Boundaries
    this.drawPlots(game);
    
    // Draw Reaction Events
    this.drawEvents(game, time);
    
    // Draw all active connections (pass time for pulsing)
    game.connections.forEach(conn => this.drawConnection(conn, time));
    
    // Draw active drag line
    if (inputHandler.isDragging && inputHandler.activeNode) {
       const dragColor = inputHandler.isValidDrag ? inputHandler.activeNode.color : '#ff0000';
       this.drawActiveLine(
         inputHandler.activeNode.x, 
         inputHandler.activeNode.y, 
         inputHandler.mouseX, 
         inputHandler.mouseY, 
         dragColor
       );
    }

    // Draw nodes on top
    game.nodes.forEach(node => this.drawNode(node));
    
    this.ctx.restore();
    
    // Draw UI overlay
    this.drawUI(game);
  }

  drawUI(game) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px "Inter", sans-serif';
    this.ctx.fillText(`POINTS: ${Math.floor(game.points)}`, 20, 40);
    
    if (game.eventSystem.globalMultiplier !== 1.0) {
        this.ctx.fillStyle = game.eventSystem.globalMultiplier > 1 ? '#00ffaa' : '#ff3366';
        this.ctx.font = '18px "Inter", sans-serif';
        this.ctx.fillText(`RATE x${game.eventSystem.globalMultiplier} (${Math.ceil(game.eventSystem.multiplierTimer)}s)`, 20, 70);
    }
  }
}
