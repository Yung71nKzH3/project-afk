export class Generator {
  constructor(game) {
    this.game = game;
    this.colors = ['#00e5ff', '#ff3366', '#bd00ff', '#ffaa00']; // Cyan, Pink, Purple, Orange
  }

  generatePlot(plotX, plotY) {
    const minX = plotX * this.game.plotSize;
    const minY = plotY * this.game.plotSize;
    const maxX = minX + this.game.plotSize;
    const maxY = minY + this.game.plotSize;

    // 1. Generate Hubs (Max 7 clusters per plot as requested)
    // We'll generate 2-3 Hubs per plot, giving 2-3 clusters total. If we want up to 7, maybe 3-5 hubs.
    const numHubs = Math.floor(Math.random() * 3) + 2; // 2 to 4 hubs
    const hubNodes = [];
    
    for (let i = 0; i < numHubs; i++) {
        const hub = this.spawnNode(minX, maxX, minY, maxY, 25, true, null);
        if (hub) {
            hubNodes.push(hub);
            this.game.addNode(hub);
        }
    }

    // 2. Generate Clusters around the Hubs
    hubNodes.forEach(hub => {
        const clusterSize = Math.floor(Math.random() * 3) + 3; // 3 to 5 nodes per cluster
        for (let i = 0; i < clusterSize; i++) {
            const clusterNode = this.spawnNodeNear(hub, minX, maxX, minY, maxY, 100, 250, 12, hub.color);
            if (clusterNode) {
                this.game.addNode(clusterNode);
            }
        }
    });

    // 3. Generate some random "Outpost" nodes
    const numOutposts = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numOutposts; i++) {
        const outpost = this.spawnNode(minX, maxX, minY, maxY, 15, false, null);
        if (outpost) {
            outpost.isOutpost = true; // Special property for 2.5x flux
            this.game.addNode(outpost);
        }
    }
  }

  spawnNode(minX, maxX, minY, maxY, radius, isHub, specificColor) {
    let validPosition = false;
    let newX, newY;
    let attempts = 0;
    
    // Try to place node without overlapping
    while (!validPosition && attempts < 50) {
      newX = Math.random() * (maxX - minX - 100) + minX + 50;
      newY = Math.random() * (maxY - minY - 100) + minY + 50;
      validPosition = this.isValidPosition(newX, newY, radius);
      attempts++;
    }

    if (validPosition) {
      return {
        x: newX,
        y: newY,
        radius: radius,
        color: specificColor || this.colors[Math.floor(Math.random() * this.colors.length)],
        isHub: isHub,
        isOutpost: false
      };
    }
    return null;
  }

  spawnNodeNear(targetNode, minX, maxX, minY, maxY, minRadius, maxRadius, radius, color) {
    let validPosition = false;
    let newX, newY;
    let attempts = 0;

    while (!validPosition && attempts < 50) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (maxRadius - minRadius) + minRadius;
        
        newX = targetNode.x + Math.cos(angle) * distance;
        newY = targetNode.y + Math.sin(angle) * distance;
        
        // Keep inside bounds
        if (newX < minX + 50 || newX > maxX - 50 || newY < minY + 50 || newY > maxY - 50) {
            attempts++;
            continue;
        }

        validPosition = this.isValidPosition(newX, newY, radius);
        attempts++;
    }

    if (validPosition) {
      return {
        x: newX,
        y: newY,
        radius: radius,
        color: color,
        isHub: false,
        isOutpost: false
      };
    }
    return null;
  }

  isValidPosition(x, y, radius) {
    for (let j = 0; j < this.game.nodes.length; j++) {
        const dx = this.game.nodes[j].x - x;
        const dy = this.game.nodes[j].y - y;
        const minDistance = radius + this.game.nodes[j].radius + 30; // Padding
        if (Math.hypot(dx, dy) < minDistance) { 
            return false;
        }
    }
    return true;
  }
}
