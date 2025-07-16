// Service pour gérer les combats entre le joueur et l'IA
import { storageService } from './storageService.js';
import { apiService } from './apiService.js';
import { gameStateService } from './gameStateService.js';

class BattleService {
    constructor() {
        this.opponentHand = [];
        this.opponentDeck = []; // Nouveau : deck séparé pour l'IA
        this.opponentDiscard = []; // Nouveau : défausse séparée pour l'IA
        this.opponentBattleCard = null;
        this.battlePlayerCard = null;
        this.selectedBattleCard = null;
        this.inBattle = false;
        this.preBattleDeck = null;
        this.preBattleHand = null;
        this.battleStateLoaded = false; // Ajout du flag
    }

    // Initialiser le deck de l'IA avec 5 cartes différentes du joueur
    async initOpponentDeck() {
        try {
            console.log('Initialisation du deck de l\'IA...');
            // Récupérer 5 cartes aléatoires pour l'IA
            const opponentCards = await apiService.getRandomCards(5);
            this.opponentDeck = opponentCards;
            console.log(`✅ Deck de l'IA initialisé avec ${opponentCards.length} cartes`);
            this.saveBattleState();
            return true;
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'initialisation du deck IA, utilisation du mode hors ligne');
            // Mode hors ligne : générer 5 cartes factices pour l'IA
            this.opponentDeck = this.generateOfflineOpponentCards(5);
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

    // Initialiser la main de l'IA pour le combat (5 cartes directes, deck vide)
    async initOpponentHand() {
        try {
            console.log('🔄 Initialisation de la main de l\'IA...');
            
            // Récupérer 5 cartes aléatoires pour la main de l'IA
            const opponentCards = await apiService.getRandomCards(5);
            this.opponentHand = opponentCards;
            this.opponentBattleCard = null;
            
            // S'assurer que le deck et la défausse existent
            if (!this.opponentDeck) {
                this.opponentDeck = [];
            }
            if (!this.opponentDiscard) {
                this.opponentDiscard = [];
            }
            
            console.log(`✅ Main de l'IA initialisée avec ${this.opponentHand.length} cartes`);
            console.log(`✅ Deck IA: ${this.opponentDeck.length} cartes (vide au départ)`);
            console.log(`✅ Défausse IA: ${this.opponentDiscard.length} cartes`);
            this.saveBattleState();
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de la main IA:', error);
            // Fallback : cartes factices
            this.opponentHand = this.generateOfflineOpponentCards(5);
            this.opponentDeck = [];
            this.opponentDiscard = [];
            this.saveBattleState();
        }
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
            console.log(`✅ L'IA a pioché ${drawnCard.name} (main: ${this.opponentHand.length}/5 cartes)`);
            
            // Vérifier si la main doit être complétée automatiquement
            this.checkAndFillOpponentHand();
            
            this.saveBattleState();
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
        console.log('=== SAUVEGARDE DE L\'ÉTAT DU COMBAT ===');
        const battleData = {
            opponentHand: this.opponentHand,
            opponentDeck: this.opponentDeck, // Sauvegarder le deck de l'IA
            opponentDiscard: this.opponentDiscard, // Sauvegarder la défausse de l'IA
            opponentBattleCard: this.opponentBattleCard,
            battlePlayerCard: this.battlePlayerCard,
            selectedBattleCard: this.selectedBattleCard,
            inBattle: this.inBattle
        };
        console.log('Données à sauvegarder:', battleData);
        
        const success1 = storageService.savePartialData('battleState', battleData);
        const success2 = gameStateService.saveBattleState(battleData);
        
        console.log('Sauvegarde storageService:', success1);
        console.log('Sauvegarde gameStateService:', success2);
        console.log('État de combat sauvegardé:', { 
            inBattle: this.inBattle, 
            opponentHand: this.opponentHand.length,
            opponentDeck: this.opponentDeck.length,
            opponentDiscard: this.opponentDiscard.length
        });
        console.log('=== FIN SAUVEGARDE ÉTAT COMBAT ===');
    }

    // Charger l'état du combat
    loadBattleState() {
        console.log('=== CHARGEMENT DE L\'ÉTAT DU COMBAT ===');
        // Log avant chargement
        console.log('[DEBUG] AVANT chargement - main IA:', this.opponentHand, 'deck IA:', this.opponentDeck);
        // Essayer d'abord gameStateService, puis storageService comme fallback
        let battleData = gameStateService.loadBattleState();
        if (!battleData) {
            console.log('Aucun état de combat dans gameStateService, essai avec storageService...');
            battleData = storageService.loadPartialData('battleState', {});
        }
        console.log('Données brutes chargées:', battleData);
        this.opponentHand = battleData.opponentHand || [];
        this.opponentDeck = battleData.opponentDeck || [];
        this.opponentDiscard = battleData.opponentDiscard || [];
        this.opponentBattleCard = battleData.opponentBattleCard || null;
        this.battlePlayerCard = battleData.battlePlayerCard || null;
        this.selectedBattleCard = battleData.selectedBattleCard || null;
        this.inBattle = battleData.inBattle || false;
        this.battleStateLoaded = true;
        // Log après chargement
        console.log('[DEBUG] APRÈS chargement - main IA:', this.opponentHand, 'deck IA:', this.opponentDeck);
        console.log('État de combat chargé:', { 
            inBattle: this.inBattle, 
            opponentHand: this.opponentHand.length,
            opponentDeck: this.opponentDeck.length,
            opponentDiscard: this.opponentDiscard.length,
            battlePlayerCard: this.battlePlayerCard ? 'présente' : 'absente',
            opponentBattleCard: this.opponentBattleCard ? 'présente' : 'absente'
        });
        console.log('=== FIN CHARGEMENT ÉTAT COMBAT ===');
    }

    // Sauvegarder l'état avant le combat
    savePreBattleState(deck, hand) {
        console.log('=== SAUVEGARDE ÉTAT AVANT COMBAT ===');
        this.preBattleDeck = JSON.parse(JSON.stringify(deck));
        this.preBattleHand = JSON.parse(JSON.stringify(hand));
        this.inBattle = true;
        console.log('inBattle défini à:', this.inBattle);
        this.saveBattleState();
        console.log('=== FIN SAUVEGARDE ÉTAT AVANT COMBAT ===');
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
            await this.initOpponentHand();
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

    // Déplacer une carte de la main de l'IA vers la défausse de l'IA
    moveOpponentCardToDiscard(cardId) {
        const idx = this.opponentHand.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            const [card] = this.opponentHand.splice(idx, 1);
            this.opponentDiscard.push(card);
            console.log(`✅ Carte ${card.name} défaussée de la main IA (main: ${this.opponentHand.length}/5 cartes)`);
            
            // Compléter automatiquement la main si elle a moins de 5 cartes et qu'il y a des cartes dans le deck
            this.checkAndFillOpponentHand();
            
            this.saveBattleState();
        }
    }

    // Ajoute exactement 'count' cartes au deck de l'IA (ajoute au deck existant)
    async setOpponentDeck(count = 5) {
        console.log(`🔄 Ajout de ${count} cartes au deck IA (deck actuel: ${this.opponentDeck.length} cartes)`);
        
        try {
            const opponentCards = await apiService.getRandomCards(count);
            const newCards = opponentCards.map(card => ({ ...card, isOpponentCard: true }));
            
            // Ajouter les nouvelles cartes au deck existant (pas de remplacement)
            this.opponentDeck.push(...newCards);
            
            console.log(`✅ ${newCards.length} cartes ajoutées au deck IA (total: ${this.opponentDeck.length} cartes)`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de cartes au deck IA:', error);
            const offlineCards = this.generateOfflineOpponentCards(count);
            this.opponentDeck.push(...offlineCards);
            console.log(`✅ ${offlineCards.length} cartes factices ajoutées au deck IA (total: ${this.opponentDeck.length} cartes)`);
        }
        
        // Vérifier si la main doit être complétée automatiquement après l'ajout de cartes au deck
        this.checkAndFillOpponentHand();
        
        this.saveBattleState();
    }

    // Donne une nouvelle main de 'count' cartes à l'IA
    async giveOpponentNewHand(count = 5) {
        // Vider la main actuelle
        this.opponentHand = [];
        // Tenter de récupérer des cartes depuis l'API
        try {
            const opponentCards = await apiService.getRandomCards(count);
            this.opponentHand = opponentCards.map(card => ({ ...card, isOpponentCard: true }));
        } catch (error) {
            // Mode offline : générer des cartes factices
            this.opponentHand = this.generateOfflineOpponentCards(count);
        }
        this.saveBattleState();
    }

    // Transfère toutes les cartes du deck de l'IA vers sa main (main = deck, deck vidé)
    transferOpponentDeckToHand() {
        this.opponentHand = [...this.opponentDeck];
        this.opponentDeck = [];
        this.saveBattleState();
    }

    // Complète la main de l'IA avec des cartes du deck jusqu'à 5 cartes (appelé lors du tirage manuel ET automatiquement)
    fillOpponentHandFromDeck() {
        console.log(`🔄 Complétion main IA: ${this.opponentHand.length}/5 cartes, deck: ${this.opponentDeck.length} cartes`);
        
        while (this.opponentHand.length < 5 && this.opponentDeck.length > 0) {
            const card = this.opponentDeck.shift();
            this.opponentHand.push(card);
            console.log(`✅ Carte ${card.name} transférée du deck vers la main IA`);
        }
        
        console.log(`✅ Main IA complétée: ${this.opponentHand.length}/5 cartes, deck restant: ${this.opponentDeck.length} cartes`);
        this.saveBattleState();
    }

    // Vérifie et complète automatiquement la main de l'IA si nécessaire
    checkAndFillOpponentHand() {
        if (this.opponentHand.length < 5 && this.opponentDeck.length > 0) {
            console.log(`🔄 Vérification automatique: main IA ${this.opponentHand.length}/5, deck ${this.opponentDeck.length} cartes`);
            this.fillOpponentHandFromDeck();
        }
    }

    // Getters pour l'état du combat
    getOpponentHand() { return this.opponentHand; }
    getOpponentDeck() { return this.opponentDeck; } // Nouveau getter
    getOpponentDiscard() { return this.opponentDiscard; } // Nouveau getter pour la défausse de l'IA
    getOpponentBattleCard() { return this.opponentBattleCard; }
    getBattlePlayerCard() { return this.battlePlayerCard; }
    getSelectedBattleCard() { return this.selectedBattleCard; }
    isInBattle() { return this.inBattle; }
    
    // Obtenir la pile de défausse (pour l'affichage)
    getDiscardPile() {
        // Pour l'instant, retourner un tableau vide
        // Cette méthode sera utilisée pour afficher les cartes de défausse
        return [];
    }

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
    
    setOpponentDiscard(discard) {
        this.opponentDiscard = discard;
        this.saveBattleState();
    }

    // Pioche une carte du deck IA vers la main si la main a moins de 5 cartes
    opponentDrawIfNeeded() {
        if (this.opponentHand.length < 5 && this.opponentDeck.length > 0) {
            const card = this.opponentDeck.shift();
            this.opponentHand.push(card);
            this.saveBattleState();
        }
    }

    // Réinitialiser complètement l'état du combat
    resetBattleState() {
        console.log('🔄 Réinitialisation complète de l\'état du combat...');
        
        // Réinitialiser toutes les propriétés du combat
        this.opponentHand = [];
        this.opponentDeck = [];
        this.opponentDiscard = [];
        this.opponentBattleCard = null;
        this.battlePlayerCard = null;
        this.selectedBattleCard = null;
        this.inBattle = false;
        this.preBattleDeck = null;
        this.preBattleHand = null;
        this.battleStateLoaded = false;
        
        // Sauvegarder l'état réinitialisé
        this.saveBattleState();
        
        // Nettoyer les données de combat dans le localStorage
        storageService.removePartialData('battleState');
        gameStateService.saveBattleState(null);
        
        console.log('✅ État du combat réinitialisé avec succès');
    }
}

// Exporter une instance unique du service
export const battleService = new BattleService(); 