// Contrôleur pour gérer l'interface et la logique principale du jeu
import { apiService } from '../services/apiService.js';
import { cardService } from '../services/cardService.js';
import { dragDropService } from '../services/dragDropService.js';
import { gameStateService } from '../services/gameStateService.js';

class GameController {
    constructor() {
        this.isInitialized = false;
        this.drawTimer = null;
    }

    // Initialiser le contrôleur de jeu
    async init() {
        if (this.isInitialized) return;
        this.setupEventListeners();
        this.startDrawTimer();
        this.isInitialized = true;

        // Forcer l'utilisation du mode local
        apiService.setLocalMode(true);
        
        // Désactiver le bouton de tirage pendant le chargement initial
        const drawButton = document.getElementById('draw-button');
        if (drawButton) {
            drawButton.disabled = true;
            drawButton.textContent = 'Chargement des cartes locales...';
            drawButton.classList.add('loading');
        }

        // Précharger les cartes locales
        try {
            await apiService.loadLocalCards();
            if (drawButton) {
                drawButton.disabled = false;
                drawButton.textContent = 'Tirer 5 cartes';
                drawButton.classList.remove('loading');
            }
        } catch (e) {
            if (drawButton) {
                drawButton.disabled = false;
                drawButton.textContent = 'Mode hors ligne';
                drawButton.classList.remove('loading');
            }
        }
    }

    // Configurer les écouteurs d'événements
    setupEventListeners() {
        // Bouton de tirage
        const drawButton = document.getElementById('draw-button');
        if (drawButton) {
            drawButton.addEventListener('click', () => this.handleDrawButtonClick());
        }

        // Écouter les événements de déplacement de cartes
        document.addEventListener('cardMoved', (event) => {
            const { fromLocation, toLocation, cardIndex, cardData } = event.detail;
            this.handleCardMove(fromLocation, toLocation, cardIndex, cardData);
        });

        // Écouter les événements de fin de section de combat
        window.addEventListener('battleSectionHidden', () => {
            this.updateUI();
        });

        // Afficher les instructions de drag & drop au premier chargement
        if (!localStorage.getItem('dragDropInstructionsShown')) {
            setTimeout(() => {
                localStorage.setItem('dragDropInstructionsShown', 'true');
            }, 2000);
        }
    }

    // Gestionnaire d'événement pour le bouton de tirage
    async handleDrawButtonClick() {
        
        if (!gameStateService.canDrawCards()) {
            return;
        }
        
        // Désactiver le bouton pendant le tirage
        const drawButton = document.getElementById('draw-button');
        drawButton.disabled = true;
        drawButton.textContent = 'Tirage en cours...';
        drawButton.classList.add('loading');
        
        try {
            // Récupérer 5 cartes depuis l'API
            const newCards = await apiService.getRandomCards(5);
            
            // Ajouter les cartes à la pioche
            gameStateService.addCardsToDeck(newCards);

            // Ajouter exactement 5 cartes au deck de l'IA (remplace le deck)
            
            if (window.battleService && typeof window.battleService.setOpponentDeck === 'function') {
                await window.battleService.setOpponentDeck(5);
                
                // Compléter la main de l'IA avec des cartes du deck si nécessaire
                if (typeof window.battleService.fillOpponentHandFromDeck === 'function') {
                    window.battleService.fillOpponentHandFromDeck();
                }
            } else if (typeof battleService !== 'undefined' && typeof battleService.setOpponentDeck === 'function') {
                await battleService.setOpponentDeck(5);
                
                // Compléter la main de l'IA avec des cartes du deck si nécessaire
                if (typeof battleService.fillOpponentHandFromDeck === 'function') {
                    battleService.fillOpponentHandFromDeck();
                }
            } else {
                // Suppression totale des appels console
            }
            
            // Mettre à jour l'interface
            this.updateUI();

            // Si on est sur la page combat, rafraîchir l'affichage combat
            const battleSection = document.getElementById('battle-section');
            if (battleSection && battleSection.style.display !== 'none' && window.battleController) {
                window.battleController.displayBattleCards();
            }
            
            // Réactiver le bouton
            drawButton.classList.remove('loading');
            
        } catch (error) {
            // Suppression totale des appels console
            
            // En cas d'erreur, utiliser des cartes factices
            const offlineCards = [];
            for (let i = 0; i < 5; i++) {
                offlineCards.push({
                    id: `offline-card-${Date.now()}-${i}`,
                    name: `Pokémon ${i + 1}`,
                    type: 'Normal',
                    hp: Math.floor(Math.random() * 100) + 50,
                    imageUrl: null
                });
            }
            
            gameStateService.addCardsToDeck(offlineCards);
            this.updateUI();
            
            // Réactiver le bouton
            drawButton.classList.remove('loading');
            // Suppression totale des appels console
        }
    }

    // Gérer le déplacement d'une carte
    handleCardMove(fromLocation, toLocation, cardIndex, cardData) {
        // Sécurité : ne rien faire si cardData ou cardData.id est manquant
        if (!cardData || !cardData.id) return;
        try {
            // Déplacer la carte
            const success = gameStateService.moveCard(fromLocation, toLocation, cardData.id);
            if (success) {
                this.updateUI();
            } else {
                // Suppression totale des logs/erreurs
            }
        } catch (error) {
            // Suppression totale des logs/erreurs
        }
    }

    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les compteurs
        this.updateCounters();
        
        // Mettre à jour l'état du bouton de tirage
        this.updateDrawButton();
        
        // Afficher les cartes
        this.displayCards();
        
        // Mettre à jour les zones de drop
        dragDropService.updateDropZones();
        
    }

    // Mettre à jour les compteurs
    updateCounters() {
        const handCount = document.getElementById('hand-count');
        const deckCount = document.getElementById('deck-count');
        
        if (handCount) handCount.textContent = gameStateService.getHand().length;
        if (deckCount) deckCount.textContent = gameStateService.getDeck().length;
    }

    // Mettre à jour l'état du bouton de tirage
    updateDrawButton() {
        const drawButton = document.getElementById('draw-button');
        const canDraw = gameStateService.canDrawCards();
        
        if (drawButton) {
            drawButton.disabled = !canDraw;
            
            if (canDraw) {
                drawButton.textContent = 'Tirer 5 cartes';
            } else {
                drawButton.textContent = 'Tirage en cours...';
            }
        }
    }

    // Afficher les cartes dans l'interface
    displayCards() {
        const deckContainer = document.getElementById('deck-container');
        const handContainer = document.getElementById('hand-container');
        
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        
        // Afficher les cartes de la pioche
        if (deckContainer) {
            cardService.displayCardsInContainer(deckContainer, deck, 'deck');
        }
        
        // Afficher les cartes de la main
        if (handContainer) {
            cardService.displayCardsInContainer(handContainer, hand, 'hand');
        }
    }

    // Démarrer le timer de tirage
    startDrawTimer() {
        this.drawTimer = setInterval(() => {
            this.updateDrawTimer();
            this.updateDrawButton();
        }, 1000); // Mise à jour toutes les secondes
    }

    // Mettre à jour l'affichage du timer
    updateDrawTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = gameStateService.formatTimeRemaining();
        }
    }

    // Arrêter le timer de tirage
    stopDrawTimer() {
        if (this.drawTimer) {
            clearInterval(this.drawTimer);
            this.drawTimer = null;
        }
    }

    // Vérifier la connectivité de l'API locale
    async checkApiConnection() {
        try {
            // Forcer l'utilisation du mode local
            apiService.setLocalMode(true);
            const cards = await apiService.loadLocalCards();
        } catch (error) {
            // Suppression totale des appels console
        }
    }

    // Charger les données de jeu
    loadGameData() {
        const success = gameStateService.loadGameData();
        if (success) {
            this.updateUI();
        }
    }

    // Nettoyer le contrôleur
    cleanup() {
        this.stopDrawTimer();
        this.isInitialized = false;
    }
}

// Exporter une instance unique du contrôleur
export const gameController = new GameController(); 