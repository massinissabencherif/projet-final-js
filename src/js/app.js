// Point d'entrée principal de l'application Pokémon TCG
import { apiService } from './apiService.js';
import { storageService } from './storageService.js';
import { dragDropService } from './dragDropService.js';

console.log('Application Pokémon TCG initialisée');

// État global de l'application
const appState = {
    deck: [], // Cartes en pioche
    hand: [], // Cartes en main
    lastDrawTime: null, // Timestamp du dernier tirage
    drawCooldown: 5 * 60 * 1000, // 5 minutes en millisecondes
    playerName: 'Dresseur',
    totalCardsDrawn: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    selectedBattleCard: null, // Indice de la carte sélectionnée pour le combat
    battlePlayerCard: null, // Carte actuellement en jeu pour le combat du joueur
    opponentHand: [], // Cartes en main de l'IA
    opponentBattleCard: null, // Carte actuellement en jeu pour le combat de l'IA
    draws: 0 // Nouvelle propriété pour les égalités
};

// Initialisation de l'application
async function initApp() {
    console.log('Initialisation de l\'application...');
    
    // Vérifier la connectivité de l'API
    await checkApiConnection();
    
    // Charger les données sauvegardées
    loadGameData();
    
    // Initialiser le service de drag & drop
    dragDropService.init();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Démarrer le timer
    startDrawTimer();
    
    // Écouter les événements de déplacement de cartes
    setupCardMoveListener();
    
    console.log('Application initialisée avec succès');
}

// Vérifier la connectivité de l'API
async function checkApiConnection() {
    try {
        const isConnected = await apiService.testConnection();
        if (isConnected) {
            console.log('✅ Connexion à l\'API Pokémon TCG établie');
        } else {
            console.warn('⚠️ Problème de connexion à l\'API, utilisation du mode hors ligne');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'API:', error);
    }
}

// Charger les données de jeu depuis le LocalStorage
function loadGameData() {
    try {
        const data = storageService.loadGameData();
        
        // Mettre à jour l'état global avec les données chargées
        appState.deck = data.deck || [];
        appState.hand = data.hand || [];
        appState.lastDrawTime = data.lastDrawTime || null;
        appState.playerName = data.playerName || 'Dresseur';
        appState.totalCardsDrawn = data.totalCardsDrawn || 0;
        appState.gamesPlayed = data.gamesPlayed || 0;
        appState.wins = data.wins || 0;
        appState.losses = data.losses || 0;
        appState.draws = data.draws || 0; // Charger les égalités
        
        // Restauration de l'état du combat
        appState.battlePlayerCard = data.battlePlayerCard || null;
        appState.opponentHand = data.opponentHand || [];
        appState.opponentBattleCard = data.opponentBattleCard || null;
        appState.selectedBattleCard = data.selectedBattleCard || null;
        console.log('✅ Données chargées depuis le LocalStorage');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.log('Démarrage avec un état vide');
    }
}

// Sauvegarder les données de jeu dans le LocalStorage
function saveGameData() {
    try {
        const data = {
            deck: appState.deck,
            hand: appState.hand,
            lastDrawTime: appState.lastDrawTime,
            playerName: appState.playerName,
            totalCardsDrawn: appState.totalCardsDrawn,
            gamesPlayed: appState.gamesPlayed,
            wins: appState.wins,
            losses: appState.losses,
            draws: appState.draws, // Sauvegarder les égalités
            // Sauvegarde de l'état du combat
            battlePlayerCard: appState.battlePlayerCard,
            opponentHand: appState.opponentHand,
            opponentBattleCard: appState.opponentBattleCard,
            selectedBattleCard: appState.selectedBattleCard
        };
        
        const success = storageService.saveGameData(data);
        if (success) {
            console.log('✅ Données sauvegardées dans le LocalStorage');
        } else {
            console.error('❌ Échec de la sauvegarde des données');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des données:', error);
    }
}

// Mettre à jour l'interface utilisateur
function updateUI() {
    // Mettre à jour les compteurs
    document.getElementById('hand-count').textContent = appState.hand.length;
    document.getElementById('deck-count').textContent = appState.deck.length;
    
    // Mettre à jour l'état du bouton de tirage
    updateDrawButton();
    
    // Afficher les cartes
    displayCards();
    
    // Mettre à jour les zones de drop
    dragDropService.updateDropZones();
    
    console.log('Interface utilisateur mise à jour');
}

// Afficher les cartes dans l'interface
function displayCards() {
    const deckContainer = document.getElementById('deck-container');
    const handContainer = document.getElementById('hand-container');
    
    // Vider les conteneurs
    deckContainer.innerHTML = '';
    handContainer.innerHTML = '';
    
    console.log('Affichage des cartes:');
    console.log('Pioche:', appState.deck.map((c, i) => `${i}: ${c.name}`));
    console.log('Main:', appState.hand.map((c, i) => `${i}: ${c.name}`));
    
    // Afficher les cartes de la pioche
    appState.deck.forEach((card, index) => {
        const cardElement = createCardElement(card, 'deck', index);
        deckContainer.appendChild(cardElement);
    });
    
    // Afficher les cartes de la main
    appState.hand.forEach((card, index) => {
        const cardElement = createCardElement(card, 'hand', index);
        handContainer.appendChild(cardElement);
    });
}

// Créer un élément de carte
function createCardElement(card, location, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;
    cardDiv.dataset.location = location;
    cardDiv.dataset.index = index;
    
    // Définir la couleur selon le type
    const typeColor = getTypeColor(card.type);
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
    cardDiv.addEventListener('click', () => showCardDetails(card));
    
    return cardDiv;
}

// Obtenir la couleur selon le type de Pokémon
function getTypeColor(type) {
    const typeColors = {
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
    
    return typeColors[type] || '#f8f9fa';
}

// Afficher les détails d'une carte
function showCardDetails(card) {
    const modal = document.getElementById('card-modal');
    const cardDetails = document.getElementById('card-details');
    
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

// Mettre à jour l'état du bouton de tirage
function updateDrawButton() {
    const drawButton = document.getElementById('draw-button');
    const canDraw = canDrawCards();
    
    drawButton.disabled = !canDraw;
    
    if (canDraw) {
        drawButton.textContent = 'Tirer 5 cartes';
    } else {
        drawButton.textContent = 'Tirage en cours...';
    }
}

// Vérifier si on peut tirer des cartes
function canDrawCards() {
    if (!appState.lastDrawTime) return true;
    
    const now = Date.now();
    const timeSinceLastDraw = now - appState.lastDrawTime;
    
    return timeSinceLastDraw >= appState.drawCooldown;
}

// Démarrer le timer de tirage
function startDrawTimer() {
    setInterval(() => {
        updateDrawTimer();
        updateDrawButton();
    }, 1000); // Mise à jour toutes les secondes
}

// Mettre à jour l'affichage du timer
function updateDrawTimer() {
    const timerDisplay = document.getElementById('timer-display');
    
    if (!appState.lastDrawTime) {
        timerDisplay.textContent = '5:00';
        return;
    }
    
    const now = Date.now();
    const timeSinceLastDraw = now - appState.lastDrawTime;
    const timeRemaining = Math.max(0, appState.drawCooldown - timeSinceLastDraw);
    
    if (timeRemaining <= 0) {
        timerDisplay.textContent = '5:00';
        return;
    }
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Gestionnaire d'événement pour le bouton de tirage
async function handleDrawButtonClick() {
    console.log('Tentative de tirage de cartes...');
    
    if (!canDrawCards()) {
        console.log('Tirage impossible : cooldown actif');
        return;
    }
    
    // Désactiver le bouton pendant le tirage
    const drawButton = document.getElementById('draw-button');
    drawButton.disabled = true;
    drawButton.textContent = 'Tirage en cours...';
    drawButton.classList.add('loading');
    
    try {
        // Récupérer 5 cartes depuis l'API
        console.log('Récupération de 5 cartes depuis l\'API...');
        const newCards = await apiService.getRandomCards(5);
        
        // Ajouter les cartes à la pioche
        appState.deck.push(...newCards);
        appState.lastDrawTime = Date.now();
        appState.totalCardsDrawn += newCards.length;
        
        console.log(`✅ ${newCards.length} cartes ajoutées à la pioche`);
        
        // Sauvegarder et mettre à jour l'interface
        saveGameData();
        updateUI();
        
        // Réactiver le bouton
        drawButton.classList.remove('loading');
        showNotification(`✅ ${newCards.length} cartes ajoutées à votre pioche !`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors du tirage de cartes:', error);
        
        // En cas d'erreur, utiliser des cartes factices
        console.log('Utilisation de cartes factices en mode hors ligne...');
        for (let i = 0; i < 5; i++) {
            appState.deck.push({
                id: `offline-card-${Date.now()}-${i}`,
                name: `Pokémon ${i + 1}`,
                type: 'Normal',
                hp: Math.floor(Math.random() * 100) + 50,
                imageUrl: null
            });
        }
        appState.lastDrawTime = Date.now();
        appState.totalCardsDrawn += 5;
        
        saveGameData();
        updateUI();
        
        // Réactiver le bouton
        drawButton.classList.remove('loading');
        showNotification(`⚠️ Mode hors ligne : ${5} cartes factices ajoutées`, 'warning');
    }
}

// Initialiser les événements
function initEvents() {
    const drawButton = document.getElementById('draw-button');
    drawButton.addEventListener('click', handleDrawButtonClick);
    
    // Gestion de la modal
    const modal = document.getElementById('card-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Fermer la modal en cliquant à l'extérieur
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Afficher les instructions de drag & drop au premier chargement
    if (!localStorage.getItem('dragDropInstructionsShown')) {
        setTimeout(() => {
            showNotification('💡 Astuce : Glissez-déposez les cartes entre la pioche et la main !', 'info');
            localStorage.setItem('dragDropInstructionsShown', 'true');
        }, 2000);
    }

    // Gestion du bouton de combat
    const startBattleBtn = document.getElementById('start-battle-btn');
    const battleSection = document.getElementById('battle-section');
    const gameArea = document.querySelector('.game-area');
    startBattleBtn.addEventListener('click', () => {
        showBattleSection();
    });
    
    console.log('Événements initialisés');
}

// Système de notifications
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ajout d'aria-live sur les notifications
    notification.setAttribute('aria-live', 'polite');
    
    // Gestionnaire de fermeture
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
    
    // Auto-fermeture après 5 secondes
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Configurer l'écouteur d'événements pour les déplacements de cartes
function setupCardMoveListener() {
    document.addEventListener('cardMoved', (event) => {
        const { fromLocation, toLocation, cardIndex, cardData } = event.detail;
        handleCardMove(fromLocation, toLocation, cardIndex, cardData);
    });
}

// Gérer le déplacement d'une carte
function handleCardMove(fromLocation, toLocation, cardIndex, cardData) {
    console.log(`Gestion du déplacement: ${fromLocation} -> ${toLocation} (index: ${cardIndex})`);
    console.log('État avant déplacement:', {
        deck: appState.deck.length,
        hand: appState.hand.length,
        cardToMove: cardData.name
    });

    try {
        // Trouver la carte à partir de son ID dans le tableau source
        const sourceArray = fromLocation === 'deck' ? appState.deck : appState.hand;
        const cardIdx = sourceArray.findIndex(c => c.id === cardData.id);
        if (cardIdx === -1) {
            console.error('Carte non trouvée dans la source');
            return;
        }
        const removedCard = sourceArray.splice(cardIdx, 1)[0];

        console.log(`Carte retirée de ${fromLocation}:`, removedCard.name);

        // Gestion de la main avec limite de 5 cartes
        if (toLocation === 'hand') {
            if (appState.hand.length < 5) {
                // Ajout direct si la main n'est pas pleine
                appState.hand.push(removedCard);
                console.log(`Carte ajoutée à la main: ${removedCard.name}`);
            } else {
                // Si la main est pleine, rotation : la première carte va à la pioche
                const rotatedCard = appState.hand.shift();
                appState.deck.push(rotatedCard);
                appState.hand.push(removedCard);
                showNotification(`🔄 ${rotatedCard.name} envoyé à la fin de la pioche (main pleine)`, 'info');
                console.log(`Rotation appliquée: ${rotatedCard.name} de la main vers la pioche, ${removedCard.name} ajoutée à la main`);
            }
        } else {
            // Déplacement vers la pioche (pas de limite)
            appState.deck.push(removedCard);
            console.log(`Carte ajoutée à la pioche: ${removedCard.name}`);
        }

        console.log('État après déplacement:', {
            deck: appState.deck.length,
            hand: appState.hand.length
        });

        // Sauvegarder et mettre à jour l'interface
        saveGameData();
        updateUI();

        // Notification de succès
        showNotification(`✅ ${cardData.name} déplacé vers la ${toLocation === 'hand' ? 'main' : 'pioche'}`, 'success');

        console.log(`Carte déplacée avec succès: ${cardData.name}`);

    } catch (error) {
        console.error('Erreur lors du déplacement de la carte:', error);
        showNotification('❌ Erreur lors du déplacement de la carte', 'error');
    }
}

// Appliquer la rotation automatique de la main
function applyHandRotation() {
    console.log('Application de la rotation automatique de la main');
    console.log('Main avant rotation:', appState.hand.map(c => c.name));
    
    if (appState.hand.length > 1) {
        // Prendre la première carte de la main
        const firstCard = appState.hand.shift();
        
        // La placer à la fin de la pioche
        appState.deck.push(firstCard);
        
        console.log(`Rotation: ${firstCard.name} de la main vers la fin de la pioche`);
        console.log('Main après rotation:', appState.hand.map(c => c.name));
        showNotification(`🔄 ${firstCard.name} envoyé à la fin de la pioche`, 'info');
        
        return firstCard;
    }
    
    return null;
}

// Afficher les cartes de la main dans la zone de combat et gérer la sélection
function showBattlePlayerCards() {
    const playerBattleCards = document.getElementById('player-battle-cards');
    playerBattleCards.innerHTML = '';
    
    appState.hand.forEach((card, index) => {
        const cardDiv = createCardElement(card, 'battle', index);
        cardDiv.classList.add('battle-card');
        cardDiv.addEventListener('click', () => selectBattleCard(index));
        playerBattleCards.appendChild(cardDiv);
    });
}

// Gérer la sélection d'une carte pour le combat
function selectBattleCard(index) {
    appState.selectedBattleCard = index;
    // Mettre à jour l'affichage pour montrer la sélection
    const playerBattleCards = document.getElementById('player-battle-cards');
    Array.from(playerBattleCards.children).forEach((el, i) => {
        if (i === index) {
            el.classList.add('selected-battle-card');
        } else {
            el.classList.remove('selected-battle-card');
        }
    });
}

// Initialiser la main de l'IA pour le combat
function initOpponentHand() {
    // Prendre 3 à 5 cartes aléatoires de la pioche du joueur (ou d'un deck IA)
    const nbCards = Math.min(5, appState.deck.length);
    const shuffled = [...appState.deck].sort(() => Math.random() - 0.5);
    appState.opponentHand = shuffled.slice(0, nbCards);
    appState.opponentBattleCard = null;
    saveGameData();
}

// L'IA choisit une carte aléatoire de sa main pour le combat
function opponentChooseBattleCard() {
    if (!appState.opponentHand || appState.opponentHand.length === 0) {
        appState.opponentBattleCard = null;
        saveGameData();
        return;
    }
    const idx = Math.floor(Math.random() * appState.opponentHand.length);
    appState.opponentBattleCard = appState.opponentHand[idx];
    saveGameData();
}

// Afficher la zone de combat adverse
function showOpponentBattleCard() {
    const opponentCombat = document.getElementById('battle-opponent-combat');
    opponentCombat.innerHTML = '';
    if (appState.opponentBattleCard) {
        const cardDiv = createCardElement(appState.opponentBattleCard, 'battle-opponent-combat', 0);
        cardDiv.classList.add('battle-card');
        opponentCombat.appendChild(cardDiv);
    }
}

// Afficher la main de l'adversaire (IA) dans la section de combat
function showOpponentHand() {
    const opponentHandContainer = document.getElementById('battle-opponent-hand-container');
    opponentHandContainer.innerHTML = '';
    if (appState.opponentHand && appState.opponentHand.length > 0) {
        appState.opponentHand.forEach((card, index) => {
            const cardDiv = createCardElement(card, 'battle-opponent-hand', index);
            cardDiv.classList.add('battle-card');
            // Mettre en évidence la carte sélectionnée pour le combat
            if (appState.opponentBattleCard && card.id === appState.opponentBattleCard.id) {
                cardDiv.classList.add('selected-battle-card');
            }
            opponentHandContainer.appendChild(cardDiv);
        });
    }
}

// Afficher les cartes de la pioche et de la main dans la section de combat
function showBattleDeckAndHand() {
    const battleDeckContainer = document.getElementById('battle-deck-container');
    const battleHandContainer = document.getElementById('battle-hand-container');
    battleDeckContainer.innerHTML = '';
    battleHandContainer.innerHTML = '';

    // Afficher les cartes de la pioche
    appState.deck.forEach((card, index) => {
        const cardDiv = createCardElement(card, 'battle-deck', index);
        cardDiv.classList.add('battle-card');
        // Drag & drop Pioche → Main
        cardDiv.draggable = true;
        cardDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                cardId: card.id,
                from: 'deck',
                index: index
            }));
        });
        battleDeckContainer.appendChild(cardDiv);
    });

    // Afficher les cartes de la main
    appState.hand.forEach((card, index) => {
        const cardDiv = createCardElement(card, 'battle-hand', index);
        cardDiv.classList.add('battle-card');
        // Drag & drop Main → Pioche
        cardDiv.draggable = true;
        cardDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                cardId: card.id,
                from: 'hand',
                index: index
            }));
        });
        battleHandContainer.appendChild(cardDiv);
    });

    // Permettre le drop sur la main
    battleHandContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    battleHandContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.from === 'deck') {
                moveCardFromDeckToHand(data.cardId);
            }
        } catch (err) {
            console.error('Erreur lors du drop Pioche → Main', err);
        }
    });

    // Permettre le drop sur la pioche (depuis la main)
    battleDeckContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    battleDeckContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.from === 'hand') {
                moveCardFromHandToDeck(data.cardId);
            }
        } catch (err) {
            console.error('Erreur lors du drop Main → Pioche', err);
        }
    });

    // Afficher la zone de combat du joueur
    const battlePlayerCombat = document.getElementById('battle-player-combat');
    battlePlayerCombat.innerHTML = '';
    if (appState.battlePlayerCard) {
        const cardDiv = createCardElement(appState.battlePlayerCard, 'battle-player-combat', 0);
        cardDiv.classList.add('battle-card');
        // Permettre de retirer la carte (optionnel)
        cardDiv.draggable = true;
        cardDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                cardId: appState.battlePlayerCard.id,
                from: 'battle-combat',
                index: 0
            }));
        });
        battlePlayerCombat.appendChild(cardDiv);
    }

    // Permettre le drop sur la zone de combat du joueur
    battlePlayerCombat.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    battlePlayerCombat.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.from === 'hand') {
                moveCardFromHandToBattleCombat(data.cardId);
            } else if (data.from === 'battle-combat') {
                // Permettre de remettre la carte dans la main
                moveCardFromBattleCombatToHand();
            }
        } catch (err) {
            console.error('Erreur lors du drop Main → Zone de combat', err);
        }
    });

    // Permettre le drop sur la main (depuis la zone de combat)
    battleHandContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    battleHandContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.from === 'deck') {
                moveCardFromDeckToHand(data.cardId);
            } else if (data.from === 'battle-combat') {
                moveCardFromBattleCombatToHand();
            }
        } catch (err) {
            console.error('Erreur lors du drop Pioche/Zone de combat → Main', err);
        }
    });

    // Afficher la zone de combat adverse
    showOpponentBattleCard();
    // Afficher la main de l'adversaire
    showOpponentHand();
    // Afficher le bouton de combat si les deux zones sont remplies
    const controls = document.getElementById('battle-controls');
    if (appState.battlePlayerCard && appState.opponentBattleCard) {
        controls.innerHTML = `<button id="battle-launch-btn" class="battle-button">Lancer le combat</button>`;
        document.getElementById('battle-launch-btn').onclick = handleBattle;
    } else {
        controls.innerHTML = '';
    }
    // Ajouter tabindex sur les zones de drop lors de l'affichage combat
    battleDeckContainer.setAttribute('tabindex', '0');
    battleHandContainer.setAttribute('tabindex', '0');
    const battlePlayerCombatZone = document.getElementById('battle-player-combat');
    battlePlayerCombatZone.setAttribute('tabindex', '0');
    const opponentHandContainer = document.getElementById('battle-opponent-hand-container');
    if(opponentHandContainer) opponentHandContainer.setAttribute('tabindex', '0');
    const opponentCombat = document.getElementById('battle-opponent-combat');
    if(opponentCombat) opponentCombat.setAttribute('tabindex', '0');
}

// Déplacer une carte de la pioche vers la main (en respectant la limite de 5)
function moveCardFromDeckToHand(cardId) {
    const cardIdx = appState.deck.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    if (appState.hand.length >= 5) {
        showNotification('La main est pleine (5 cartes max)', 'warning');
        return;
    }
    const card = appState.deck.splice(cardIdx, 1)[0];
    appState.hand.push(card);
    saveGameData();
    showBattleDeckAndHand();
}

// Déplacer une carte de la main vers la pioche
function moveCardFromHandToDeck(cardId) {
    const cardIdx = appState.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    const card = appState.hand.splice(cardIdx, 1)[0];
    appState.deck.push(card);
    saveGameData();
    showBattleDeckAndHand();
}

// Déplacer une carte de la main vers la zone de combat du joueur
function moveCardFromHandToBattleCombat(cardId) {
    // Si une carte est déjà présente, la remettre dans la main
    if (appState.battlePlayerCard) {
        appState.hand.push(appState.battlePlayerCard);
    }
    const cardIdx = appState.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    appState.battlePlayerCard = appState.hand.splice(cardIdx, 1)[0];
    // S'assurer que la main de l'IA existe et choisir une carte
    if (!appState.opponentHand || appState.opponentHand.length === 0) {
        initOpponentHand();
    }
    opponentChooseBattleCard();
    saveGameData();
    showBattleDeckAndHand();
}
// Remettre la carte de la zone de combat dans la main
function moveCardFromBattleCombatToHand() {
    if (appState.battlePlayerCard) {
        appState.hand.push(appState.battlePlayerCard);
        appState.battlePlayerCard = null;
        saveGameData();
        showBattleDeckAndHand();
    }
}

// Lancer le combat : comparer les cartes et afficher le résultat
function handleBattle() {
    const playerCard = appState.battlePlayerCard;
    const opponentCard = appState.opponentBattleCard;
    if (!playerCard || !opponentCard) {
        showNotification('Il faut une carte dans chaque zone de combat !', 'warning');
        return;
    }
    // Règles simples : attaque > défense, égalité si égalité, sinon PV
    let result = '';
    let playerScore = (parseInt(playerCard.attack) || 0) + (parseInt(playerCard.hp) || 0);
    let opponentScore = (parseInt(opponentCard.attack) || 0) + (parseInt(opponentCard.hp) || 0);
    if (playerScore > opponentScore) {
        result = 'victoire';
        appState.wins = (appState.wins || 0) + 1;
    } else if (playerScore < opponentScore) {
        result = 'défaite';
        appState.losses = (appState.losses || 0) + 1;
    } else {
        result = 'égalité';
    }
    // Afficher le résultat
    showBattleResult(result, playerCard, opponentCard, playerScore, opponentScore);
    saveGameData();
}

// === Gestion des scores et commentaires combat ===

function updateBattleScores() {
    const playerScore = appState.wins || 0;
    const iaScore = appState.losses || 0;
    const drawScore = appState.draws || 0;
    const elPlayer = document.getElementById('score-player');
    const elIa = document.getElementById('score-ia');
    const elDraw = document.getElementById('score-draw');
    if (elPlayer) elPlayer.textContent = playerScore;
    if (elIa) elIa.textContent = iaScore;
    if (elDraw) elDraw.textContent = drawScore;
}

// Gestion des commentaires (localStorage)
function getBattleComments() {
    return JSON.parse(localStorage.getItem('battleComments') || '[]');
}
function saveBattleComment(comment) {
    const comments = getBattleComments();
    comments.unshift({ text: comment, date: new Date().toISOString() });
    localStorage.setItem('battleComments', JSON.stringify(comments.slice(0, 20)));
}
function renderBattleComments() {
    const list = document.getElementById('battle-comments-list');
    if (!list) return;
    const comments = getBattleComments();
    list.innerHTML = comments.length === 0 ? '<div style="color:#888;font-style:italic;">Aucun commentaire pour l’instant.</div>' :
        comments.map(c => `<div class="battle-comment-item"><span>${c.text}</span></div>`).join('');
}

// Afficher la zone de commentaires après un combat ou à l'ouverture de la section de combat
function showBattleCommentsSection(forceShow = false) {
    const section = document.getElementById('battle-comments-section');
    if (!section) return;
    // Afficher si on force OU s'il y a déjà des commentaires
    const comments = getBattleComments();
    if (forceShow || comments.length > 0) {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
    renderBattleComments();
    // Focus sur l'input
    const input = document.getElementById('battle-comment-input');
    if (input) input.value = '';
}
function hideBattleCommentsSection() {
    const section = document.getElementById('battle-comments-section');
    if (section) section.style.display = 'none';
}

// Gestion du formulaire de commentaire
function setupBattleCommentForm() {
    const form = document.getElementById('battle-comment-form');
    if (!form) return;
    form.onsubmit = function(e) {
        e.preventDefault();
        const input = document.getElementById('battle-comment-input');
        if (input && input.value.trim().length > 0) {
            saveBattleComment(input.value.trim());
            renderBattleComments();
            input.value = '';
        }
    };
}

// Sauvegarde de l'état avant le combat
let preBattleDeck = null;
let preBattleHand = null;
let inBattle = false;

// Gestion de la persistance de l'état "en combat"
function setInBattleFlag(value) {
    localStorage.setItem('inBattle', value ? '1' : '0');
}
function getInBattleFlag() {
    return localStorage.getItem('inBattle') === '1';
}
function clearInBattleFlag() {
    localStorage.removeItem('inBattle');
}

// Modifier showBattleSection pour activer le flag
function showBattleSection() {
    const battleSection = document.getElementById('battle-section');
    const gameArea = document.querySelector('.game-area');
    // Sauvegarder l'état avant le combat UNIQUEMENT si on n'est pas déjà en combat
    if (!inBattle) {
        preBattleDeck = JSON.parse(JSON.stringify(appState.deck));
        preBattleHand = JSON.parse(JSON.stringify(appState.hand));
        inBattle = true;
    }
    setInBattleFlag(true); // Persister l'état en combat
    gameArea.style.display = 'none';
    battleSection.style.display = 'flex';
    initOpponentHand();
    showBattleDeckAndHand();
    updateBattleScores(); // Mettre à jour les scores au chargement de la section de combat
    // Afficher la section de commentaires si des commentaires existent
    showBattleCommentsSection();
    setupBattleCommentForm();
    // Afficher le bouton "Finir le combat"
    showFinishBattleButton();
}

// Afficher le bouton "Finir le combat" dans la section combat
function showFinishBattleButton() {
    let btn = document.getElementById('battle-finish-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'battle-finish-btn';
        btn.className = 'battle-button';
        btn.textContent = 'Finir le combat';
        btn.style.marginLeft = '0';
        btn.onclick = finishBattle;
        // On l'ajoute après le titre ou en haut de la section
        const battleSection = document.getElementById('battle-section');
        battleSection.insertBefore(btn, battleSection.children[1]);
    } else {
        btn.style.display = 'inline-block';
    }
}
function hideFinishBattleButton() {
    const btn = document.getElementById('battle-finish-btn');
    if (btn) btn.style.display = 'none';
}

// Fonction pour finir le combat et revenir à la page de tirage
function finishBattle() {
    clearInBattleFlag();
    inBattle = false;
    // Masquer la section combat, afficher la zone de tirage
    document.getElementById('battle-section').style.display = 'none';
    document.querySelector('.game-area').style.display = 'grid';
    hideBattleCommentsSection();
    hideFinishBattleButton();
    updateUI();
}

// Afficher le résultat du combat
function showBattleResult(result, playerCard, opponentCard, playerScore, opponentScore) {
    const controls = document.getElementById('battle-controls');
    let message = '';
    if (result === 'victoire') {
        message = `🎉 Victoire ! (${playerScore} vs ${opponentScore})`;
    } else if (result === 'défaite') {
        message = `😢 Défaite... (${playerScore} vs ${opponentScore})`;
    } else {
        message = `🤝 Égalité ! (${playerScore} vs ${opponentScore})`;
    }
    controls.innerHTML = `<div class="battle-result-message" aria-live="polite" tabindex="0">${message}</div>
        <button id="battle-replay-btn" class="battle-button">Rejouer</button>
        <button id="battle-exit-btn" class="battle-button">Retour</button>`;
    // Focus automatique sur le message de résultat
    const resultMsg = controls.querySelector('.battle-result-message');
    if(resultMsg) resultMsg.focus();

    // Appliquer les animations sur les cartes de combat
    // Joueur
    const playerCombatZone = document.getElementById('battle-player-combat');
    const playerCardDiv = playerCombatZone && playerCombatZone.querySelector('.battle-card');
    // Adversaire
    const opponentCombatZone = document.getElementById('battle-opponent-combat');
    const opponentCardDiv = opponentCombatZone && opponentCombatZone.querySelector('.battle-card');

    // Nettoyer d'abord les anciennes classes d'animation
    [playerCardDiv, opponentCardDiv].forEach(div => {
        if (div) {
            div.classList.remove('glow-win', 'flip-win', 'shake-lose', 'pulse-draw');
        }
    });

    // Appliquer selon le résultat
    if (result === 'victoire') {
        if (playerCardDiv) {
            playerCardDiv.classList.add('glow-win', 'flip-win');
        }
        if (opponentCardDiv) {
            opponentCardDiv.classList.add('shake-lose');
        }
    } else if (result === 'défaite') {
        if (playerCardDiv) {
            playerCardDiv.classList.add('shake-lose');
        }
        if (opponentCardDiv) {
            opponentCardDiv.classList.add('glow-win', 'flip-win');
        }
    } else {
        // égalité
        if (playerCardDiv) {
            playerCardDiv.classList.add('pulse-draw');
        }
        if (opponentCardDiv) {
            opponentCardDiv.classList.add('pulse-draw');
        }
    }

    // Nettoyer les classes d'animation après la durée (pour permettre de rejouer)
    setTimeout(() => {
        [playerCardDiv, opponentCardDiv].forEach(div => {
            if (div) {
                div.classList.remove('glow-win', 'flip-win', 'shake-lose', 'pulse-draw');
            }
        });
    }, 1300);

    // Mise à jour des scores (égalité prise en compte)
    if (result === 'égalité') {
        appState.draws = (appState.draws || 0) + 1;
    }
    updateBattleScores();
    // Afficher la zone de commentaires
    showBattleCommentsSection();
    setupBattleCommentForm();

    document.getElementById('battle-replay-btn').onclick = () => {
        // Réinitialiser les zones de combat et relancer l'IA
        appState.battlePlayerCard = null;
        appState.opponentBattleCard = null;
        initOpponentHand();
        showBattleDeckAndHand();
        controls.innerHTML = '';
        hideBattleCommentsSection();
        saveGameData();
        // On reste en combat, donc on ne touche pas au flag
    };
    document.getElementById('battle-exit-btn').onclick = () => {
        // Restaurer la main et la pioche d'avant combat
        if (preBattleDeck && preBattleHand) {
            appState.deck = JSON.parse(JSON.stringify(preBattleDeck));
            appState.hand = JSON.parse(JSON.stringify(preBattleHand));
            appState.battlePlayerCard = null;
            appState.opponentBattleCard = null;
            saveGameData();
        }
        // Revenir à la gestion du deck
        document.getElementById('battle-section').style.display = 'none';
        document.querySelector('.game-area').style.display = 'grid';
        updateUI();
        inBattle = false;
        hideBattleCommentsSection();
        clearInBattleFlag();
        hideFinishBattleButton();
    };
}

// Démarrer l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, démarrage de l\'application...');
    initEvents();
    initApp();
    loadGameData();
    updateBattleScores();
    renderBattleComments();
    // Affichage correct selon l'état inBattle
    if (getInBattleFlag()) {
        inBattle = true;
        document.querySelector('.game-area').style.display = 'none';
        document.getElementById('battle-section').style.display = 'flex';
        showBattleDeckAndHand(); // Afficher les cartes dès le chargement
        updateBattleScores();
        showBattleCommentsSection(true); // Afficher la zone de commentaire systématiquement
        setupBattleCommentForm();
        showFinishBattleButton();
    } else {
        document.getElementById('battle-section').style.display = 'none';
        document.querySelector('.game-area').style.display = 'grid';
        hideFinishBattleButton();
        hideBattleCommentsSection();
    }
}); 