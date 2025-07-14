// Point d'entrée principal de l'application Pokémon TCG
import { apiService } from './services/apiService.js';
import { storageService } from './services/storageService.js';
import { dragDropService } from './services/dragDropService.js';
import { gameController } from './controllers/gameController.js';
import { battleController } from './controllers/battleController.js';
import { gameStateService } from './services/gameStateService.js';
import { battleService } from './services/battleService.js';
import { commentService } from './services/commentService.js';
import { notificationService } from './services/notificationService.js';

console.log('Application Pokémon TCG initialisée');

// Initialisation de l'application
async function initApp() {
    console.log('Initialisation de l\'application...');
    
    // Vérifier la connectivité de l'API
    await checkApiConnection();
    
    // Charger les données sauvegardées
    loadGameData();
    
    // Initialiser le service de drag & drop
    dragDropService.init();
    
    // Initialiser les contrôleurs
    gameController.init();
    battleController.init();
    
    // Mettre à jour l'interface
    gameController.updateUI();
    
    // Restaurer l'état du combat si nécessaire
    restoreBattleState();
    
    console.log('Application initialisée avec succès');
}

// Vérifier la connectivité de l'API
async function checkApiConnection() {
    try {
        const isConnected = await apiService.testConnection();
        if (isConnected) {
            console.log('✅ Connexion à l\'API Pokémon TCG établie');
        } else {
            console.warn('⚠️ Problème de connexion à l\'API, utilisation du mode hors ligne');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'API:', error);
    }
}

// Charger les données de jeu
function loadGameData() {
    try {
        gameStateService.loadGameData();
        battleService.loadBattleState();
        console.log('✅ Données chargées depuis le LocalStorage');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.log('Démarrage avec un état vide');
    }
}

// Restaurer l'état du combat si nécessaire
function restoreBattleState() {
    // Toujours recharger l'état du combat depuis le localStorage
    battleService.loadBattleState();
    if (battleService.isInBattle()) {
        // Afficher la section de combat
        const battleSection = document.getElementById('battle-section');
        const gameArea = document.querySelector('.game-area');
        
        if (battleSection && gameArea) {
            gameArea.style.display = 'none';
            battleSection.style.display = 'flex';
            
            // Réinitialiser l'affichage du combat
            battleController.initBattle();
        }
    } else {
        // Afficher la zone de jeu normale
        const battleSection = document.getElementById('battle-section');
        const gameArea = document.querySelector('.game-area');
        
        if (battleSection && gameArea) {
            battleSection.style.display = 'none';
            gameArea.style.display = 'grid';
        }
    }
}

// Gestionnaire de nettoyage avant fermeture
function cleanup() {
    console.log('Nettoyage de l\'application...');
    gameController.cleanup();
    dragDropService.cleanup();
    notificationService.hideAll();
}

// Écouter les événements de fermeture de page
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

// Démarrer l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, démarrage de l\'application...');
    initApp();
}); 