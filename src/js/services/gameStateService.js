// Service pour gérer l'état global du jeu
import { storageService } from './storageService.js';

class GameStateService {
    constructor() {
        this.state = {
            deck: [],
            hand: [],
            discard: [], // Ajout de la défausse
            lastDrawTime: null,
            drawCooldown: 10 * 1000, // 10 secondes en millisecondes (pour les tests)
            playerName: 'Dresseur',
            totalCardsDrawn: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0
        };
    }

    // Charger les données de jeu depuis le LocalStorage
    loadGameData() {
        try {
            const data = storageService.loadGameData();
            
            // Mettre à jour l'état global avec les données chargées
            this.state.deck = data.deck || [];
            this.state.hand = data.hand || [];
            this.state.discard = data.discard || [];
            this.state.lastDrawTime = data.lastDrawTime || null;
            this.state.playerName = data.playerName || 'Dresseur';
            this.state.totalCardsDrawn = data.totalCardsDrawn || 0;
            this.state.gamesPlayed = data.gamesPlayed || 0;
            this.state.wins = data.wins || 0;
            this.state.losses = data.losses || 0;
            this.state.draws = data.draws || 0;
            this.state.battleState = data.battleState || null; // Charger l'état du combat
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            console.log('Démarrage avec un état vide');
            return false;
        }
    }

    // Sauvegarder les données de jeu dans le LocalStorage
    saveGameData() {
        try {
            const data = {
                deck: this.state.deck,
                hand: this.state.hand,
                discard: this.state.discard,
                lastDrawTime: this.state.lastDrawTime,
                playerName: this.state.playerName,
                totalCardsDrawn: this.state.totalCardsDrawn,
                gamesPlayed: this.state.gamesPlayed,
                wins: this.state.wins,
                losses: this.state.losses,
                draws: this.state.draws,
                battleState: this.state.battleState // Ajouter l'état du combat
            };
            
            const success = storageService.saveGameData(data);
            if (success) {
                return true;
            } else {
                console.error('❌ Échec de la sauvegarde des données');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des données:', error);
            return false;
        }
    }

    // Vérifier si on peut tirer des cartes
    canDrawCards() {
        if (!this.state.lastDrawTime) return true;
        
        const now = Date.now();
        const timeSinceLastDraw = now - this.state.lastDrawTime;
        
        return timeSinceLastDraw >= this.state.drawCooldown;
    }

    // Obtenir le temps restant avant le prochain tirage
    getTimeUntilNextDraw() {
        if (!this.state.lastDrawTime) return 0;
        
        const now = Date.now();
        const timeSinceLastDraw = now - this.state.lastDrawTime;
        const timeRemaining = Math.max(0, this.state.drawCooldown - timeSinceLastDraw);
        
        return timeRemaining;
    }

    // Formater le temps restant pour l'affichage
    formatTimeRemaining() {
        const timeRemaining = this.getTimeUntilNextDraw();
        
        if (timeRemaining <= 0) {
            return '5:00';
        }
        
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Obtenir le nombre total de cartes jouables (deck + main)
    getTotalPlayableCards() {
        return this.state.deck.length + this.state.hand.length;
    }

    // Ajouter des cartes à la pioche
    addCardsToDeck(cards) {
        // Limite stricte à 30 cartes (deck + main)
        if (this.getTotalPlayableCards() + cards.length > 30) {
            return false;
        }
        this.state.deck.push(...cards);
        this.state.lastDrawTime = Date.now();
        this.state.totalCardsDrawn += cards.length;
        this.saveGameData();
        return true;
    }

    // Déplacer une carte entre la pioche et la main
    moveCard(fromLocation, toLocation, cardId) {
        const sourceArray = fromLocation === 'deck' ? this.state.deck : this.state.hand;
        const targetArray = toLocation === 'deck' ? this.state.deck : this.state.hand;
        const cardIdx = sourceArray.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return false;
        const card = sourceArray[cardIdx];
        // Autoriser le déplacement main <-> pioche même si deck + main == 30
        const isInternalMove = (fromLocation === 'deck' && toLocation === 'hand') || (fromLocation === 'hand' && toLocation === 'deck');
        if (!isInternalMove && toLocation === 'deck' && this.getTotalPlayableCards() >= 30) {
            return false;
        }
        if (toLocation === 'hand' && this.state.hand.length >= 5) {
            // Rotation : la première carte va à la pioche
            const rotatedCard = this.state.hand.shift();
            // Avant de remettre dans le deck, vérifier la limite globale
            if (!isInternalMove && this.getTotalPlayableCards() >= 30) {
                this.state.hand.unshift(rotatedCard);
                return false;
            }
            this.state.deck.push(rotatedCard);
        }
        sourceArray.splice(cardIdx, 1);
        targetArray.push(card);
        this.saveGameData();
        return true;
    }

    // Appliquer la rotation automatique de la main
    applyHandRotation() {
        if (this.state.hand.length > 1) {
            const firstCard = this.state.hand.shift();
            this.state.deck.push(firstCard);
            this.saveGameData();
            return firstCard;
        }
        return null;
    }

    // Mélanger la pioche (deck) de façon aléatoire
    shuffleDeck() {
        for (let i = this.state.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.deck[i], this.state.deck[j]] = [this.state.deck[j], this.state.deck[i]];
        }
        this.saveGameData();
    }

    // Mettre à jour les scores de combat
    updateBattleScores(result) {
        switch (result) {
            case 'victoire':
                this.state.wins++;
                break;
            case 'défaite':
                this.state.losses++;
                break;
            case 'égalité':
                this.state.draws++;
                break;
        }
        this.state.gamesPlayed++;
        this.saveGameData();
    }

    // Réinitialiser les statistiques
    resetStats() {
        this.state.totalCardsDrawn = 0;
        this.state.gamesPlayed = 0;
        this.state.wins = 0;
        this.state.losses = 0;
        this.state.draws = 0;
        this.saveGameData();
    }

    // Réinitialiser le deck, la main et la défausse
    resetDeckAndHand() {
        this.state.deck = [];
        this.state.hand = [];
        this.state.discard = []; // Vider aussi la défausse
        this.state.lastDrawTime = null;
        this.saveGameData();
    }

    // Vider le deck et la main, remettre toutes les cartes dans la collection
    clearDeckAndHand() {
        const allCards = [...this.state.deck, ...this.state.hand];
        this.state.deck = [];
        this.state.hand = [];
        this.saveGameData();
        return allCards;
    }

    // Obtenir les statistiques du jeu
    getGameStats() {
        return {
            deckSize: this.state.deck.length,
            handSize: this.state.hand.length,
            totalCards: this.state.deck.length + this.state.hand.length,
            totalCardsDrawn: this.state.totalCardsDrawn,
            gamesPlayed: this.state.gamesPlayed,
            wins: this.state.wins,
            losses: this.state.losses,
            draws: this.state.draws,
            winRate: this.state.gamesPlayed > 0 ? (this.state.wins / this.state.gamesPlayed * 100).toFixed(1) : 0,
            canDraw: this.canDrawCards(),
            timeUntilNextDraw: this.getTimeUntilNextDraw()
        };
    }

    // Getters pour l'état
    getDeck() { return this.state.deck; }
    getHand() { return this.state.hand; }
    getPlayerName() { return this.state.playerName; }
    getLastDrawTime() { return this.state.lastDrawTime; }
    getDrawCooldown() { return this.state.drawCooldown; }
    getDiscard() { return this.state.discard; }

    // Setters pour l'état
    setPlayerName(name) { 
        this.state.playerName = name; 
        this.saveGameData();
    }
    setDeck(deck) { 
        this.state.deck = deck; 
        this.saveGameData();
    }
    setHand(hand) { 
        this.state.hand = hand; 
        this.saveGameData();
    }
    setLastDrawTime(time) { 
        this.state.lastDrawTime = time; 
        this.saveGameData();
    }
    setDiscard(discard) { this.state.discard = discard; this.saveGameData(); }
    
    // Sauvegarder l'état du combat
    saveBattleState(battleState) {
        this.state.battleState = battleState;
        this.saveGameData();
    }
    
    // Charger l'état du combat
    loadBattleState() {
        return this.state.battleState || null;
    }
}

// Exporter une instance unique du service
export const gameStateService = new GameStateService(); 