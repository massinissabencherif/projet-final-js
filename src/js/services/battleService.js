// Service pour gérer les combats entre le joueur et l'IA
import { storageService } from './storageService.js';

class BattleService {
    constructor() {
        this.opponentHand = [];
        this.opponentBattleCard = null;
        this.battlePlayerCard = null;
        this.selectedBattleCard = null;
        this.inBattle = false;
        this.preBattleDeck = null;
        this.preBattleHand = null;
    }

    // Initialiser la main de l'IA pour le combat
    initOpponentHand(playerDeck) {
        const nbCards = Math.min(5, playerDeck.length);
        const shuffled = [...playerDeck].sort(() => Math.random() - 0.5);
        this.opponentHand = shuffled.slice(0, nbCards);
        this.opponentBattleCard = null;
        this.saveBattleState();
    }

    // L'IA choisit une carte aléatoire de sa main pour le combat
    opponentChooseBattleCard() {
        if (!this.opponentHand || this.opponentHand.length === 0) {
            this.opponentBattleCard = null;
            this.saveBattleState();
            return;
        }
        const idx = Math.floor(Math.random() * this.opponentHand.length);
        this.opponentBattleCard = this.opponentHand[idx];
        this.saveBattleState();
    }

    // Sauvegarder l'état du combat
    saveBattleState() {
        const battleData = {
            opponentHand: this.opponentHand,
            opponentBattleCard: this.opponentBattleCard,
            battlePlayerCard: this.battlePlayerCard,
            selectedBattleCard: this.selectedBattleCard,
            inBattle: this.inBattle
        };
        storageService.savePartialData('battleState', battleData);
    }

    // Charger l'état du combat
    loadBattleState() {
        const battleData = storageService.loadPartialData('battleState', {});
        this.opponentHand = battleData.opponentHand || [];
        this.opponentBattleCard = battleData.opponentBattleCard || null;
        this.battlePlayerCard = battleData.battlePlayerCard || null;
        this.selectedBattleCard = battleData.selectedBattleCard || null;
        this.inBattle = battleData.inBattle || false;
    }

    // Sauvegarder l'état avant le combat
    savePreBattleState(deck, hand) {
        this.preBattleDeck = JSON.parse(JSON.stringify(deck));
        this.preBattleHand = JSON.parse(JSON.stringify(hand));
        this.inBattle = true;
        this.saveBattleState();
    }

    // Restaurer l'état d'avant combat
    restorePreBattleState() {
        this.inBattle = false;
        this.battlePlayerCard = null;
        this.opponentBattleCard = null;
        this.saveBattleState();
        return {
            deck: this.preBattleDeck,
            hand: this.preBattleHand
        };
    }

    // Lancer le combat et calculer le résultat
    executeBattle() {
        const playerCard = this.battlePlayerCard;
        const opponentCard = this.opponentBattleCard;
        
        if (!playerCard || !opponentCard) {
            return { error: 'Il faut une carte dans chaque zone de combat !' };
        }

        // Calcul des scores
        const playerScore = (parseInt(playerCard.attack) || 0) + (parseInt(playerCard.hp) || 0);
        const opponentScore = (parseInt(opponentCard.attack) || 0) + (parseInt(opponentCard.hp) || 0);

        let result = '';
        if (playerScore > opponentScore) {
            result = 'victoire';
        } else if (playerScore < opponentScore) {
            result = 'défaite';
        } else {
            result = 'égalité';
        }

        return {
            result,
            playerCard,
            opponentCard,
            playerScore,
            opponentScore
        };
    }

    // Réinitialiser les zones de combat
    resetBattleZones() {
        this.battlePlayerCard = null;
        this.opponentBattleCard = null;
        this.saveBattleState();
    }

    // Déplacer une carte de la main vers la zone de combat du joueur
    moveCardToBattleZone(cardId, playerHand) {
        // Si une carte est déjà présente, la remettre dans la main
        if (this.battlePlayerCard) {
            playerHand.push(this.battlePlayerCard);
        }
        
        const cardIdx = playerHand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return false;
        
        this.battlePlayerCard = playerHand.splice(cardIdx, 1)[0];
        
        // S'assurer que la main de l'IA existe et choisir une carte
        if (!this.opponentHand || this.opponentHand.length === 0) {
            this.initOpponentHand(playerHand);
        }
        this.opponentChooseBattleCard();
        this.saveBattleState();
        
        return true;
    }

    // Remettre la carte de la zone de combat dans la main
    moveCardFromBattleZoneToHand(playerHand) {
        if (this.battlePlayerCard) {
            playerHand.push(this.battlePlayerCard);
            this.battlePlayerCard = null;
            this.saveBattleState();
            return true;
        }
        return false;
    }

    // Getters pour l'état du combat
    getOpponentHand() { return this.opponentHand; }
    getOpponentBattleCard() { return this.opponentBattleCard; }
    getBattlePlayerCard() { return this.battlePlayerCard; }
    getSelectedBattleCard() { return this.selectedBattleCard; }
    isInBattle() { return this.inBattle; }

    // Setters pour l'état du combat
    setSelectedBattleCard(index) { 
        this.selectedBattleCard = index; 
        this.saveBattleState();
    }
    setBattlePlayerCard(card) { 
        this.battlePlayerCard = card; 
        this.saveBattleState();
    }
    setOpponentBattleCard(card) {
        this.opponentBattleCard = card;
        this.saveBattleState();
    }
}

// Exporter une instance unique du service
export const battleService = new BattleService(); 