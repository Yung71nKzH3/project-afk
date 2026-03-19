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

  render(game, inputHandler, time) {
    this.clear();
    
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
    
    // Draw UI overlay
    this.drawUI(game.flux);
  }

  drawUI(flux) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px "Inter", sans-serif';
    this.ctx.fillText(`FLUX: ${Math.floor(flux)}`, 20, 40);
  }
}
