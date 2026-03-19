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
        
        // 2. Add Flux
        this.game.flux += currentRate * dtSeconds;
        
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
