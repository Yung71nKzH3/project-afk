export class EventSystem {
  constructor(game) {
    this.game = game;
    this.activeEvents = []; 
    this.globalMultiplier = 1.0;
    this.multiplierTimer = 0; 
    
    // Spawn timers: between 15s to 45s
    this.timeUntilNextEvent = Math.random() * 30 + 15;
  }
  
  update(deltaTime) {
    const dtSeconds = deltaTime / 1000;
    
    // Update active multiplier timer
    if (this.multiplierTimer > 0) {
        this.multiplierTimer -= dtSeconds;
        if (this.multiplierTimer <= 0) {
            this.globalMultiplier = 1.0;
        }
    }

    // Update existing events (fade out)
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
        const ev = this.activeEvents[i];
        ev.life -= dtSeconds;
        if (ev.life <= 0) {
            this.activeEvents.splice(i, 1);
        }
    }

    // Spawn new events
    this.timeUntilNextEvent -= dtSeconds;
    if (this.timeUntilNextEvent <= 0) {
        this.spawnEvent();
        this.timeUntilNextEvent = Math.random() * 30 + 15;
    }
  }

  spawnEvent() {
    // Spawn within current camera view, padded by 100px so it's not cut off
    const pad = 100;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    
    const x = this.game.camera.x + Math.random() * (vpW - pad * 2) + pad;
    const y = this.game.camera.y + Math.random() * (vpH - pad * 2) + pad;
    
    const isGolden = Math.random() > 0.5; // 50/50 chance
    
    this.activeEvents.push({
        x: x, 
        y: y,
        isGolden: isGolden,
        life: 8, // lives for 8 seconds
        radius: 20,
        spawnTime: performance.now()
    });
  }

  handleEventClick(x, y) {
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
        const ev = this.activeEvents[i];
        // 30px hit radius is slightly generous over 20px visual
        if (Math.hypot(ev.x - x, ev.y - y) <= ev.radius + 15) {
            if (ev.isGolden) {
                this.globalMultiplier = 2.0;
                this.multiplierTimer = 60; // 60 seconds
            } else {
                this.globalMultiplier = 0.5;
                this.multiplierTimer = 60; 
            }
            this.activeEvents.splice(i, 1);
            return true;
        }
    }
    return false;
  }
}
