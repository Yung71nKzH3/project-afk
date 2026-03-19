import { IdleSystem } from './IdleSystem.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.nodes = [];
    this.connections = [];
    this.flux = 0;
    this.lastTime = 0;
    this.isRunning = false;
    
    this.idleSystem = new IdleSystem(this);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    
    // Renderer will be called from main.js or here later
    
    requestAnimationFrame((time) => this.loop(time));
  }

  update(deltaTime) {
    this.idleSystem.update(deltaTime);
  }

  addNode(node) {
    this.nodes.push(node);
  }

  addConnection(connection) {
    this.connections.push(connection);
  }
}
