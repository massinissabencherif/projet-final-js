// Service pour gérer les cartes et leur affichage
import { dragDropService } from './dragDropService.js';

class CardService {
    constructor() {
        this.typeColors = {
            'Fire': '#ff6b6b',
            'Water': '#4ecdc4',
            'Grass': '#51cf66',
            'Electric': '#ffd43b',
            'Psychic': '#cc5de8',
            'Fighting': '#ff922b',
            'Darkness': '#495057',
            'Metal': '#868e96',
            'Fairy': '#fcc2d7',
            'Dragon': '#e64980',
            'Colorless': '#f8f9fa',
            'Normal': '#f8f9fa'
        };
        this.collection = this.loadCollection();
    }

    // Créer un élément de carte
    createCardElement(card, location, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.location = location;
        cardDiv.dataset.index = index;
        
        // Rendre la carte draggable
        cardDiv.draggable = true;
        
        // Définir la couleur selon le type
        const typeColor = this.getTypeColor(card.type);
        cardDiv.style.backgroundColor = typeColor;
        
        // Contenu de la carte
        cardDiv.innerHTML = `
            <div class="card-header">
                <h4>${card.name}</h4>
                <span class="card-type">${card.type}</span>
            </div>
            <div class="card-image">
                ${card.imageUrl ? `<img src="${card.imageUrl}" alt="${card.name}" onerror="this.style.display='none'">` : '<div class="no-image">Pas d\'image</div>'}
            </div>
            <div class="card-stats">
                <span class="hp">PV: ${card.hp}</span>
            </div>
        `;
        
        // Configurer le drag & drop pour cette carte
        dragDropService.setupCardDrag(cardDiv, card, location, index);
        
        // Ajouter un événement de clic pour afficher les détails
        cardDiv.addEventListener('click', () => this.showCardDetails(card));
        
        return cardDiv;
    }

    // Créer un élément de carte pour le combat
    createBattleCardElement(card, location, index) {
        const cardDiv = this.createCardElement(card, location, index);
        cardDiv.classList.add('battle-card');
        return cardDiv;
    }

    // Obtenir la couleur selon le type de Pokémon
    getTypeColor(type) {
        return this.typeColors[type] || '#f8f9fa';
    }

    // Afficher les détails d'une carte
    showCardDetails(card) {
        const modal = document.getElementById('card-modal');
        const cardDetails = document.getElementById('card-details');
        
        if (!modal || !cardDetails) {
            console.error('Modal de détails de carte non trouvée');
            return;
        }
        
        // Formater les types pour l'affichage
        const typesDisplay = Array.isArray(card.types) ? card.types.join(', ') : card.type;
        
        cardDetails.innerHTML = `
            <h2>${card.name}</h2>
            <div class="card-detail-image">
                ${card.imageUrlLarge ? `<img src="${card.imageUrlLarge}" alt="${card.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                <p style="display: ${card.imageUrlLarge ? 'none' : 'block'}; color: #95a5a6; font-style: italic;">Aucune image disponible</p>
            </div>
            <div class="card-detail-info">
                <p><strong>Type:</strong> <span>${typesDisplay}</span></p>
                <p><strong>Points de vie:</strong> <span>${card.hp}</span></p>
                <p><strong>Attaque:</strong> <span>${card.attack || 'N/A'}</span></p>
                <p><strong>Défense:</strong> <span>${card.defense || 'N/A'}</span></p>
                <p><strong>Supertype:</strong> <span>${card.supertype || 'Pokémon'}</span></p>
                <p><strong>ID:</strong> <span>${card.id}</span></p>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // Afficher les cartes dans un conteneur
    displayCardsInContainer(container, cards, location, options = {}) {
        if (!container) return;
        
        // Vider le conteneur
        container.innerHTML = '';
        
        // Options par défaut
        const {
            isBattleMode = false,
            onCardClick = null,
            showSelection = false,
            selectedIndex = -1
        } = options;
        
        cards.forEach((card, index) => {
            const cardElement = isBattleMode 
                ? this.createBattleCardElement(card, location, index)
                : this.createCardElement(card, location, index);
            
            // Ajouter la classe de sélection si nécessaire
            if (showSelection && index === selectedIndex) {
                cardElement.classList.add('selected-battle-card');
            }
            
            // Gestionnaire de clic personnalisé si fourni
            if (onCardClick) {
                cardElement.addEventListener('click', () => onCardClick(index, card));
            }
            
            container.appendChild(cardElement);
        });
    }

    // Appliquer des animations sur les cartes de combat
    applyBattleAnimations(playerCardElement, opponentCardElement, result) {
        // Nettoyer d'abord les anciennes classes d'animation
        [playerCardElement, opponentCardElement].forEach(div => {
            if (div) {
                div.classList.remove('glow-win', 'flip-win', 'shake-lose', 'pulse-draw');
            }
        });

        // Appliquer selon le résultat
        if (result === 'victoire') {
            if (playerCardElement) {
                playerCardElement.classList.add('glow-win', 'flip-win');
            }
            if (opponentCardElement) {
                opponentCardElement.classList.add('shake-lose');
            }
        } else if (result === 'défaite') {
            if (playerCardElement) {
                playerCardElement.classList.add('shake-lose');
            }
            if (opponentCardElement) {
                opponentCardElement.classList.add('glow-win', 'flip-win');
            }
        } else {
            // égalité
            if (playerCardElement) {
                playerCardElement.classList.add('pulse-draw');
            }
            if (opponentCardElement) {
                opponentCardElement.classList.add('pulse-draw');
            }
        }

        // Nettoyer les classes d'animation après la durée
        setTimeout(() => {
            [playerCardElement, opponentCardElement].forEach(div => {
                if (div) {
                    div.classList.remove('glow-win', 'flip-win', 'shake-lose', 'pulse-draw');
                }
            });
        }, 1300);
    }

    // Valider une carte
    validateCard(card) {
        const requiredFields = ['id', 'name', 'type', 'hp'];
        
        for (const field of requiredFields) {
            if (!(field in card)) {
                return { valid: false, error: `Champ manquant: ${field}` };
            }
        }
        
        if (typeof card.hp !== 'string' && typeof card.hp !== 'number') {
            return { valid: false, error: 'Les points de vie doivent être une chaîne ou un nombre' };
        }
        
        return { valid: true };
    }

    // Formater une carte pour l'affichage
    formatCardForDisplay(card) {
        return {
            ...card,
            displayName: card.name || 'Carte inconnue',
            displayHp: card.hp || 'N/A',
            displayType: card.type || 'Normal',
            hasImage: !!card.imageUrl
        };
    }

    // Obtenir les statistiques d'une carte
    getCardStats(card) {
        const attack = parseInt(card.attack) || 0;
        const defense = parseInt(card.defense) || 0;
        const hp = parseInt(card.hp) || 0;
        
        return {
            attack,
            defense,
            hp,
            totalPower: attack + hp,
            averageStats: Math.round((attack + defense + hp) / 3)
        };
    }

    // Ajoute des cartes à la collection (en évitant les doublons exacts)
    addCardsToCollection(cards) {
        if (!Array.isArray(cards)) return;
        let added = 0;
        for (const card of cards) {
            // On considère qu'une carte est unique par son id
            if (!this.collection.some(c => c.id === card.id)) {
                this.collection.push(card);
                added++;
            }
        }
        this.saveCollection();
        return added;
    }

    // Récupère la collection complète
    getCollection() {
        return this.collection;
    }

    // Persistance
    saveCollection() {
        localStorage.setItem('pokemon_collection', JSON.stringify(this.collection));
    }
    loadCollection() {
        const data = localStorage.getItem('pokemon_collection');
        return data ? JSON.parse(data) : [];
    }
}

// Exporter une instance unique du service
export const cardService = new CardService(); 