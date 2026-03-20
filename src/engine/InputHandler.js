export class InputHandler {
  constructor(canvas, game, generator) {
    this.canvas = canvas;
    this.game = game;
    this.generator = generator;
    this.isDragging = false;
    this.activeNode = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isValidDrag = true;
    
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    this.init();
  }

  init() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });
  }

  onMouseWheel(e) {
    if (document.getElementById('recal-modal')) return;
    e.preventDefault();
    
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    
    let newZoom = this.game.camera.zoom * (1 + delta);
    newZoom = Math.max(0.2, Math.min(newZoom, 3.0));
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // World coordinates before zoom
    const worldX = (mouseX / this.game.camera.zoom) + this.game.camera.x;
    const worldY = (mouseY / this.game.camera.zoom) + this.game.camera.y;
    
    this.game.camera.zoom = newZoom;
    
    // Adjust camera to keep mouse over same world coordinates
    this.game.camera.x = worldX - (mouseX / newZoom);
    this.game.camera.y = worldY - (mouseY / newZoom);
  }

  onMouseDown(e) {
    if (document.getElementById('recal-modal')) return;
    
    if (e.button === 2) {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const x = (mouseX / this.game.camera.zoom) + this.game.camera.x;
    const y = (mouseY / this.game.camera.zoom) + this.game.camera.y;

    // Check for Event interaction first
    if (this.game.eventSystem.handleEventClick(x, y)) {
        return; // Successfully clicked an event
    }
    
    // Check if clicked a RECAL button on purchased plots
    for (let plotStr of this.game.purchasedPlots) {
        const [px, py] = plotStr.split(',').map(Number);
        if (px === 0 && py === 0) continue; // Origin has no recal button
        
        const topX = px * this.game.plotSize + this.game.plotSize - 60;
        const topY = py * this.game.plotSize + 60;
        
        const dist = Math.hypot(topX - x, topY - y);
        if (dist < 40) {
            const cost = Math.max(10, Math.floor(this.game.getPlotCost(px, py) * 0.25));
            if (this.game.points >= cost) {
                this.promptRecalibrate(px, py, cost);
            }
            return; // Absorb click
        }
    }

    // Check if clicked an available plot 'Claim' button
    const availablePlots = this.game.getAvailablePlots();
    for (let p of availablePlots) {
      const centerX = p.x * this.game.plotSize + this.game.plotSize / 2;
      const centerY = p.y * this.game.plotSize + this.game.plotSize / 2;
      
      if (Math.hypot(centerX - x, centerY - y) < 50) {
          if (this.game.points >= p.cost) {
              this.game.purchasePlot(p.x, p.y, this.generator);
          }
          return; // Stop processing click
      }
    }

    // Find clicked node
    for (let node of this.game.nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < node.radius + 5) {
        this.isDragging = true;
        this.activeNode = node;
        this.mouseX = x;
        this.mouseY = y;
        break;
      }
    }
  }

  onMouseMove(e) {
    if (this.isPanning) {
      const dx = (e.clientX - this.lastPanX) / this.game.camera.zoom;
      const dy = (e.clientY - this.lastPanY) / this.game.camera.zoom;
      this.game.camera.x -= dx;
      this.game.camera.y -= dy;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }

    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    this.mouseX = (mouseX / this.game.camera.zoom) + this.game.camera.x;
    this.mouseY = (mouseY / this.game.camera.zoom) + this.game.camera.y;

    // Check if current drag line crosses any existing connection
    this.isValidDrag = true;
    for (let c of this.game.connections) {
      if (this.doIntersect(
        this.activeNode.x, this.activeNode.y,
        this.mouseX, this.mouseY,
        c.source.x, c.source.y,
        c.target.x, c.target.y
      )) {
        this.isValidDrag = false;
        break;
      }
    }
  }

  onMouseUp(e) {
    if (e.button === 2) {
      this.isPanning = false;
      return;
    }

    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const x = (mouseX / this.game.camera.zoom) + this.game.camera.x;
    const y = (mouseY / this.game.camera.zoom) + this.game.camera.y;

    // Check if released on a valid target node
    let targetNode = null;
    for (let node of this.game.nodes) {
      if (node === this.activeNode) continue; // Skip self
      
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < node.radius + 5) {
        targetNode = node;
        break;
      }
    }

    if (targetNode) {
      // Validate connection (must be same color, not already connected)
      if (targetNode.color === this.activeNode.color) {
        const connectionExists = this.game.connections.some(c => 
          (c.source === this.activeNode && c.target === targetNode) ||
          (c.source === targetNode && c.target === this.activeNode)
        );
        
        if (!connectionExists) {
            
          // Final check for crossing lines
          let crosses = false;
          for (let c of this.game.connections) {
            // Ignore connections sharing either endpoint (they meet at a node, not cross in space)
            if (c.source === this.activeNode || c.source === targetNode ||
                c.target === this.activeNode || c.target === targetNode) continue;

            if (this.doIntersect(
                this.activeNode.x, this.activeNode.y,
                targetNode.x, targetNode.y,
                c.source.x, c.source.y,
                c.target.x, c.target.y
            )) {
                crosses = true;
                break;
            }
          }

          if (!crosses) {
            this.game.addConnection({
              source: this.activeNode,
              target: targetNode,
              fluxSaturated: false // For idle mechanic later
            });
          } else {
             // Optional: trigger error sound or shake
             console.log("Lines cannot cross!");
          }
        }
      }
    }

    // Reset
    this.isDragging = false;
    this.activeNode = null;
    this.isValidDrag = true;
  }

  // Mathematics: Line Segments Intersection
  // Returns true if line segment 'p1q1' and 'p2q2' intersect.
  doIntersect(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
    const p1 = { x: p1x, y: p1y };
    const q1 = { x: q1x, y: q1y };
    const p2 = { x: p2x, y: p2y };
    const q2 = { x: q2x, y: q2y };

    const o1 = this.orientation(p1, q1, p2);
    const o2 = this.orientation(p1, q1, q2);
    const o3 = this.orientation(p2, q2, p1);
    const o4 = this.orientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4) return true;

    return false; // Not checking colinear overlap for simplicity in a game
  }

  orientation(p, q, r) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val == 0) return 0; // collinear
    return (val > 0) ? 1 : 2; // clock or counterclock wise
  }

  promptRecalibrate(px, py, cost) {
    const modalHtml = `
        <div id="recal-modal" class="modal-overlay">
            <div class="modal-content danger">
                <h2>Recalibrate Plot?</h2>
                <p>This will destroy all nodes and connections within this sector and generate new ones.</p>
                <div style="margin-bottom: 20px; color: #ff3366;">Cost: ${cost.toLocaleString()} PTS</div>
                <button id="btn-cancel-recal">CANCEL</button>
                <button id="btn-confirm-recal" class="danger">CONFIRM</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('btn-cancel-recal').addEventListener('click', () => {
        const el = document.getElementById('recal-modal');
        if (el) el.remove();
    });
    
    document.getElementById('btn-confirm-recal').addEventListener('click', () => {
        this.game.recalibratePlot(px, py, this.generator);
        const el = document.getElementById('recal-modal');
        if (el) el.remove();
    });
  }
}
