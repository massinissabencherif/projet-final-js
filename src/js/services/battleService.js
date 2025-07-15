// Service pour gérer les combats entre le joueur et l'IA
import { storageService } from './storageService.js';
import { apiService } from './apiService.js';

class BattleService {
    constructor() {
        this.opponentHand = [];
        this.opponentDeck = []; // Nouveau : deck séparé pour l'IA
        this.opponentBattleCard = null;
        this.battlePlayerCard = null;
        this.selectedBattleCard = null;
        this.inBattle = false;
        this.preBattleDeck = null;
        this.preBattleHand = null;
    }

    // Initialiser le deck de l'IA avec des cartes différentes du joueur
    async initOpponentDeck() {
        try {
            console.log('Initialisation du deck de l\'IA...');
            
            // Récupérer 20 cartes aléatoires pour l'IA (deck plus grand)
            const opponentCards = await apiService.getRandomCards(20);
            this.opponentDeck = opponentCards;
            
            console.log(`✅ Deck de l'IA initialisé avec ${opponentCards.length} cartes`);
            this.saveBattleState();
            return true;
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'initialisation du deck IA, utilisation du mode hors ligne');
            // Mode hors ligne : générer des cartes factices pour l'IA
            this.opponentDeck = this.generateOfflineOpponentCards(20);
            this.saveBattleState();
            return false;
        }
    }

    // Générer des cartes factices pour l'IA en mode hors ligne
    generateOfflineOpponentCards(count = 20) {
        const offlineCards = [];
        const pokemonNames = [
            'Mewtwo', 'Rayquaza', 'Dialga', 'Palkia', 'Giratina', 'Arceus',
            'Lugia', 'Ho-Oh', 'Kyogre', 'Groudon', 'Deoxys', 'Jirachi',
            'Celebi', 'Suicune', 'Entei', 'Raikou', 'Lugia', 'Ho-Oh',
            'Latios', 'Latias'
        ];
        const types = ['Psychique', 'Dragon', 'Acier', 'Eau', 'Sol', 'Feu', 'Électrique', 'Normal', 'Combat', 'Ténèbres'];
        
        for (let i = 0; i < count; i++) {
            const randomName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomHp = Math.floor(Math.random() * 150) + 50; // HP entre 50 et 200
            
            offlineCards.push({
                id: `opponent-offline-${Date.now()}-${i}`,
                name: randomName,
                type: randomType,
                hp: randomHp,
                attack: Math.floor(Math.random() * 120) + 60, // Attaque entre 60 et 180
                defense: Math.floor(Math.random() * 80) + 40, // Défense entre 40 et 120
                imageUrl: null,
                isOpponentCard: true // Marqueur pour identifier les cartes de l'IA
            });
        }
        
        return offlineCards;
    }

    // Initialiser la main de l'IA pour le combat (utilise maintenant le deck de l'IA)
    initOpponentHand() {
        if (this.opponentDeck.length === 0) {
            console.warn('⚠️ Deck de l\'IA vide, initialisation...');
            this.initOpponentDeck();
        }
        
        const nbCards = Math.min(5, this.opponentDeck.length);
        const shuffled = [...this.opponentDeck].sort(() => Math.random() - 0.5);
        this.opponentHand = shuffled.slice(0, nbCards);
        this.opponentBattleCard = null;
        
        console.log(`✅ Main de l'IA initialisée avec ${this.opponentHand.length} cartes`);
        this.saveBattleState();
    }

    // L'IA pioche une nouvelle carte (utilisé quand elle n'a plus de cartes)
    async opponentDrawCard() {
        if (this.opponentDeck.length === 0) {
            // Si le deck est vide, récupérer de nouvelles cartes
            await this.initOpponentDeck();
        }
        
        if (this.opponentDeck.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.opponentDeck.length);
            const drawnCard = this.opponentDeck.splice(randomIndex, 1)[0];
            this.opponentHand.push(drawnCard);
            this.saveBattleState();
            console.log(`✅ L'IA a pioché ${drawnCard.name}`);
            return drawnCard;
        }
        
        return null;
    }

    // L'IA choisit une carte aléatoire de sa main pour le combat
    async opponentChooseBattleCard() {
        // Si l'IA n'a plus de cartes en main, elle pioche
        if (!this.opponentHand || this.opponentHand.length === 0) {
            const drawnCard = await this.opponentDrawCard();
            if (!drawnCard) {
                this.opponentBattleCard = null;
                this.saveBattleState();
                return;
            }
        }
        
        if (this.opponentHand.length > 0) {
            const idx = Math.floor(Math.random() * this.opponentHand.length);
            this.opponentBattleCard = this.opponentHand[idx];
            this.saveBattleState();
        } else {
            this.opponentBattleCard = null;
            this.saveBattleState();
        }
    }

    // Sauvegarder l'état du combat
    saveBattleState() {
        const battleData = {
            opponentHand: this.opponentHand,
            opponentDeck: this.opponentDeck, // Sauvegarder le deck de l'IA
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
        this.opponentDeck = battleData.opponentDeck || []; // Charger le deck de l'IA
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
    async moveCardToBattleZone(cardId, playerHand) {
        // Si une carte est déjà présente, la remettre dans la main
        if (this.battlePlayerCard) {
            playerHand.push(this.battlePlayerCard);
        }
        
        const cardIdx = playerHand.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return false;
        
        this.battlePlayerCard = playerHand.splice(cardIdx, 1)[0];
        
        // S'assurer que la main de l'IA existe et choisir une carte
        if (!this.opponentHand || this.opponentHand.length === 0) {
            this.initOpponentHand();
        }
        await this.opponentChooseBattleCard();
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
    getOpponentDeck() { return this.opponentDeck; } // Nouveau getter
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