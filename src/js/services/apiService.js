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

    // Récupérer des cartes aléatoires
    async getRandomCards(count = 5) {
        try {
            console.log(`Récupération de ${count} cartes aléatoires...`);
            
            // Récupérer d'abord un ensemble de cartes pour avoir une base
            const response = await fetch(`${this.baseUrl}/cards?pageSize=250&select=id,name,types,hp,images,supertype`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const cards = data.data || [];

            if (cards.length === 0) {
                throw new Error('Aucune carte trouvée');
            }

            // Sélectionner des cartes aléatoires
            const randomCards = this.shuffleArray(cards).slice(0, count);
            
            // Formater les cartes pour notre application
            const formattedCards = randomCards.map(card => this.formatCard(card));
            
            console.log(`${formattedCards.length} cartes récupérées avec succès`);
            return formattedCards;

        } catch (error) {
            console.error('Erreur lors de la récupération des cartes:', error);
            throw error;
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
                console.log('Connexion à l\'API Pokémon TCG réussie');
                return true;
            } else {
                console.error('Erreur de connexion à l\'API:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Impossible de se connecter à l\'API:', error);
            return false;
        }
    }
}

// Exporter une instance unique du service
export const apiService = new ApiService(); 