// Contrôleur pour gérer l'interface et la logique de la section de combat
import { battleService } from '../services/battleService.js';
import { cardService } from '../services/cardService.js';
import { commentService } from '../services/commentService.js';
import { gameStateService } from '../services/gameStateService.js';
import { dragDropService } from '../services/dragDropService.js';

class BattleController {
    constructor() {
        this.isInitialized = false;
        this.dragListenersAdded = false;
    }

    // Initialiser le contrôleur de combat
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
    }

    // Configurer les écouteurs d'événements
    setupEventListeners() {
        // Bouton de démarrage du combat
        const startBattleBtn = document.getElementById('start-battle-btn');
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => this.showBattleSection());
        }

        // Gestion de la modal de détails de carte
        this.setupModalEvents();
    }

    // Configurer les événements de la modal
    setupModalEvents() {
        const modal = document.getElementById('card-modal');
        const closeBtn = document.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Fermer la modal en cliquant à l'extérieur
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Afficher la section de combat
    showBattleSection() {
        const battleSection = document.getElementById('battle-section');
        const gameArea = document.querySelector('.game-area');
        
        // Vérifier si on a des cartes en main ou en deck
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        
        if (deck.length === 0 && hand.length === 0) {
            alert('Vous devez d\'abord ajouter des cartes à votre deck ou à votre main avant de lancer un combat !');
            return;
        }
        
        // Masquer la collection et désactiver le booster
        const collectionSection = document.getElementById('collection-section');
        if (collectionSection) collectionSection.style.display = 'none';
        const boosterBtn = document.getElementById('booster-button');
        if (boosterBtn) {
            boosterBtn.disabled = true;
            boosterBtn.style.opacity = '0.5';
        }
        
        // Sauvegarder l'état avant le combat
        battleService.savePreBattleState(deck, hand);
        
        // Réinitialiser l'état du combat pour un nouveau combat
        battleService.resetBattleState();
        
        // Afficher la section de combat
        gameArea.style.display = 'none';
        battleSection.style.display = 'flex';
        
        // Initialiser le combat
        this.initBattle().then(() => {
        }).catch(error => {
            console.error('Erreur lors de l\'initialisation du combat:', error);
        });
    }

    // Initialiser le combat
    async initBattle() {
        
        // Marquer que nous sommes en mode combat
        battleService.inBattle = true;
        
        // Masquer la collection et désactiver le booster
        const collectionSection = document.getElementById('collection-section');
        if (collectionSection) collectionSection.style.display = 'none';
        const boosterBtn = document.getElementById('booster-button');
        if (boosterBtn) {
            boosterBtn.disabled = true;
            boosterBtn.style.opacity = '0.5';
        }
        
        // Initialiser la main de l'IA pour un nouveau combat
        await battleService.initOpponentHand(); // 5 cartes directes dans la main, deck vide
        
        // S'assurer que l'état de combat est sauvegardé
        battleService.saveBattleState();
        
        // Afficher les cartes
        this.displayBattleCards();
        
        // Mettre à jour les scores (ils devraient être à 0 pour un nouveau combat)
        this.updateBattleScores();
        
        // Afficher la section de commentaires immédiatement avec les commentaires existants
        this.showBattleCommentsSection(true);
        
        // Afficher le bouton "Finir le combat"
        this.showFinishBattleButton();
        
        // Reconfigurer les zones de drop pour la nouvelle arène
        dragDropService.setupArenaDropZones();
        
        // Ajouter les listeners drag & drop une seule fois
        if (!this.dragListenersAdded) {
            this.setupBattleDragDropListeners();
            this.dragListenersAdded = true;
        }
    }

    setupBattleDragDropListeners() {
        // Écouter les événements de déplacement de cartes
        document.addEventListener('cardMoved', (e) => {
            const { fromLocation, toLocation, cardIndex, cardData } = e.detail;
            
            // Gérer les déplacements selon les zones
            if (fromLocation === 'battle-hand' && toLocation === 'battle-player-combat') {
                this.moveCardFromHandToBattleCombat(cardData.id);
            } else if (fromLocation === 'battle-player-combat' && toLocation === 'battle-hand') {
                this.moveCardFromBattleCombatToHand();
            } else if (fromLocation === 'battle-deck' && toLocation === 'battle-hand') {
                this.moveCardFromDeckToHand(cardData.id);
            } else if (fromLocation === 'battle-hand' && toLocation === 'battle-discard') {
                this.moveCardFromHandToDiscard(cardData.id);
            } else if (fromLocation === 'battle-player-combat' && toLocation === 'battle-discard') {
                this.moveCardFromBattleCombatToDiscard();
            } else if (fromLocation === 'battle-deck' && toLocation === 'battle-discard') {
                this.moveCardFromDeckToDiscard(cardData.id);
            } else if (fromLocation === 'battle-discard' && toLocation === 'battle-hand') {
                this.moveCardFromDiscardToHand(cardData.id);
            } else if (fromLocation === 'battle-discard' && toLocation === 'battle-deck') {
                this.moveCardFromDiscardToDeck(cardData.id);
            } else if (fromLocation === 'battle-opponent-hand' && toLocation === 'battle-opponent-combat') {
                // L'IA place une carte en zone de combat
            } else if (fromLocation === 'battle-opponent-combat' && toLocation === 'battle-opponent-hand') {
                // L'IA retire une carte de la zone de combat
            } else if (fromLocation === 'battle-opponent-combat' && toLocation === 'battle-opponent-discard') {
                // L'IA défausse une carte de la zone de combat
            }
        });
    }

    // Afficher les cartes dans la section de combat
    displayBattleCards() {
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        const discard = gameStateService.getDiscard();
        const opponentHand = battleService.getOpponentHand();
        const battlePlayerCard = battleService.getBattlePlayerCard();
        const opponentBattleCard = battleService.getOpponentBattleCard();

        // Vérifier et compléter automatiquement la main de l'IA si nécessaire
        if (typeof battleService.checkAndFillOpponentHand === 'function') {
            battleService.checkAndFillOpponentHand();
        }

        // Afficher la pioche du joueur
        const battleDeckContainer = document.getElementById('battle-deck-container');
        if (battleDeckContainer) {
            battleDeckContainer.innerHTML = '';
            deck.forEach((card, index) => {
                const deckCardElement = cardService.createBattleCardElement(card, 'battle-deck', index);
                deckCardElement.addEventListener('click', () => this.handleDeckCardClick(card));
                battleDeckContainer.appendChild(deckCardElement);
            });
        }
        
        // Afficher la défausse du joueur (NON-INTERACTIVE)
        const battleDiscardContainer = document.getElementById('battle-discard-container');
        if (battleDiscardContainer) {
            battleDiscardContainer.innerHTML = '';
            discard.forEach((card, index) => {
                const discardCardElement = cardService.createBattleCardElement(card, 'battle-discard', index);
                // Rendre la carte non-interactive
                discardCardElement.style.pointerEvents = 'none';
                discardCardElement.style.opacity = '0.7';
                discardCardElement.draggable = false;
                discardCardElement.addEventListener('click', () => this.handleDiscardCardClick(card));
                battleDiscardContainer.appendChild(discardCardElement);
            });
        }
        
        // Afficher la main du joueur
        const battleHandContainer = document.getElementById('battle-hand-container');
        if (battleHandContainer) {
            battleHandContainer.innerHTML = '';
            hand.forEach((card, index) => {
                const cardElement = cardService.createBattleCardElement(card, 'battle-hand', index);
                cardElement.addEventListener('click', () => this.handleHandCardClick(card));
                battleHandContainer.appendChild(cardElement);
            });
        }

        // Afficher la zone de combat du joueur
        const battlePlayerCombat = document.getElementById('battle-player-combat');
        if (battlePlayerCombat) {
            battlePlayerCombat.innerHTML = '';
            if (battlePlayerCard) {
                const cardElement = cardService.createBattleCardElement(battlePlayerCard, 'battle-player-combat', 0);
                cardElement.addEventListener('click', () => this.handleBattleCardClick());
                battlePlayerCombat.appendChild(cardElement);
            }
        }

        // Afficher la zone de combat adverse
        const opponentCombat = document.getElementById('battle-opponent-combat');
        if (opponentCombat) {
            opponentCombat.innerHTML = '';
            if (opponentBattleCard) {
                const cardElement = cardService.createBattleCardElement(opponentBattleCard, 'battle-opponent-combat', 0);
                opponentCombat.appendChild(cardElement);
            }
        }

        // Afficher la défausse de l'IA (NON-INTERACTIVE)
        const opponentDiscardContainer = document.getElementById('battle-opponent-discard-container');
        if (opponentDiscardContainer) {
            opponentDiscardContainer.innerHTML = '';
            const opponentDiscard = battleService.getOpponentDiscard();
            opponentDiscard.forEach((card, index) => {
                const discardCardElement = cardService.createBattleCardElement(card, 'battle-opponent-discard', index);
                // Rendre la carte non-interactive
                discardCardElement.style.pointerEvents = 'none';
                discardCardElement.style.opacity = '0.7';
                discardCardElement.draggable = false;
                opponentDiscardContainer.appendChild(discardCardElement);
            });
        }

        // Afficher la main de l'adversaire
        const opponentHandContainer = document.getElementById('battle-opponent-hand-container');
        if (opponentHandContainer) {
            opponentHandContainer.innerHTML = '';
            opponentHand.forEach((card, index) => {
                const cardElement = cardService.createBattleCardElement(card, 'battle-opponent-hand', index);
                // Marquer la carte sélectionnée pour le combat
                if (card.id === opponentBattleCard?.id) {
                    cardElement.classList.add('selected-battle-card');
                }
                opponentHandContainer.appendChild(cardElement);
            });
        }

        // Afficher le deck de l'IA
        const opponentDeckContainer = document.getElementById('battle-opponent-deck-container');
        if (opponentDeckContainer) {
            opponentDeckContainer.innerHTML = '';
            const opponentDeck = battleService.getOpponentDeck();
            opponentDeck.forEach((card, index) => {
                const deckCardElement = cardService.createBattleCardElement(card, 'battle-opponent-deck', index);
                opponentDeckContainer.appendChild(deckCardElement);
            });
        }

        // Afficher le bouton de combat si les deux zones sont remplies
        this.updateBattleButton();
        
        // Mettre à jour les zones de drop après l'affichage des cartes
        dragDropService.setupArenaDropZones();
    }

    // Gérer le clic sur une carte de la pioche
    handleDeckCardClick(card) {
        const hand = gameStateService.getHand();
        if (hand.length >= 5) {
            console.warn('La main est pleine (5 cartes max)');
            return;
        }
        
        // Déplacer la carte de la pioche vers la main
        if (gameStateService.moveCard('deck', 'hand', card.id)) {
            this.displayBattleCards();
        }
    }

    // Gérer le clic sur une carte de la défausse
    handleDiscardCardClick(card) {
        // Afficher les détails de la carte dans la modal
        const modal = document.getElementById('card-modal');
        const cardDetails = document.getElementById('card-details');
        
        if (modal && cardDetails) {
            cardDetails.innerHTML = cardService.createCardDetailHTML(card);
            modal.style.display = 'block';
        }
    }

    // Gérer le clic sur une carte de la main
    async handleHandCardClick(card) {
        const hand = gameStateService.getHand();
        
        // Déplacer la carte vers la zone de combat
        try {
            const success = await battleService.moveCardToBattleZone(card.id, hand);
            if (success) {
                gameStateService.setHand(hand);
                this.displayBattleCards();
            }
        } catch (error) {
            console.error('Erreur lors du placement en zone de combat:', error);
        }
    }

    // Gérer le clic sur la carte en zone de combat
    handleBattleCardClick() {
        const hand = gameStateService.getHand();
        
        // Remettre la carte dans la main
        if (battleService.moveCardFromBattleZoneToHand(hand)) {
            gameStateService.setHand(hand);
            this.displayBattleCards();
        }
    }

    // Mettre à jour le bouton de combat
    updateBattleButton() {
        const controls = document.getElementById('battle-controls');
        const battlePlayerCard = battleService.getBattlePlayerCard();
        const opponentBattleCard = battleService.getOpponentBattleCard();
        
        if (controls) {
            if (battlePlayerCard && opponentBattleCard) {
                controls.innerHTML = `<button id="battle-launch-btn" class="battle-button">Lancer le combat</button>`;
                document.getElementById('battle-launch-btn').onclick = () => this.handleBattle();
            } else {
                controls.innerHTML = '';
            }
        }
    }

    // Lancer le combat
    handleBattle() {
        const result = battleService.executeBattle();
        
        if (result.error) {
            console.warn(result.error);
            return;
        }
        
        // Défausse automatique des cartes de combat
        this.autoDiscardBattleCards();
        
        // Afficher le résultat
        this.showBattleResult(result);
        
        // Mettre à jour les scores
        gameStateService.updateBattleScores(result.result);
        this.updateBattleScores();
        
        // Ajouter un commentaire automatique de l'IA
        this.addAIComment(result.result);
        
        // Afficher la zone de commentaires
        this.showBattleCommentsSection(true);
        
        // Fin automatique si 10 victoires atteintes
        const stats = gameStateService.getGameStats();
        if (stats.wins >= 10 || stats.losses >= 10) {
            setTimeout(() => this.exitBattle(), 600); // Laisse le temps d'afficher le résultat
        }
    }
    
    // Ajouter un commentaire automatique de l'IA
    addAIComment(result) {
        const aiMessages = {
            'victoire': [
                "Bien joué ! Tu m'as eu cette fois-ci !",
                "Impressionnant ! Tu as vraiment bien joué !",
                "Bravo ! Tu mérites cette victoire !",
                "Excellent combat ! Tu as été plus fort que moi !",
                "Chapeau ! Tu m'as battu fair and square !",
                "Belle performance ! Tu as gagné honnêtement !"
            ],
            'défaite': [
                "Haha ! Je t'ai bien eu cette fois !",
                "Pas de chance ! J'étais plus fort aujourd'hui !",
                "Victoire ! Tu devras faire mieux la prochaine fois !",
                "Boom ! Je t'ai battu !",
                "Pas mal, mais pas assez pour me battre !",
                "Game over ! J'ai gagné cette manche !"
            ],
            'égalité': [
                "Égalité ! On est à égalité !",
                "Match nul ! On se reverra !",
                "Personne ne gagne ! C'est un match nul !",
                "Égalité parfaite ! On est aussi forts !",
                "Match nul ! La prochaine fois on verra !",
                "Égalité ! On se départagera une autre fois !"
            ]
        };
        
        const messages = aiMessages[result] || aiMessages['égalité'];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Ajouter le commentaire de l'IA
        if (window.commentService) {
            window.commentService.saveComment(`🤖 IA: ${randomMessage}`);
        }
    }

    // Défausse automatique des cartes de combat
    autoDiscardBattleCards() {
        const discard = gameStateService.getDiscard();
        
        // Défausser la carte du joueur
        if (battleService.getBattlePlayerCard()) {
            const playerCard = battleService.getBattlePlayerCard();
            discard.push(playerCard);
            battleService.setBattlePlayerCard(null);
        }
        
        // Défausser la carte de l'IA dans sa propre défausse
        if (battleService.getOpponentBattleCard()) {
            const opponentCard = battleService.getOpponentBattleCard();
            battleService.moveOpponentCardToDiscard(opponentCard.id);
            battleService.setOpponentBattleCard(null);
        }
        
        gameStateService.setDiscard(discard);
        this.displayBattleCards();
    }

    // Afficher le résultat du combat
    showBattleResult(battleResult) {
        const { result, playerCard, opponentCard, playerScore, opponentScore } = battleResult;
        const controls = document.getElementById('battle-controls');
        
        let message = '';
        if (result === 'victoire') {
            message = `🎉 Victoire ! (${playerScore} vs ${opponentScore})`;
        } else if (result === 'défaite') {
            message = `😢 Défaite... (${playerScore} vs ${opponentScore})`;
        } else {
            message = `🤝 Égalité ! (${playerScore} vs ${opponentScore})`;
        }
        
        controls.innerHTML = `
            <div class="battle-result-message" aria-live="polite" tabindex="0">${message}</div>
            <button id="battle-exit-btn" class="battle-button">Retour à la page tirage</button>
        `;

        // Appliquer les animations
        const playerCombatZone = document.getElementById('battle-player-combat');
        const opponentCombatZone = document.getElementById('battle-opponent-combat');
        const playerCardDiv = playerCombatZone?.querySelector('.battle-card');
        const opponentCardDiv = opponentCombatZone?.querySelector('.battle-card');
        
        cardService.applyBattleAnimations(playerCardDiv, opponentCardDiv, result);

        // Rafraîchir uniquement les zones de cartes sans toucher au message de résultat
        this.refreshBattleZones();

        // Gestionnaire pour le bouton
        document.getElementById('battle-exit-btn').onclick = () => this.exitBattle();
    }




    // Sortir du mode combat
    exitBattle() {
        // Calculer le résultat du combat basé sur les scores actuels
        const stats = gameStateService.getGameStats();
        const playerWins = stats.wins;
        const iaWins = stats.losses;
        const draws = stats.draws;
        
        // Déterminer le gagnant du combat
        let result, message;
        if (playerWins > iaWins) {
            result = 'victoire';
            message = 'Victoire du joueur ! Le joueur a gagné ce combat !';
        } else if (iaWins > playerWins) {
            result = 'défaite';
            message = 'Victoire de l\'IA ! L\'IA a gagné ce combat !';
        } else {
            result = 'égalité';
            message = 'Égalité ! Aucun gagnant dans ce combat !';
        }
        
        // Afficher la modal de résultat
        this.showBattleResultModal(result, message, stats);
        
        // S'assurer que la collection est rafraîchie après la fin du combat
        setTimeout(() => {
            if (typeof renderCollectionUI === 'function') renderCollectionUI();
        }, 100);
    }

    // Afficher la modal de résultat de combat
    showBattleResultModal(result, message, stats) {
        const modal = document.getElementById('battle-result-modal');
        const details = document.getElementById('battle-result-details');
        const closeBtn = document.getElementById('close-battle-result-btn');
        
        if (!modal || !details) {
            console.error('Modal de résultat de combat non trouvée');
            return;
        }
        
        // Créer le contenu de la modal
        details.innerHTML = `
            <h2>Fin du Combat</h2>
            <div class="result-message result-${result}">${message}</div>
            <div class="battle-stats">
                <h3>Statistiques du combat</h3>
                <p>Victoires joueur : ${stats.wins}</p>
                <p>Victoires IA : ${stats.losses}</p>
                <p>Égalités : ${stats.draws}</p>
                <p>Total des combats : ${stats.gamesPlayed}</p>
            </div>
        `;
        
        // Afficher la modal
        modal.style.display = 'block';
        
        // Configurer le bouton de fermeture
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                this.finishBattleAndReset();
            };
        }
        
        // Fermer la modal en cliquant à l'extérieur
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                this.finishBattleAndReset();
            }
        };
    }

    // Terminer le combat et réinitialiser
    finishBattleAndReset() {
        console.log('🔍 Début de finishBattleAndReset');
        
        // Remettre toutes les cartes du joueur (main, deck, défausse) dans la collection
        const allCards = [
            ...gameStateService.getDeck(),
            ...gameStateService.getHand(),
            ...gameStateService.getDiscard()
        ];
        
        console.log('📊 Cartes à remettre dans la collection:', allCards.length, allCards.map(c => c.name));
        
        // Vider d'abord le deck, la main et la défausse pour que le statut soit correct
        gameStateService.resetDeckAndHand();
        gameStateService.setDiscard([]);
        
        console.log('🗑️ Deck et main vidés');
        
        // Ensuite ajouter les cartes à la collection
        if (allCards.length > 0) {
            const cardService = window.cardService;
            if (cardService) {
                console.log('📚 Collection avant ajout:', cardService.collection.length);
                
                for (const card of allCards) {
                    cardService.collection.push(card);
                }
                
                console.log('📚 Collection après ajout:', cardService.collection.length);
                cardService.saveCollection();
                
                // Forcer le rechargement de la collection
                cardService.collection = cardService.loadCollection();
                console.log('📚 Collection après rechargement:', cardService.collection.length);
            } else {
                console.error('❌ cardService non trouvé');
            }
        } else {
            console.log('⚠️ Aucune carte à remettre dans la collection');
        }
        
        // Réinitialiser les scores de combat
        gameStateService.resetStats();
        
        // Réinitialiser l'état du combat
        battleService.resetBattleState();
        
        // Vider tous les commentaires à la fin du combat
        if (window.commentService) {
            window.commentService.clearAllComments();
            console.log('🗑️ Commentaires vidés');
        }
        
        // Masquer la section de combat
        this.hideBattleSection();
        
        console.log('🎭 Section de combat masquée');
        
        // Mettre à jour l'interface
        if (window.gameController && typeof window.gameController.updateUI === 'function') {
            window.gameController.updateUI();
            console.log('🎮 Interface mise à jour');
        }
        
        // Rafraîchir la collection immédiatement après avoir mis à jour cardService
        setTimeout(() => {
            console.log('🔄 Tentative de rafraîchissement de la collection');
            if (typeof window.renderCollectionUI === 'function') {
                console.log('✅ renderCollectionUI trouvé via window, appel en cours...');
                window.renderCollectionUI();
                console.log('✅ renderCollectionUI appelé');
            } else if (typeof renderCollectionUI === 'function') {
                console.log('✅ renderCollectionUI trouvé, appel en cours...');
                renderCollectionUI();
                console.log('✅ renderCollectionUI appelé');
            } else {
                console.error('❌ renderCollectionUI non trouvé');
                // Déclencher un événement pour forcer le rafraîchissement
                window.dispatchEvent(new CustomEvent('refreshCollection'));
                console.log('📡 Événement refreshCollection déclenché');
            }
        }, 100);
    }

    // Masquer la section de combat
    hideBattleSection() {
        document.getElementById('battle-section').style.display = 'none';
        document.querySelector('.game-area').style.display = 'grid';
        this.hideBattleCommentsSection();
        this.hideFinishBattleButton();
        
        // Réafficher la collection et réactiver le booster
        const collectionSection = document.getElementById('collection-section');
        if (collectionSection) collectionSection.style.display = '';
        const boosterBtn = document.getElementById('booster-button');
        if (boosterBtn) {
            boosterBtn.disabled = false;
            boosterBtn.style.opacity = '1';
        }
        
        // Émettre un événement pour notifier l'application principale
        window.dispatchEvent(new CustomEvent('battleSectionHidden'));
    }

    // Mettre à jour les scores de combat
    updateBattleScores() {
        const stats = gameStateService.getGameStats();
        const elPlayer = document.getElementById('score-player');
        const elIa = document.getElementById('score-ia');
        const elDraw = document.getElementById('score-draw');
        
        if (elPlayer) elPlayer.textContent = stats.wins;
        if (elIa) elIa.textContent = stats.losses;
        if (elDraw) elDraw.textContent = stats.draws;
    }

    // Afficher la section de commentaires
    showBattleCommentsSection(forceShow = false) {
        const section = document.getElementById('battle-comments-section');
        if (!section) return;
        
        const comments = commentService.getComments();
        if (forceShow || comments.length > 0) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
        
        this.renderBattleComments();
        this.setupBattleCommentForm();
    }

    // Masquer la section de commentaires
    hideBattleCommentsSection() {
        const section = document.getElementById('battle-comments-section');
        if (section) section.style.display = 'none';
    }

    // Afficher les commentaires
    renderBattleComments() {
        const list = document.getElementById('battle-comments-list');
        if (!list) return;
        
        const comments = commentService.getComments();
        list.innerHTML = comments.length === 0 
            ? '<div style="color:#888;font-style:italic;">Aucun commentaire pour l\'instant.</div>'
            : comments.map(c => `<div class="battle-comment-item"><span>${c.text}</span></div>`).join('');
    }

    // Configurer le formulaire de commentaire
    setupBattleCommentForm() {
        const form = document.getElementById('battle-comment-form');
        if (!form) return;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            const input = document.getElementById('battle-comment-input');
            if (input && input.value.trim().length > 0) {
                const validation = commentService.validateComment(input.value.trim());
                if (validation.valid) {
                    commentService.saveComment(validation.text);
                    this.renderBattleComments();
                    input.value = '';
                } else {
                    console.error(validation.error);
                }
            }
        };
    }

    // Afficher le bouton "Finir le combat"
    showFinishBattleButton() {
        let btn = document.getElementById('battle-finish-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'battle-finish-btn';
            btn.className = 'battle-button';
            btn.textContent = 'Finir le combat';
            btn.style.marginLeft = '0';
            btn.onclick = () => this.exitBattle();
            
            const battleSection = document.getElementById('battle-section');
            battleSection.insertBefore(btn, battleSection.children[1]);
        } else {
            btn.style.display = 'inline-block';
        }
    }

    // Masquer le bouton "Finir le combat"
    hideFinishBattleButton() {
        const btn = document.getElementById('battle-finish-btn');
        if (btn) btn.style.display = 'none';
    }

    // Ajoute les méthodes utilitaires pour déplacer les cartes entre les zones pendant le combat
    moveCardFromDeckToHand(cardId) {
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        const cardIdx = deck.findIndex(c => c.id === cardId);
        if (cardIdx === -1) {
            console.warn('Carte non trouvée dans la pioche:', cardId);
            return;
        }
        if (hand.length >= 5) {
            console.warn('La main est pleine (5 cartes max)');
            return;
        }
        const card = deck.splice(cardIdx, 1)[0];
        hand.push(card);
        gameStateService.setDeck(deck);
        gameStateService.setHand(hand);
        this.displayBattleCards();
    }
    moveCardFromHandToDeck(cardId) {
        const hand = gameStateService.getHand();
        const deck = gameStateService.getDeck();
        const cardIdx = hand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return;
        const card = hand.splice(cardIdx, 1)[0];
        deck.push(card);
        gameStateService.setDeck(deck);
        gameStateService.setHand(hand);
        this.displayBattleCards();
    }
    async moveCardFromHandToBattleCombat(cardId) {
        const hand = gameStateService.getHand();
        try {
            // Utiliser la méthode du service qui gère maintenant l'IA séparément
            const success = await battleService.moveCardToBattleZone(cardId, hand);
            if (success) {
                gameStateService.setHand(hand);
                this.displayBattleCards();
            }
        } catch (error) {
            console.error('Erreur lors du déplacement vers la zone de combat:', error);
        }
    }
    moveCardFromBattleCombatToHand() {
        const hand = gameStateService.getHand();
        if (battleService.getBattlePlayerCard()) {
            hand.push(battleService.getBattlePlayerCard());
            battleService.setBattlePlayerCard(null);
            gameStateService.setHand(hand);
            this.displayBattleCards();
        }
    }

    // Nouvelle méthode pour défausser une carte de la main
    moveCardFromHandToDiscard(cardId) {
        const hand = gameStateService.getHand();
        const discard = gameStateService.getDiscard();
        const cardIdx = hand.findIndex(c => c.id === cardId);
        
        if (cardIdx !== -1) {
            const card = hand.splice(cardIdx, 1)[0];
            discard.push(card);
            gameStateService.setHand(hand);
            gameStateService.setDiscard(discard);
            this.displayBattleCards();
        }
    }

    // Nouvelle méthode pour défausser une carte de la zone de combat
    moveCardFromBattleCombatToDiscard() {
        const discard = gameStateService.getDiscard();
        const battleCard = battleService.getBattlePlayerCard();
        
        if (battleCard) {
            discard.push(battleCard);
            battleService.setBattlePlayerCard(null);
            gameStateService.setDiscard(discard);
            this.displayBattleCards();
        }
    }

    // Nouvelle méthode pour défausser une carte du deck
    moveCardFromDeckToDiscard(cardId) {
        const deck = gameStateService.getDeck();
        const discard = gameStateService.getDiscard();
        const cardIdx = deck.findIndex(c => c.id === cardId);
        
        if (cardIdx !== -1) {
            const card = deck.splice(cardIdx, 1)[0];
            discard.push(card);
            gameStateService.setDeck(deck);
            gameStateService.setDiscard(discard);
            this.displayBattleCards();
        }
    }

    // Nouvelle méthode pour remettre une carte de la défausse dans la main
    moveCardFromDiscardToHand(cardId) {
        const discard = gameStateService.getDiscard();
        const hand = gameStateService.getHand();
        const cardIdx = discard.findIndex(c => c.id === cardId);
        
        if (cardIdx !== -1 && hand.length < 5) {
            const card = discard.splice(cardIdx, 1)[0];
            hand.push(card);
            gameStateService.setDiscard(discard);
            gameStateService.setHand(hand);
            this.displayBattleCards();
        } else if (hand.length >= 5) {
            console.warn('La main est pleine (5 cartes max)');
        }
    }

    // Nouvelle méthode pour remettre une carte de la défausse dans le deck
    moveCardFromDiscardToDeck(cardId) {
        const discard = gameStateService.getDiscard();
        const deck = gameStateService.getDeck();
        const cardIdx = discard.findIndex(c => c.id === cardId);
        
        if (cardIdx !== -1) {
            const card = discard.splice(cardIdx, 1)[0];
            deck.push(card);
            gameStateService.setDiscard(discard);
            gameStateService.setDeck(deck);
            this.displayBattleCards();
        }
    }

    // Rafraîchir uniquement les zones de cartes sans toucher au message de résultat
    refreshBattleZones() {
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        const discard = gameStateService.getDiscard();
        const battlePlayerCard = battleService.getBattlePlayerCard();
        const opponentHand = battleService.getOpponentHand();
        const opponentBattleCard = battleService.getOpponentBattleCard();

        // Pioche
        const battleDeckContainer = document.getElementById('battle-deck-container');
        if (battleDeckContainer) {
            cardService.displayCardsInContainer(battleDeckContainer, deck, 'battle-deck', { isBattleMode: true });
        }
        // Main
        const battleHandContainer = document.getElementById('battle-hand-container');
        if (battleHandContainer) {
            cardService.displayCardsInContainer(battleHandContainer, hand, 'battle-hand', { isBattleMode: true });
        }
        // DÉFAUSSE (désactive toute interaction)
        const battleDiscardContainer = document.getElementById('battle-discard-container');
        if (battleDiscardContainer) {
            cardService.displayCardsInContainer(battleDiscardContainer, discard, 'battle-discard', { isBattleMode: true });
            Array.from(battleDiscardContainer.children).forEach(cardDiv => {
                cardDiv.style.pointerEvents = 'none';
                cardDiv.style.opacity = '0.7';
            });
        }
        // Zone de combat joueur
        const battlePlayerCombat = document.getElementById('battle-player-combat');
        if (battlePlayerCombat) {
            battlePlayerCombat.innerHTML = '';
            if (battlePlayerCard) {
                const cardElement = cardService.createBattleCardElement(battlePlayerCard, 'battle-player-combat', 0);
                cardElement.addEventListener('click', () => this.handleBattleCardClick());
                cardElement.draggable = true;
                cardElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        cardId: battlePlayerCard.id,
                        from: 'battle-combat',
                        index: 0
                    }));
                });
                battlePlayerCombat.appendChild(cardElement);
            }
        }
        // Zone de combat adverse
        const opponentCombat = document.getElementById('battle-opponent-combat');
        if (opponentCombat) {
            opponentCombat.innerHTML = '';
            if (opponentBattleCard) {
                const cardElement = cardService.createBattleCardElement(opponentBattleCard, 'battle-opponent-combat', 0);
                opponentCombat.appendChild(cardElement);
            }
        }
        // Main adverse
        const opponentHandContainer = document.getElementById('battle-opponent-hand-container');
        if (opponentHandContainer) {
            cardService.displayCardsInContainer(opponentHandContainer, opponentHand, 'battle-opponent-hand', {
                isBattleMode: true,
                showSelection: true,
                selectedIndex: opponentHand.findIndex(card => card.id === opponentBattleCard?.id)
            });
        }
        // DÉFAUSSE IA (désactive toute interaction)
        const opponentDiscardContainer = document.getElementById('battle-opponent-discard-container');
        if (opponentDiscardContainer) {
            cardService.displayCardsInContainer(opponentDiscardContainer, battleService.getOpponentDiscard(), 'battle-opponent-discard', { isBattleMode: true });
            Array.from(opponentDiscardContainer.children).forEach(cardDiv => {
                cardDiv.style.pointerEvents = 'none';
                cardDiv.style.opacity = '0.7';
            });
        }
    }
}

// Exporter une instance unique du contrôleur
export const battleController = new BattleController(); 