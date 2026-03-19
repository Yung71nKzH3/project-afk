import './style.css';
import { Game } from './engine/Game.js';
import { Renderer } from './engine/Renderer.js';
import { InputHandler } from './engine/InputHandler.js';
import { Generator } from './engine/Generator.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const game = new Game(canvas);
const inputHandler = new InputHandler(canvas, game);
const generator = new Generator(game);

// Expand Mechanic Logic
let expandCost = 50;
const btnExpand = document.getElementById('btn-expand');
const costSpan = document.getElementById('expand-cost');

btnExpand.addEventListener('click', () => {
    if (game.flux >= expandCost) {
        // Deduct cost
        game.flux -= expandCost;
        
        // Increase cost for next time
        expandCost = Math.floor(expandCost * 1.5);
        costSpan.innerText = expandCost;
        
        // Generate new node cluster somewhere on screen
        const tempHub = generator.spawnNode(window.innerWidth, window.innerHeight, 25, true, null);
        if (tempHub) {
            game.addNode(tempHub);
            const clusterSize = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < clusterSize; i++) {
                const clusterNode = generator.spawnNodeNear(tempHub, 50, 200, 12, tempHub.color);
                if (clusterNode) {
                    game.addNode(clusterNode);
                }
            }
        }
    }
});

// Hook up renderer to game loop
const originalLoop = game.loop.bind(game);
game.loop = function(time) {
  originalLoop(time);
  
  // Update button state
  btnExpand.disabled = game.flux < expandCost;
  
  renderer.render(game, inputHandler, time);
};

// Initial Generation (clusters)
generator.generateInitialNodes(window.innerWidth, window.innerHeight);

// Start Game
game.start();

