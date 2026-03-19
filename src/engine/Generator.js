export class Generator {
  constructor(game) {
    this.game = game;
    this.colors = ['#00e5ff', '#ff3366', '#bd00ff', '#ffaa00']; // Cyan, Pink, Purple, Orange
  }

  generateInitialNodes(canvasWidth, canvasHeight) {
    // 1. Generate a few Central Hubs (Large, source of clusters)
    const numHubs = 3;
    const hubNodes = [];
    
    for (let i = 0; i < numHubs; i++) {
        const hub = this.spawnNode(canvasWidth, canvasHeight, 25, true, null);
        if (hub) {
            hubNodes.push(hub);
            this.game.addNode(hub);
        }
    }

    // 2. Generate Clusters around the Hubs (Matching colors near hubs)
    hubNodes.forEach(hub => {
        const clusterSize = Math.floor(Math.random() * 3) + 3; // 3 to 5 nodes per cluster
        for (let i = 0; i < clusterSize; i++) {
            const clusterNode = this.spawnNodeNear(hub, 100, 250, 12, hub.color);
            if (clusterNode) {
                this.game.addNode(clusterNode);
            }
        }
    });

    // 3. Generate some random "Outpost" nodes (Far away, independent colors)
    const numOutposts = 5;
    for (let i = 0; i < numOutposts; i++) {
        const outpost = this.spawnNode(canvasWidth, canvasHeight, 15, false, null);
        if (outpost) {
            outpost.isOutpost = true; // Special property for 2x flux
            this.game.addNode(outpost);
        }
    }
  }

  spawnNode(maxWidth, maxHeight, radius, isHub, specificColor) {
    let validPosition = false;
    let newX, newY;
    let attempts = 0;
    
    // Try to place node without overlapping
    while (!validPosition && attempts < 50) {
      newX = Math.random() * (maxWidth - 100) + 50;
      newY = Math.random() * (maxHeight - 100) + 50;
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

  spawnNodeNear(targetNode, minRadius, maxRadius, radius, color) {
    let validPosition = false;
    let newX, newY;
    let attempts = 0;

    while (!validPosition && attempts < 50) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (maxRadius - minRadius) + minRadius;
        
        newX = targetNode.x + Math.cos(angle) * distance;
        newY = targetNode.y + Math.sin(angle) * distance;
        
        // Keep inside bounds (lazy check)
        if (newX < 50 || newX > window.innerWidth - 50 || newY < 50 || newY > window.innerHeight - 50) {
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
