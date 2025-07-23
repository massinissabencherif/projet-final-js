// Service pour gérer le drag & drop des cartes
class DragDropService {
    constructor() {
        this.draggedCard = null;
        this.draggedElement = null;
        this.dropZones = new Map();
        this.isDragging = false;
        this.zoneListeners = new Map(); // Map pour stocker les handlers par zone
    }

    // Initialiser le service de drag & drop
    init() {
        this.setupDropZones();
        this.setupGlobalEvents();
    }

    // Configurer les zones de drop
    setupDropZones() {
        const deckContainer = document.getElementById('deck-container');
        const handContainer = document.getElementById('hand-container');
        const collectionGrid = document.getElementById('collection-grid');

        if (deckContainer) {
            this.setupDropZone(deckContainer, 'deck');
        }
        if (handContainer) {
            this.setupDropZone(handContainer, 'hand');
        }
        if (collectionGrid) {
            this.setupDropZone(collectionGrid, 'collection');
        }
        // Configurer les zones de drop de l'arène de combat
        this.setupArenaDropZones();
    }
    
    // Configurer les zones de drop de l'arène de combat
    setupArenaDropZones() {
        // Nettoyer les zones existantes pour éviter les doublons
        this.dropZones.clear();
        
        // Zones de combat
        const battleDeckContainer = document.getElementById('battle-deck-container');
        const battleDiscardContainer = document.getElementById('battle-discard-container');
        const battleHandContainer = document.getElementById('battle-hand-container');
        const battlePlayerCombat = document.getElementById('battle-player-combat');
        const battleOpponentCombat = document.getElementById('battle-opponent-combat');
        const battleOpponentDiscardContainer = document.getElementById('battle-opponent-discard-container');
        const battleOpponentHandContainer = document.getElementById('battle-opponent-hand-container');
        
        // Configurer les zones de drop pour les conteneurs
        if (battleDeckContainer) {
            this.setupDropZone(battleDeckContainer, 'battle-deck');
        }
        if (battleDiscardContainer) {
            this.setupDropZone(battleDiscardContainer, 'battle-discard');
        }
        if (battleHandContainer) {
            this.setupDropZone(battleHandContainer, 'battle-hand');
        }
        if (battlePlayerCombat) {
            this.setupDropZone(battlePlayerCombat, 'battle-player-combat');
        }
        if (battleOpponentCombat) {
            this.setupDropZone(battleOpponentCombat, 'battle-opponent-combat');
        }
        if (battleOpponentDiscardContainer) {
            this.setupDropZone(battleOpponentDiscardContainer, 'battle-opponent-discard');
        }
        if (battleOpponentHandContainer) {
            this.setupDropZone(battleOpponentHandContainer, 'battle-opponent-hand');
        }
    }

    // Configurer une zone de drop
    setupDropZone(container, zoneType) {
        this.dropZones.set(zoneType, container);

        // Nettoyer les anciens listeners si présents
        if (this.zoneListeners.has(zoneType)) {
            const old = this.zoneListeners.get(zoneType);
            container.removeEventListener('dragover', old.dragover);
            container.removeEventListener('drop', old.drop);
            container.removeEventListener('dragenter', old.dragenter);
            container.removeEventListener('dragleave', old.dragleave);
        }
        // Créer de nouveaux handlers liés à la zone
        const dragover = (e) => this.handleDragOver(e, zoneType);
        const drop = (e) => this.handleDrop(e, zoneType);
        const dragenter = (e) => this.handleDragEnter(e, zoneType);
        const dragleave = (e) => this.handleDragLeave(e, zoneType);
        container.addEventListener('dragover', dragover);
        container.addEventListener('drop', drop);
        container.addEventListener('dragenter', dragenter);
        container.addEventListener('dragleave', dragleave);
        this.zoneListeners.set(zoneType, { dragover, drop, dragenter, dragleave });
    }

    // Configurer les événements globaux
    setupGlobalEvents() {
        // Événement de fin de drag
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Empêcher le drag par défaut sur les images
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });
    }

    // Configurer une carte pour le drag & drop
    setupCardDrag(cardElement, cardData, location, index) {
        cardElement.draggable = true;
        cardElement.dataset.cardId = cardData.id;
        cardElement.dataset.location = location;
        cardElement.dataset.index = index;

        // Événements de drag pour la carte
        cardElement.addEventListener('dragstart', (e) => this.handleDragStart(e, cardData, location, index));
        cardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }

    // Gérer le début du drag
    handleDragStart(e, cardData, location, index) {
        
        this.draggedCard = cardData;
        this.draggedElement = e.target;
        this.isDragging = true;

        // Effet visuel pendant le drag
        e.target.style.opacity = '0.6';
        e.target.style.transform = 'rotate(5deg) scale(1.05)';
        
        // Données du drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            cardId: cardData.id,
            location: location,
            index: index
        }));

        // Ajouter la classe de drag à toutes les zones
        this.dropZones.forEach((container, zoneType) => {
            if (zoneType !== location) {
                container.classList.add('drop-zone-active');
            }
        });
    }

    // Gérer le survol d'une zone de drop
    handleDragOver(e, zoneType) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    // Gérer l'entrée dans une zone de drop
    handleDragEnter(e, zoneType) {
        e.preventDefault();
        const container = this.dropZones.get(zoneType);
        if (container && this.isValidDrop(zoneType)) {
            container.classList.add('drop-zone-hover');
        }
    }

    // Gérer la sortie d'une zone de drop
    handleDragLeave(e, zoneType) {
        const container = this.dropZones.get(zoneType);
        if (container) {
            container.classList.remove('drop-zone-hover');
        }
    }

    // Gérer le drop
    handleDrop(e, zoneType) {
        e.preventDefault();

        const container = this.dropZones.get(zoneType);
        if (container) {
            container.classList.remove('drop-zone-hover');
        }

        if (!this.isValidDrop(zoneType)) {
            return;
        }

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.moveCard(dragData.location, zoneType, dragData.index);
        } catch (error) {
            // Suppression totale des appels console
        }
    }

    // Gérer la fin du drag
    handleDragEnd(e) {
        
        this.isDragging = false;
        this.draggedCard = null;
        this.draggedElement = null;

        // Restaurer l'apparence de la carte
        if (e.target) {
            e.target.style.opacity = '1';
            e.target.style.transform = '';
        }

        // Retirer les classes de drag de toutes les zones
        this.dropZones.forEach((container) => {
            container.classList.remove('drop-zone-active', 'drop-zone-hover');
        });
    }

    // Vérifier si un drop est valide
    isValidDrop(targetZone) {
        if (!this.draggedCard) return false;
        const sourceLocation = this.draggedElement?.dataset.location;
        if (sourceLocation === targetZone) return false;
        // Collection <-> main/pioche
        if ((sourceLocation === 'collection' && (targetZone === 'hand' || targetZone === 'deck')) ||
            ((sourceLocation === 'hand' || sourceLocation === 'deck') && targetZone === 'collection')) {
            return true;
        }
        // Règles pour le mode normal (pioche ↔ main)
        if ((sourceLocation === 'deck' && targetZone === 'hand') ||
            (sourceLocation === 'hand' && targetZone === 'deck')) {
            return true;
        }

        // Règles pour le mode combat
        if (sourceLocation === 'battle-hand' && targetZone === 'battle-player-combat') {
            return true; // Main → Zone de combat
        }
        if (sourceLocation === 'battle-player-combat' && targetZone === 'battle-hand') {
            return true; // Zone de combat → Main
        }
        if (sourceLocation === 'battle-deck' && targetZone === 'battle-hand') {
            return true; // Pioche → Main
        }
        if (sourceLocation === 'battle-hand' && targetZone === 'battle-discard') {
            return true; // Main → Défausse
        }
        if (sourceLocation === 'battle-player-combat' && targetZone === 'battle-discard') {
            return true; // Zone de combat → Défausse
        }
        if (sourceLocation === 'battle-deck' && targetZone === 'battle-discard') {
            return true; // Pioche → Défausse
        }
        if (sourceLocation === 'battle-discard' && targetZone === 'battle-hand') {
            return true; // Défausse → Main
        }
        if (sourceLocation === 'battle-discard' && targetZone === 'battle-deck') {
            return true; // Défausse → Pioche
        }
        
        // Règles pour les cartes de l'IA
        if (sourceLocation === 'battle-opponent-hand' && targetZone === 'battle-opponent-combat') {
            return true; // Main IA → Zone de combat IA
        }
        if (sourceLocation === 'battle-opponent-combat' && targetZone === 'battle-opponent-hand') {
            return true; // Zone de combat IA → Main IA
        }
        if (sourceLocation === 'battle-opponent-combat' && targetZone === 'battle-opponent-discard') {
            return true; // Zone de combat IA → Défausse IA
        }

        return false;
    }

    // Déplacer une carte
    moveCard(fromLocation, toLocation, cardIndex) {
        // Gestion collection <-> main/pioche
        if (fromLocation === 'collection' && (toLocation === 'hand' || toLocation === 'deck')) {
            // Retirer de la collection, ajouter à la main/pioche
            const cardService = window.cardService;
            const gameStateService = window.gameStateService;
            const card = this.draggedCard;
            if (!cardService || !gameStateService) return;
            // Retirer de la collection
            let collection = cardService.getCollection();
            const idx = collection.findIndex(c => c.id === card.id);
            if (idx !== -1) {
                // Pour la pioche, vérifier la limite globale via addCardsToDeck
                if (toLocation === 'deck') {
                    const added = gameStateService.addCardsToDeck([card]);
                    if (!added) {
                        // Limite atteinte, on ne retire pas la carte de la collection
                        return;
                    }
                    // Si ajout réussi, retirer de la collection
                    collection.splice(idx, 1);
                    cardService.saveCollection();
                } else if (toLocation === 'hand') {
                    let hand = gameStateService.getHand();
                    if (!hand.some(c => c.id === card.id) && hand.length < 5 && gameStateService.getTotalPlayableCards() < 30) {
                        hand.push(card);
                        gameStateService.saveGameData();
                        collection.splice(idx, 1);
                        cardService.saveCollection();
                    } else {
                        // Limite main ou globale atteinte, on ne retire pas la carte de la collection
                        return;
                    }
                }
            }
            document.dispatchEvent(new CustomEvent('cardMoved', {
                detail: { fromLocation, toLocation, cardIndex, cardData: card }
            }));
            return;
        }
        if ((fromLocation === 'hand' || fromLocation === 'deck') && toLocation === 'collection') {
            // Retirer de la main/pioche, ajouter à la collection
            const cardService = window.cardService;
            const gameStateService = window.gameStateService;
            const card = this.draggedCard;
            if (!cardService || !gameStateService) return;
            // Ajouter à la collection (autoriser plusieurs cartes avec le même nom mais id différent)
            let collection = cardService.getCollection();
            collection.push(card);
            cardService.saveCollection();
            // Log temporaire pour debug
            if (typeof window !== 'undefined') {
                window._debug_collection = collection;
                if (window._debug_collection) {
                    console.log('Collection après drop vers collection:', window._debug_collection.map(c => c.name));
                }
            }
            // Retirer de la main/pioche
            if (fromLocation === 'hand') {
                let hand = gameStateService.getHand();
                const idx = hand.findIndex(c => c.id === card.id);
                if (idx !== -1) {
                    hand.splice(idx, 1);
                    gameStateService.saveGameData();
                }
            } else if (fromLocation === 'deck') {
                let deck = gameStateService.getDeck();
                const idx = deck.findIndex(c => c.id === card.id);
                if (idx !== -1) {
                    deck.splice(idx, 1);
                    gameStateService.saveGameData();
                }
            }
            // Toujours déclencher cardMoved pour forcer le re-render (badge)
            document.dispatchEvent(new CustomEvent('cardMoved', {
                detail: { fromLocation, toLocation, cardIndex, cardData: card }
            }));
            return;
        }
        // Émettre un événement personnalisé pour notifier l'application
        const moveEvent = new CustomEvent('cardMoved', {
            detail: {
                fromLocation,
                toLocation,
                cardIndex,
                cardData: this.draggedCard
            }
        });
        document.dispatchEvent(moveEvent);
    }

    // Mettre à jour les zones de drop (appelé quand l'interface change)
    updateDropZones() {
        this.setupDropZones();
    }

    // Nettoyer le service
    cleanup() {
        this.dropZones.clear();
        this.draggedCard = null;
        this.draggedElement = null;
        this.isDragging = false;
        this.zoneListeners.clear(); // Nettoyer les listeners
    }
}

// Exporter une instance unique du service
export const dragDropService = new DragDropService(); 