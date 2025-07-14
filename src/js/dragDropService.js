// Service pour gérer le drag & drop des cartes
class DragDropService {
    constructor() {
        this.draggedCard = null;
        this.draggedElement = null;
        this.dropZones = new Map();
        this.isDragging = false;
    }

    // Initialiser le service de drag & drop
    init() {
        console.log('Initialisation du service de drag & drop...');
        this.setupDropZones();
        this.setupGlobalEvents();
    }

    // Configurer les zones de drop
    setupDropZones() {
        const deckContainer = document.getElementById('deck-container');
        const handContainer = document.getElementById('hand-container');

        if (deckContainer) {
            this.setupDropZone(deckContainer, 'deck');
        }
        if (handContainer) {
            this.setupDropZone(handContainer, 'hand');
        }
    }

    // Configurer une zone de drop
    setupDropZone(container, zoneType) {
        this.dropZones.set(zoneType, container);

        // Événements pour la zone de drop
        container.addEventListener('dragover', (e) => this.handleDragOver(e, zoneType));
        container.addEventListener('drop', (e) => this.handleDrop(e, zoneType));
        container.addEventListener('dragenter', (e) => this.handleDragEnter(e, zoneType));
        container.addEventListener('dragleave', (e) => this.handleDragLeave(e, zoneType));

        console.log(`Zone de drop configurée: ${zoneType}`);
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

        console.log(`Carte configurée pour le drag: ${cardData.name} (${location})`);
    }

    // Gérer le début du drag
    handleDragStart(e, cardData, location, index) {
        console.log(`Début du drag: ${cardData.name} depuis ${location}`);
        
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
        console.log(`Drop dans la zone: ${zoneType}`);

        const container = this.dropZones.get(zoneType);
        if (container) {
            container.classList.remove('drop-zone-hover');
        }

        if (!this.isValidDrop(zoneType)) {
            console.log('Drop invalide');
            return;
        }

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log('Données de drag reçues:', dragData);
            this.moveCard(dragData.location, zoneType, dragData.index);
        } catch (error) {
            console.error('Erreur lors du drop:', error);
        }
    }

    // Gérer la fin du drag
    handleDragEnd(e) {
        console.log('Fin du drag');
        
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

        // Règles de validation
        const sourceLocation = this.draggedElement?.dataset.location;
        
        // On ne peut pas déposer dans la même zone
        if (sourceLocation === targetZone) return false;

        // On peut toujours déplacer entre pioche et main
        if ((sourceLocation === 'deck' && targetZone === 'hand') ||
            (sourceLocation === 'hand' && targetZone === 'deck')) {
            return true;
        }

        return false;
    }

    // Déplacer une carte
    moveCard(fromLocation, toLocation, cardIndex) {
        console.log(`Déplacement de carte: ${fromLocation} -> ${toLocation} (index: ${cardIndex})`);

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
    }
}

// Exporter une instance unique du service
export const dragDropService = new DragDropService(); 