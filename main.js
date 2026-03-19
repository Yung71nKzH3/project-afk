import './style.css';
import { Game } from './src/engine/Game.js';
import { Renderer } from './src/engine/Renderer.js';
import { InputHandler } from './src/engine/InputHandler.js';
import { Generator } from './src/engine/Generator.js';

document.querySelector('#app').innerHTML = `
  <canvas id="gameCanvas"></canvas>
`;

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const game = new Game(canvas);
const inputHandler = new InputHandler(canvas, game);
const generator = new Generator(game);

// Hook up renderer to game loop
const originalLoop = game.loop.bind(game);
game.loop = function(time) {
  originalLoop(time);
  renderer.render(game, inputHandler);
};

// Initial Generation (clusters)
generator.generateInitialNodes(window.innerWidth, window.innerHeight, 15);

// Start Game
game.start();
