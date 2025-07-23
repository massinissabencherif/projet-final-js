// Service pour gérer la persistance des données dans le LocalStorage
class StorageService {
    constructor() {
        this.storageKey = 'pokemonTCGData';
        this.backupKey = 'pokemonTCGDataBackup';
    }

    // Sauvegarder toutes les données du jeu
    saveGameData(gameData) {
        try {
            // Créer une sauvegarde avant d'écraser
            this.createBackup();
            
            // Ajouter un timestamp de sauvegarde
            const dataToSave = {
                ...gameData,
                lastSaveTime: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    // Charger toutes les données du jeu
    loadGameData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            
            if (!savedData) {
                return this.getDefaultGameData();
            }

            const parsedData = JSON.parse(savedData);
            
            // Vérifier la validité des données
            if (!this.validateGameData(parsedData)) {
                console.warn('Données corrompues détectées, restauration de la sauvegarde...');
                return this.restoreBackup();
            }

            return parsedData;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            return this.restoreBackup();
        }
    }

    // Obtenir les données par défaut pour un nouveau jeu
    getDefaultGameData() {
        return {
            deck: [],
            hand: [],
            discard: [], // Ajout de la défausse
            lastDrawTime: null,
            playerName: 'Dresseur',
            totalCardsDrawn: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            lastSaveTime: Date.now(),
            version: '1.0'
        };
    }

    // Valider la structure des données
    validateGameData(data) {
        const requiredFields = ['deck', 'hand', 'lastDrawTime', 'discard'];
        
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`Champ manquant dans les données: ${field}`);
                return false;
            }
        }

        // Vérifier que deck, hand et discard sont des tableaux
        if (!Array.isArray(data.deck) || !Array.isArray(data.hand) || !Array.isArray(data.discard)) {
            console.error('Les champs deck, hand et discard doivent être des tableaux');
            return false;
        }

        // Vérifier que battleState est un objet s'il est présent
        if (data.battleState !== undefined && typeof data.battleState !== 'object') {
            console.error('Le champ battleState doit être un objet');
            return false;
        }

        return true;
    }

    // Créer une sauvegarde de sécurité
    createBackup() {
        try {
            const currentData = localStorage.getItem(this.storageKey);
            if (currentData) {
                localStorage.setItem(this.backupKey, currentData);
            }
        } catch (error) {
            console.error('Erreur lors de la création de la sauvegarde:', error);
        }
    }

    // Restaurer la sauvegarde de sécurité
    restoreBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                const parsedBackup = JSON.parse(backupData);
                if (this.validateGameData(parsedBackup)) {
                    localStorage.setItem(this.storageKey, backupData);
                    return parsedBackup;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la restauration de la sauvegarde:', error);
        }

        console.log('Aucune sauvegarde valide trouvée, utilisation des données par défaut');
        return this.getDefaultGameData();
    }

    // Sauvegarder une partie spécifique des données
    savePartialData(key, value) {
        try {
            const currentData = this.loadGameData();
            currentData[key] = value;
            currentData.lastSaveTime = Date.now();
            
            const success = this.saveGameData(currentData);
            
            return success;
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde partielle de ${key}:`, error);
            return false;
        }
    }

    // Charger une partie spécifique des données
    loadPartialData(key, defaultValue = null) {
        try {
            const gameData = this.loadGameData();
            const result = gameData[key] !== undefined ? gameData[key] : defaultValue;
            return result;
        } catch (error) {
            console.error(`Erreur lors du chargement partiel de ${key}:`, error);
            return defaultValue;
        }
    }

    // Supprimer une partie spécifique des données
    removePartialData(key) {
        try {
            const currentData = this.loadGameData();
            
            if (key in currentData) {
                delete currentData[key];
                currentData.lastSaveTime = Date.now();
                
                const success = this.saveGameData(currentData);
                return success;
            } else {
                return true; // Considéré comme un succès si la clé n'existe pas
            }
        } catch (error) {
            console.error(`Erreur lors de la suppression partielle de ${key}:`, error);
            return false;
        }
    }

    // Effacer toutes les données
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'effacement des données:', error);
            return false;
        }
    }

    // Obtenir des statistiques de stockage
    getStorageStats() {
        try {
            const gameData = this.loadGameData();
            return {
                totalCards: gameData.deck.length + gameData.hand.length,
                deckSize: gameData.deck.length,
                handSize: gameData.hand.length,
                lastSave: gameData.lastSaveTime ? new Date(gameData.lastSaveTime) : null,
                version: gameData.version || '1.0'
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return null;
        }
    }

    // Vérifier si le LocalStorage est disponible
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('LocalStorage non disponible:', error);
            return false;
        }
    }
}

// Exporter une instance unique du service
export const storageService = new StorageService(); 