export class OfflineManager {
    constructor(game, lastSaveTime) {
        this.game = game;
        this.lastSaveTime = lastSaveTime;
    }

    processOfflineEarnings() {
        if (!this.lastSaveTime) return 0;
        
        const now = Date.now();
        const deltaMs = now - this.lastSaveTime;
        const deltaSeconds = deltaMs / 1000;
        
        // If less than 60 seconds offline, ignore
        if (deltaSeconds < 60) return 0;
        
        // Cap offline time at 24 hours (86400 seconds)
        const effectiveDelta = Math.min(deltaSeconds, 86400);
        
        // Calculate the rate based on current active connections
        let totalRate = 0;
        for (let conn of this.game.connections) {
            let connRate = 1.0;
            if (conn.source.isOutpost || conn.target.isOutpost) connRate = 2.5;
            
            if (conn.source.isHub || conn.target.isHub) connRate *= 1.5;
            
            // Biome logic
            const srcX = Math.floor(conn.source.x / this.game.plotSize);
            const srcY = Math.floor(conn.source.y / this.game.plotSize);
            const tgtX = Math.floor(conn.target.x / this.game.plotSize);
            const tgtY = Math.floor(conn.target.y / this.game.plotSize);
            
            if (conn.source.color === this.game.getPlotBiome(srcX, srcY) ||
                conn.target.color === this.game.getPlotBiome(tgtX, tgtY)) {
                connRate *= 2.0;
            }
            
            // Boost logic
            const boost = this.game.chromaBoosts[conn.source.color] || 0;
            connRate *= (1 + (boost * 0.1));
            
            totalRate += connRate;
        }

        const earned = totalRate * effectiveDelta;
        
        if (earned > 0) {
            this.game.points += earned;
            this.showPopup(earned, deltaSeconds); // show actual time away
        }
        
        return earned;
    }

    showPopup(earned, deltaSeconds) {
        const timeStr = this.formatTime(deltaSeconds);
        const modalHtml = `
            <div id="offline-modal" class="modal-overlay">
                <div class="modal-content">
                    <h2>Welcome Back!</h2>
                    <p>While you were away for ${timeStr}, your network expanded.</p>
                    <div class="earnings">+${Math.floor(earned).toLocaleString()} PTS</div>
                    <button id="btn-collect-offline">COLLECT</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btn-collect-offline').addEventListener('click', () => {
            const el = document.getElementById('offline-modal');
            if (el) el.remove();
        });
    }
    
    formatTime(seconds) {
        if (seconds < 3600) return Math.floor(seconds/60) + ' minutes';
        const hours = Math.floor(seconds/3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}
