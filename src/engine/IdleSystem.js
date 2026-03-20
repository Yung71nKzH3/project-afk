export class IdleSystem {
  constructor(game) {
    this.game = game;
    this.baseFluxRate = 0.5; // per second per standard connection
    this.bloomThreshold = 100; // time in flux-ticks to bloom
  }

  update(deltaTime) {
    const dtSeconds = deltaTime / 1000;
    
    // Process each connection individually to apply modifiers and saturation
    this.game.connections.forEach(conn => {
        
        // 1. Calculate rate
        let currentRate = this.baseFluxRate;
        
        if (conn.source.isOutpost || conn.target.isOutpost) {
            currentRate *= 2.5; // Outposts are highly lucrative
        }
        
        if (conn.source.isHub || conn.target.isHub) {
            currentRate *= 1.5; // Hubs provide a baseline boost
        }

        // Biome Resonance Multiplier
        let biomeMulti = 1.0;
        const srcPlotX = Math.floor(conn.source.x / this.game.plotSize);
        const srcPlotY = Math.floor(conn.source.y / this.game.plotSize);
        // Only one node needs to be in resonance
        if (conn.source.color === this.game.getPlotBiome(srcPlotX, srcPlotY)) {
            biomeMulti = 2.0;
        } else {
            const targetPlotX = Math.floor(conn.target.x / this.game.plotSize);
            const targetPlotY = Math.floor(conn.target.y / this.game.plotSize);
            if (conn.target.color === this.game.getPlotBiome(targetPlotX, targetPlotY)) {
                biomeMulti = 2.0;
            }
        }
        
        // Apply Chroma Boosts (10% per level)
        const boostLevel = this.game.chromaBoosts[conn.source.color] || 0;
        currentRate *= (1 + (boostLevel * 0.1));
        
        // 2. Add Points
        this.game.points += (currentRate * this.game.eventSystem.globalMultiplier * biomeMulti) * dtSeconds;
        
        // 3. Bloom / Saturation Logic
        if (!conn.fluxSaturated) {
            // Initialize if needed
            if (!conn.saturationLevel) conn.saturationLevel = 0;
            
            conn.saturationLevel += dtSeconds * 10; // Saturates over ~10 seconds
            
            if (conn.saturationLevel >= this.bloomThreshold) {
                conn.fluxSaturated = true;
                // Optional: trigger a visual effect on the node here if desired
            }
        }
    });
  }
}
