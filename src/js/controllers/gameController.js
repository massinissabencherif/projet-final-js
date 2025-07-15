// Contrôleur pour gérer l'interface et la logique principale du jeu
import { apiService } from '../services/apiService.js';
import { cardService } from '../services/cardService.js';
import { dragDropService } from '../services/dragDropService.js';
import { gameStateService } from '../services/gameStateService.js';
import { notificationService } from '../services/notificationService.js';

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
        console.log('Contrôleur de jeu initialisé');

        // Désactiver le bouton de tirage tant que les cartes ne sont pas prêtes
        const drawButton = document.getElementById('draw-button');
        if (drawButton) {
            if (!apiService.areCardsCached()) {
                drawButton.disabled = true;
                drawButton.textContent = 'Chargement des cartes...';
                drawButton.classList.add('loading');
            } else {
                drawButton.disabled = false;
                drawButton.textContent = 'Tirer 5 cartes';
                drawButton.classList.remove('loading');
            }
        }

        // Précharger les cartes si besoin, sans bloquer l'UI
        if (!apiService.areCardsCached()) {
            try {
                await apiService.getRandomCards(1); // Déclenche le cache
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
                notificationService.warning('⚠️ Impossible de charger les cartes depuis l\'API. Mode hors ligne activé.');
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
                notificationService.info('💡 Astuce : Glissez-déposez les cartes entre la pioche et la main !');
                localStorage.setItem('dragDropInstructionsShown', 'true');
            }, 2000);
        }
    }

    // Gestionnaire d'événement pour le bouton de tirage
    async handleDrawButtonClick() {
        console.log('Tentative de tirage de cartes...');
        
        if (!gameStateService.canDrawCards()) {
            console.log('Tirage impossible : cooldown actif');
            return;
        }
        
        // Désactiver le bouton pendant le tirage
        const drawButton = document.getElementById('draw-button');
        drawButton.disabled = true;
        drawButton.textContent = 'Tirage en cours...';
        drawButton.classList.add('loading');
        
        try {
            // Récupérer 5 cartes depuis l'API
            console.log('Récupération de 5 cartes depuis l\'API...');
            const newCards = await apiService.getRandomCards(5);
            
            // Ajouter les cartes à la pioche
            gameStateService.addCardsToDeck(newCards);
            
            console.log(`✅ ${newCards.length} cartes ajoutées à la pioche`);
            
            // Mettre à jour l'interface
            this.updateUI();

            // Si on est sur la page combat, rafraîchir l'affichage combat
            const battleSection = document.getElementById('battle-section');
            if (battleSection && battleSection.style.display !== 'none' && window.battleController) {
                window.battleController.displayBattleCards();
            }
            
            // Réactiver le bouton
            drawButton.classList.remove('loading');
            notificationService.success(`✅ ${newCards.length} cartes ajoutées à votre pioche !`);
            
        } catch (error) {
            console.error('❌ Erreur lors du tirage de cartes:', error);
            
            // En cas d'erreur, utiliser des cartes factices
            console.log('Utilisation de cartes factices en mode hors ligne...');
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
            notificationService.warning(`⚠️ Mode hors ligne : ${5} cartes factices ajoutées`);
        }
    }

    // Gérer le déplacement d'une carte
    handleCardMove(fromLocation, toLocation, cardIndex, cardData) {
        console.log(`Gestion du déplacement: ${fromLocation} -> ${toLocation} (index: ${cardIndex})`);
        console.log('État avant déplacement:', {
            deck: gameStateService.getDeck().length,
            hand: gameStateService.getHand().length,
            cardToMove: cardData.name
        });

        try {
            // Déplacer la carte
            const success = gameStateService.moveCard(fromLocation, toLocation, cardData.id);
            
            if (success) {
                console.log('État après déplacement:', {
                    deck: gameStateService.getDeck().length,
                    hand: gameStateService.getHand().length
                });

                // Mettre à jour l'interface
                this.updateUI();

                // Notification de succès
                notificationService.success(`✅ ${cardData.name} déplacé vers la ${toLocation === 'hand' ? 'main' : 'pioche'}`);

                console.log(`Carte déplacée avec succès: ${cardData.name}`);
            } else {
                notificationService.error('❌ Erreur lors du déplacement de la carte');
            }

        } catch (error) {
            console.error('Erreur lors du déplacement de la carte:', error);
            notificationService.error('❌ Erreur lors du déplacement de la carte');
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
        
        console.log('Interface utilisateur mise à jour');
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
        
        console.log('Affichage des cartes:');
        console.log('Pioche:', deck.map((c, i) => `${i}: ${c.name}`));
        console.log('Main:', hand.map((c, i) => `${i}: ${c.name}`));
        
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

    // Vérifier la connectivité de l'API
    async checkApiConnection() {
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