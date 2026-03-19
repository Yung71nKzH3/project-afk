export class InputHandler {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.isDragging = false;
    this.activeNode = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isValidDrag = true;

    this.init();
  }

  init() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

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
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
}
