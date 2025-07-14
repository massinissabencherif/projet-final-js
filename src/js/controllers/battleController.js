// Contrôleur pour gérer l'interface et la logique de la section de combat
import { battleService } from '../services/battleService.js';
import { cardService } from '../services/cardService.js';
import { commentService } from '../services/commentService.js';
import { notificationService } from '../services/notificationService.js';
import { gameStateService } from '../services/gameStateService.js';

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
        console.log('Contrôleur de combat initialisé');
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
        
        // Sauvegarder l'état avant le combat
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        battleService.savePreBattleState(deck, hand);
        
        // Afficher la section de combat
        gameArea.style.display = 'none';
        battleSection.style.display = 'flex';
        
        // Initialiser le combat
        this.initBattle();
        
        notificationService.info('Mode combat activé ! Placez une carte dans votre zone de combat.');
    }

    // Initialiser le combat
    initBattle() {
        // Initialiser la main de l'IA
        const deck = gameStateService.getDeck();
        battleService.initOpponentHand(deck);
        
        // Afficher les cartes
        this.displayBattleCards();
        
        // Mettre à jour les scores
        this.updateBattleScores();
        
        // Afficher la section de commentaires
        this.showBattleCommentsSection();
        
        // Afficher le bouton "Finir le combat"
        this.showFinishBattleButton();
        // Ajouter les listeners drag & drop une seule fois
        if (!this.dragListenersAdded) {
            this.setupBattleDragDropListeners();
            this.dragListenersAdded = true;
        }
    }

    setupBattleDragDropListeners() {
        const battleDeckContainer = document.getElementById('battle-deck-container');
        const battleHandContainer = document.getElementById('battle-hand-container');
        const battlePlayerCombat = document.getElementById('battle-player-combat');
        if (battleDeckContainer) {
            // Style debug
            battleDeckContainer.style.background = 'rgba(0,255,0,0.1)';
            battleDeckContainer.addEventListener('dragover', (e) => { e.preventDefault(); });
            battleDeckContainer.addEventListener('drop', (e) => {
                console.log('DROP sur battleDeckContainer');
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    console.log('[DEBUG] data reçu sur drop battleDeckContainer:', data);
                    if (data.location === 'battle-hand') {
                        this.moveCardFromHandToDeck(data.cardId);
                    }
                } catch (err) {
                    console.error('Erreur lors du drop Main → Pioche', err);
                }
            });
        }
        if (battleHandContainer) {
            // Style debug
            battleHandContainer.style.background = 'rgba(0,0,255,0.1)';
            battleHandContainer.addEventListener('dragover', (e) => { e.preventDefault(); });
            battleHandContainer.addEventListener('drop', (e) => {
                console.log('DROP sur battleHandContainer');
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    console.log('[DEBUG] data reçu sur drop battleHandContainer:', data);
                    if (data.location === 'battle-deck') {
                        this.moveCardFromDeckToHand(data.cardId);
                    } else if (data.location === 'battle-combat') {
                        this.moveCardFromBattleCombatToHand();
                    }
                } catch (err) {
                    console.error('Erreur lors du drop Pioche/Zone de combat → Main', err);
                }
            });
        }
        if (battlePlayerCombat) {
            // Style debug
            battlePlayerCombat.style.background = 'rgba(255,0,0,0.1)';
            battlePlayerCombat.addEventListener('dragover', (e) => { e.preventDefault(); });
            battlePlayerCombat.addEventListener('drop', (e) => {
                console.log('DROP sur battlePlayerCombat');
                e.preventDefault();
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    console.log('[DEBUG] data reçu sur drop battlePlayerCombat:', data);
                    if (data.location === 'battle-hand') {
                        this.moveCardFromHandToBattleCombat(data.cardId);
                    } else if (data.location === 'battle-combat') {
                        this.moveCardFromBattleCombatToHand();
                    }
                } catch (err) {
                    console.error('Erreur lors du drop Main → Zone de combat', err);
                }
            });
        }
    }

    // Afficher les cartes dans la section de combat
    displayBattleCards() {
        const deck = gameStateService.getDeck();
        const hand = gameStateService.getHand();
        const opponentHand = battleService.getOpponentHand();
        const battlePlayerCard = battleService.getBattlePlayerCard();
        const opponentBattleCard = battleService.getOpponentBattleCard();

        // Afficher la pioche et la main du joueur
        const battleDeckContainer = document.getElementById('battle-deck-container');
        const battleHandContainer = document.getElementById('battle-hand-container');
        
        if (battleDeckContainer) {
            cardService.displayCardsInContainer(battleDeckContainer, deck, 'battle-deck', {
                isBattleMode: true,
                onCardClick: (index, card) => this.handleDeckCardClick(card)
            });
        }
        
        if (battleHandContainer) {
            cardService.displayCardsInContainer(battleHandContainer, hand, 'battle-hand', {
                isBattleMode: true,
                onCardClick: (index, card) => this.handleHandCardClick(card)
            });
        }

        // Afficher la zone de combat du joueur
        const battlePlayerCombat = document.getElementById('battle-player-combat');
        if (battlePlayerCombat) {
            battlePlayerCombat.innerHTML = '';
            if (battlePlayerCard) {
                const cardElement = cardService.createBattleCardElement(battlePlayerCard, 'battle-player-combat', 0);
                cardElement.addEventListener('click', () => this.handleBattleCardClick());
                // Permettre de retirer la carte (optionnel)
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

        // Afficher la zone de combat adverse
        const opponentCombat = document.getElementById('battle-opponent-combat');
        if (opponentCombat) {
            opponentCombat.innerHTML = '';
            if (opponentBattleCard) {
                const cardElement = cardService.createBattleCardElement(opponentBattleCard, 'battle-opponent-combat', 0);
                opponentCombat.appendChild(cardElement);
            }
        }

        // Afficher la main de l'adversaire
        const opponentHandContainer = document.getElementById('battle-opponent-hand-container');
        if (opponentHandContainer) {
            cardService.displayCardsInContainer(opponentHandContainer, opponentHand, 'battle-opponent-hand', {
                isBattleMode: true,
                showSelection: true,
                selectedIndex: opponentHand.findIndex(card => card.id === opponentBattleCard?.id)
            });
        }

        // Afficher la défausse du joueur
        const battleDiscardContainer = document.getElementById('battle-discard-container');
        const discard = gameStateService.getDiscard();
        if (battleDiscardContainer) {
            cardService.displayCardsInContainer(battleDiscardContainer, discard, 'battle-discard', {
                isBattleMode: true
            });
        }

        // Afficher le bouton de combat si les deux zones sont remplies
        this.updateBattleButton();
    }

    // Gérer le clic sur une carte de la pioche
    handleDeckCardClick(card) {
        const hand = gameStateService.getHand();
        if (hand.length >= 5) {
            notificationService.warning('La main est pleine (5 cartes max)');
            return;
        }
        
        // Déplacer la carte de la pioche vers la main
        if (gameStateService.moveCard('deck', 'hand', card.id)) {
            this.displayBattleCards();
            notificationService.success(`${card.name} ajouté à votre main`);
        }
    }

    // Gérer le clic sur une carte de la main
    handleHandCardClick(card) {
        const hand = gameStateService.getHand();
        
        // Déplacer la carte vers la zone de combat
        if (battleService.moveCardToBattleZone(card.id, hand)) {
            gameStateService.setHand(hand);
            this.displayBattleCards();
            notificationService.success(`${card.name} placé en zone de combat`);
        }
    }

    // Gérer le clic sur la carte en zone de combat
    handleBattleCardClick() {
        const hand = gameStateService.getHand();
        
        // Remettre la carte dans la main
        if (battleService.moveCardFromBattleZoneToHand(hand)) {
            gameStateService.setHand(hand);
            this.displayBattleCards();
            notificationService.info('Carte retirée de la zone de combat');
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
            notificationService.warning(result.error);
            return;
        }
        // Envoyer les cartes de combat en défausse immédiatement après le combat
        if (battleService.getBattlePlayerCard()) {
            const discard = gameStateService.getDiscard();
            discard.push(battleService.getBattlePlayerCard());
            gameStateService.setDiscard(discard);
            battleService.setBattlePlayerCard(null);
        }
        if (battleService.getOpponentBattleCard()) {
            battleService.setOpponentBattleCard(null);
        }
        this.displayBattleCards();
        // Afficher le résultat
        this.showBattleResult(result);
        
        // Mettre à jour les scores
        gameStateService.updateBattleScores(result.result);
        this.updateBattleScores();
        
        // Afficher la zone de commentaires
        this.showBattleCommentsSection(true);
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
            <button id="battle-replay-btn" class="battle-button">Rejouer</button>
            <button id="battle-exit-btn" class="battle-button">Retour</button>
        `;

        // Appliquer les animations
        const playerCombatZone = document.getElementById('battle-player-combat');
        const opponentCombatZone = document.getElementById('battle-opponent-combat');
        const playerCardDiv = playerCombatZone?.querySelector('.battle-card');
        const opponentCardDiv = opponentCombatZone?.querySelector('.battle-card');
        
        cardService.applyBattleAnimations(playerCardDiv, opponentCardDiv, result);

        // Rafraîchir uniquement les zones de cartes sans toucher au message de résultat
        this.refreshBattleZones();

        // Gestionnaires pour les boutons
        document.getElementById('battle-replay-btn').onclick = () => this.replayBattle();
        document.getElementById('battle-exit-btn').onclick = () => this.exitBattle();
    }

    // Rejouer un combat
    replayBattle() {
        battleService.resetBattleZones();
        this.displayBattleCards();
        const controls = document.getElementById('battle-controls');
        controls.innerHTML = '';
        this.hideBattleCommentsSection();
    }

    // Sortir du mode combat
    exitBattle() {
        const restoredState = battleService.restorePreBattleState();
        if (restoredState.deck && restoredState.hand) {
            gameStateService.setDeck(restoredState.deck);
            gameStateService.setHand(restoredState.hand);
        }
        
        this.hideBattleSection();
    }

    // Masquer la section de combat
    hideBattleSection() {
        document.getElementById('battle-section').style.display = 'none';
        document.querySelector('.game-area').style.display = 'grid';
        this.hideBattleCommentsSection();
        this.hideFinishBattleButton();
        
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
                    notificationService.success('Commentaire ajouté');
                } else {
                    notificationService.error(validation.error);
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
        console.log('[DEBUG] Avant déplacement deck:', deck.map(c => c.name), 'hand:', hand.map(c => c.name));
        if (cardIdx === -1) {
            console.warn('[DEBUG] Carte non trouvée dans la pioche:', cardId);
            return;
        }
        if (hand.length >= 5) {
            notificationService.warning('La main est pleine (5 cartes max)');
            return;
        }
        const card = deck.splice(cardIdx, 1)[0];
        hand.push(card);
        gameStateService.setDeck(deck);
        gameStateService.setHand(hand);
        console.log('[DEBUG] Après déplacement deck:', deck.map(c => c.name), 'hand:', hand.map(c => c.name));
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
    moveCardFromHandToBattleCombat(cardId) {
        const hand = gameStateService.getHand();
        // Si une carte est déjà présente, la remettre dans la main
        if (battleService.getBattlePlayerCard()) {
            hand.push(battleService.getBattlePlayerCard());
        }
        const cardIdx = hand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return;
        battleService.setBattlePlayerCard(hand.splice(cardIdx, 1)[0]);
        gameStateService.setHand(hand);
        // S'assurer que la main de l'IA existe et choisir une carte
        if (!battleService.getOpponentHand() || battleService.getOpponentHand().length === 0) {
            battleService.initOpponentHand(gameStateService.getDeck());
        }
        battleService.opponentChooseBattleCard();
        this.displayBattleCards();
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
        // Défausse
        const battleDiscardContainer = document.getElementById('battle-discard-container');
        if (battleDiscardContainer) {
            cardService.displayCardsInContainer(battleDiscardContainer, discard, 'battle-discard', { isBattleMode: true });
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
    }
}

// Exporter une instance unique du contrôleur
export const battleController = new BattleController(); 