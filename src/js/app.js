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

// Exposer les contrôleurs et services globalement pour l'accès cross-controller
window.gameController = gameController;
window.battleController = battleController;
window.battleService = battleService;

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
    
    // Restaurer l'état du combat si nécessaire (après l'initialisation des contrôleurs)
    setTimeout(() => {
        restoreBattleState();
    }, 100);
    
    console.log('Application initialisée avec succès');
}

// Vérifier la connectivité de l'API locale
async function checkApiConnection() {
    try {
        // Forcer l'utilisation du mode local
        apiService.setLocalMode(true);
        console.log('✅ Mode API locale activé');
        
        // Charger les cartes locales pour vérifier qu'elles sont disponibles
        const cards = await apiService.loadLocalCards();
        console.log(`✅ ${cards.length} cartes locales chargées avec succès`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des cartes locales:', error);
    }
}

// Charger les données de jeu
function loadGameData() {
    try {
        gameStateService.loadGameData();
        console.log('✅ Données chargées depuis le LocalStorage');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.log('Démarrage avec un état vide');
    }
}

// Restaurer l'état du combat si nécessaire
function restoreBattleState() {
    try {
        console.log('=== RESTAURATION DE L\'ÉTAT DU COMBAT ===');
        
        // Charger l'état du combat depuis le localStorage
        battleService.loadBattleState();
        const isInBattle = battleService.isInBattle();
        console.log('État du combat chargé:', isInBattle);
        console.log('Données de combat:', {
            opponentHand: battleService.getOpponentHand().length,
            opponentDeck: battleService.getOpponentDeck().length,
            opponentDiscard: battleService.getOpponentDiscard().length,
            battlePlayerCard: battleService.getBattlePlayerCard() ? 'présente' : 'absente',
            opponentBattleCard: battleService.getOpponentBattleCard() ? 'présente' : 'absente'
        });
        
        if (isInBattle) {
            console.log('Restauration du mode combat...');
            // Afficher la section de combat
            const battleSection = document.getElementById('battle-section');
            const gameArea = document.querySelector('.game-area');
            
            if (battleSection && gameArea) {
                gameArea.style.display = 'none';
                battleSection.style.display = 'flex';
                
                // Réinitialiser l'affichage du combat
                battleController.initBattle().then(() => {
                    console.log('Mode combat restauré avec succès');
                    notificationService.info('Mode combat restauré');
                }).catch(error => {
                    console.error('Erreur lors de la restauration du combat:', error);
                    notificationService.error('Erreur lors de la restauration du combat');
                });
            } else {
                console.error('Éléments DOM manquants pour la restauration du combat');
            }
        } else {
            console.log('Affichage du mode normal...');
            // Afficher la zone de jeu normale
            const battleSection = document.getElementById('battle-section');
            const gameArea = document.querySelector('.game-area');
            
            if (battleSection && gameArea) {
                battleSection.style.display = 'none';
                gameArea.style.display = 'grid';
            }
        }
        
        console.log('=== FIN DE LA RESTAURATION ===');
    } catch (error) {
        console.error('Erreur lors de la restauration de l\'état du combat:', error);
        // En cas d'erreur, afficher le mode normal
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