// Service pour interagir avec l'API Pokémon TCG
class ApiService {
    constructor() {
        this.baseUrl = 'https://api.pokemontcg.io/v2';
        this.apiKey = '5416d2a8-717a-4784-9f4a-b3260f558f01';
        this.headers = {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    // Récupérer des cartes aléatoires avec cache local
    async getRandomCards(count = 5) {
        try {
            // Vérifier le cache local
            const cacheKey = 'pokemon_cards_cache';
            const cacheTimestampKey = 'pokemon_cards_cache_timestamp';
            const cacheDuration = 24 * 60 * 60 * 1000; // 24h
            const now = Date.now();
            let cards = [];
            let useCache = false;

            const cachedCards = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
            if (cachedCards && cachedTimestamp && (now - parseInt(cachedTimestamp, 10) < cacheDuration)) {
                try {
                    cards = JSON.parse(cachedCards);
                    useCache = true;
                    console.log('✅ Utilisation du cache local pour les cartes Pokémon');
                } catch (e) {
                    // Si le cache est corrompu, on l'ignore
                    cards = [];
                }
            }

            // Si pas de cache ou cache expiré, on va chercher les cartes à l'API
            if (!useCache || cards.length === 0) {
                console.log('Récupération de 250 cartes depuis l\'API...');
                try {
                    const response = await fetch(`${this.baseUrl}/cards?pageSize=250&select=id,name,types,hp,images,supertype`, {
                        headers: this.headers
                    });
                    if (!response.ok) {
                        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    cards = data.data || [];
                    // Mettre à jour le cache
                    localStorage.setItem(cacheKey, JSON.stringify(cards));
                    localStorage.setItem(cacheTimestampKey, now.toString());
                    console.log('✅ Cache local mis à jour avec les cartes Pokémon');
                } catch (apiError) {
                    console.warn('⚠️ Impossible de récupérer les cartes depuis l\'API, utilisation du mode hors ligne');
                    // Retourner des cartes factices sans lever d'erreur
                    return this.generateOfflineCards(count);
                }
            }

            // Sélectionner des cartes aléatoires
            const randomCards = this.shuffleArray(cards).slice(0, count);
            // Formater les cartes pour notre application
            const formattedCards = randomCards.map(card => this.formatCard(card));
            console.log(`${formattedCards.length} cartes récupérées (cache: ${useCache})`);
            return formattedCards;
        } catch (error) {
            console.warn('⚠️ Erreur lors de la récupération des cartes, utilisation du mode hors ligne');
            return this.generateOfflineCards(count);
        }
    }

    // Récupérer une carte spécifique par ID
    async getCardById(cardId) {
        try {
            console.log(`Récupération de la carte ${cardId}...`);
            
            const response = await fetch(`${this.baseUrl}/cards/${cardId}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const card = data.data;

            if (!card) {
                throw new Error('Carte non trouvée');
            }

            const formattedCard = this.formatCard(card);
            console.log(`Carte ${cardId} récupérée avec succès`);
            return formattedCard;

        } catch (error) {
            console.error('Erreur lors de la récupération de la carte:', error);
            throw error;
        }
    }

    // Rechercher des cartes par nom
    async searchCards(query, limit = 10) {
        try {
            console.log(`Recherche de cartes avec la requête: ${query}`);
            
            const response = await fetch(`${this.baseUrl}/cards?q=name:${encodeURIComponent(query)}&pageSize=${limit}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const cards = data.data || [];

            const formattedCards = cards.map(card => this.formatCard(card));
            console.log(`${formattedCards.length} cartes trouvées pour "${query}"`);
            return formattedCards;

        } catch (error) {
            console.error('Erreur lors de la recherche de cartes:', error);
            throw error;
        }
    }

    // Formater une carte pour notre application
    formatCard(card) {
        return {
            id: card.id,
            name: card.name,
            types: card.types || ['Colorless'],
            hp: card.hp || 'N/A',
            supertype: card.supertype || 'Pokémon',
            imageUrl: card.images?.small || null,
            imageUrlLarge: card.images?.large || null,
            // Ajouter des propriétés pour la compatibilité avec notre système
            type: card.types?.[0] || 'Colorless',
            attack: Math.floor(Math.random() * 100) + 50, // Valeur simulée pour l'instant
            defense: Math.floor(Math.random() * 50) + 25   // Valeur simulée pour l'instant
        };
    }

    // Mélanger un tableau (algorithme Fisher-Yates)
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Vérifier la connectivité de l'API
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/cards?pageSize=1`, {
                headers: this.headers
            });
            
            if (response.ok) {
                console.log('✅ Connexion à l\'API Pokémon TCG réussie');
                return true;
            } else {
                console.warn('⚠️ Erreur de connexion à l\'API:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de se connecter à l\'API, mode hors ligne activé');
            return false;
        }
    }

    // Vérifier si les cartes sont déjà en cache et valides
    areCardsCached() {
        const cacheKey = 'pokemon_cards_cache';
        const cacheTimestampKey = 'pokemon_cards_cache_timestamp';
        const cacheDuration = 24 * 60 * 60 * 1000; // 24h
        const now = Date.now();
        const cachedCards = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
        if (cachedCards && cachedTimestamp && (now - parseInt(cachedTimestamp, 10) < cacheDuration)) {
            try {
                const cards = JSON.parse(cachedCards);
                return Array.isArray(cards) && cards.length > 0;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    // Générer des cartes factices pour le mode hors ligne
    generateOfflineCards(count = 5) {
        const offlineCards = [];
        const pokemonNames = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Gyarados', 'Dragonite', 'Alakazam', 'Gengar', 'Machamp'];
        const types = ['Feu', 'Eau', 'Plante', 'Électrique', 'Psychique', 'Combat', 'Normal', 'Vol', 'Poison', 'Sol'];
        
        for (let i = 0; i < count; i++) {
            const randomName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
            const randomType = types[Math.floor(Math.random() * types.length)];
            offlineCards.push({
                id: `offline-card-${Date.now()}-${i}`,
                name: `${randomName} ${i + 1}`,
                type: randomType,
                types: [randomType],
                hp: Math.floor(Math.random() * 100) + 50,
                supertype: 'Pokémon',
                imageUrl: null,
                imageUrlLarge: null,
                attack: Math.floor(Math.random() * 100) + 50,
                defense: Math.floor(Math.random() * 50) + 25
            });
        }
        return offlineCards;
    }
}

// Exporter une instance unique du service
export const apiService = new ApiService(); 