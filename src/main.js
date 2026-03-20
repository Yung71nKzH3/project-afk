import './style.css';
import { Game } from './engine/Game.js';
import { Renderer } from './engine/Renderer.js';
import { InputHandler } from './engine/InputHandler.js';
import { Generator } from './engine/Generator.js';
import { OfflineManager } from './engine/OfflineManager.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const game = new Game(canvas);
const generator = new Generator(game);
const inputHandler = new InputHandler(canvas, game, generator);

// Sidebar Logic
const sidebar = document.getElementById('sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const upgradeButtons = document.querySelectorAll('.btn-buy-upgrade');

window.game = game;
window.generator = generator;

btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

function syncUpgrades() {
    upgradeButtons.forEach(btn => {
        const color = btn.dataset.color;
        const level = game.chromaBoosts[color] || 0;
        
        // Calculate current cost: 500 * (1.5 ^ level)
        let cost = 500;
        for (let i = 0; i < level; i++) {
            cost = Math.floor(cost * 1.5);
        }
        
        btn.dataset.cost = cost;
        btn.innerText = `Lv.${level} - ${cost} PTS`;
    });
}

upgradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        const cost = parseInt(btn.dataset.cost);
        
        if (game.points >= cost) {
            game.points -= cost;
            
            // Increment boost level
            if (!game.chromaBoosts[color]) game.chromaBoosts[color] = 0;
            game.chromaBoosts[color]++;
            
            // Increase cost
            const newCost = Math.floor(cost * 1.5);
            btn.dataset.cost = newCost;
            const newLevel = game.chromaBoosts[color];
            btn.innerText = `Lv.${newLevel} - ${newCost} PTS`;
        }
    });
});

// Hook up renderer to game loop
const originalLoop = game.loop.bind(game);
game.loop = function(time) {
  originalLoop(time);
  
  // Update upgrade button states
  upgradeButtons.forEach(btn => {
      const cost = parseInt(btn.dataset.cost);
      btn.disabled = game.points < cost;
  });
  
  renderer.render(game, inputHandler, time);
};

const lastSaveTime = game.loadGame();

if (!lastSaveTime) {
    // Initial Generation (clusters) for a new save
    game.purchasePlot(0, 0, generator, true);
} else {
    // Process offline earnings based on the time away
    const offlineManager = new OfflineManager(game, lastSaveTime);
    offlineManager.processOfflineEarnings();
    
    // Sync the UI buttons with loaded boost levels
    syncUpgrades();
}

// Start Game
game.start();

