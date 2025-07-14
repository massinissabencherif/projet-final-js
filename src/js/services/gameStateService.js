// Service pour gérer l'état global du jeu
import { storageService } from './storageService.js';

class GameStateService {
    constructor() {
        this.state = {
            deck: [],
            hand: [],
            discard: [], // Ajout de la défausse
            lastDrawTime: null,
            drawCooldown: 5 * 60 * 1000, // 5 minutes en millisecondes
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
            
            console.log('✅ Données chargées depuis le LocalStorage');
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
                draws: this.state.draws
            };
            
            const success = storageService.saveGameData(data);
            if (success) {
                console.log('✅ Données sauvegardées dans le LocalStorage');
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

    // Ajouter des cartes à la pioche
    addCardsToDeck(cards) {
        this.state.deck.push(...cards);
        this.state.lastDrawTime = Date.now();
        this.state.totalCardsDrawn += cards.length;
        this.saveGameData();
    }

    // Déplacer une carte entre la pioche et la main
    moveCard(fromLocation, toLocation, cardId) {
        const sourceArray = fromLocation === 'deck' ? this.state.deck : this.state.hand;
        const targetArray = toLocation === 'deck' ? this.state.deck : this.state.hand;
        
        const cardIdx = sourceArray.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return false;
        
        const card = sourceArray.splice(cardIdx, 1)[0];
        
        // Gestion de la limite de 5 cartes en main
        if (toLocation === 'hand' && this.state.hand.length >= 5) {
            // Rotation : la première carte va à la pioche
            const rotatedCard = this.state.hand.shift();
            this.state.deck.push(rotatedCard);
        }
        
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

    // Réinitialiser le deck et la main
    resetDeckAndHand() {
        this.state.deck = [];
        this.state.hand = [];
        this.state.lastDrawTime = null;
        this.saveGameData();
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
}

// Exporter une instance unique du service
export const gameStateService = new GameStateService(); 