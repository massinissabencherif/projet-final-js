// Point d'entrée principal de l'application Pokémon TCG
import { apiService } from './services/apiService.js';
import { storageService } from './services/storageService.js';
import { dragDropService } from './services/dragDropService.js';
import { gameController } from './controllers/gameController.js';
import { battleController } from './controllers/battleController.js';
import { gameStateService } from './services/gameStateService.js';
import { battleService } from './services/battleService.js';
import { commentService } from './services/commentService.js';
import { boosterService } from './services/boosterService.js';
import { cardService } from './services/cardService.js';

// Préchargement de l'image de background pour un affichage immédiat
const preloadBackground = () => {
    const img = new Image();
    img.src = 'src/assets/background.png';
    
    // Forcer l'affichage du background immédiatement avec le gradient de fallback
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    img.onload = () => {
        // Une fois l'image chargée, l'appliquer comme background
        document.body.style.backgroundImage = `url('src/assets/background.png')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    };
    
    img.onerror = () => {
        // En cas d'erreur, garder le gradient de fallback
        console.warn('⚠️ Impossible de charger l\'image de background, utilisation du gradient de fallback');
    };
};

// Précharger le background immédiatement
preloadBackground();

// Suppression de logCollection

// Exposer les contrôleurs et services globalement pour l'accès cross-controller
window.gameController = gameController;
window.battleController = battleController;
window.battleService = battleService;
window.gameStateService = gameStateService;
window.cardService = cardService;
window.renderCollectionUI = renderCollectionUI;
window.commentService = commentService;

// Initialisation de l'application
async function initApp() {
    
    // Vérifier la connectivité de l'API
    await checkApiConnection();
    
    // Charger les données sauvegardées
    loadGameData();
    
    // Initialiser le service de drag & drop
    dragDropService.init();
    
    // Initialiser les contrôleurs
    gameController.init();
    battleController.init();
    
    // Mettre à jour l'interface
    gameController.updateUI();
    
    // Restaurer l'état du combat si nécessaire (après l'initialisation des contrôleurs)
    setTimeout(() => {
        restoreBattleState();
    }, 100);
    
}

// Vérifier la connectivité de l'API locale
async function checkApiConnection() {
    try {
        // Forcer l'utilisation du mode local
        apiService.setLocalMode(true);
        
        // Charger les cartes locales pour vérifier qu'elles sont disponibles
        const cards = await apiService.loadLocalCards();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des cartes locales:', error);
    }
}

// Charger les données de jeu
function loadGameData() {
    try {
        gameStateService.loadGameData();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.log('Démarrage avec un état vide');
    }
}

// Restaurer l'état du combat si nécessaire
function restoreBattleState() {
    try {
        
        // Charger l'état du combat depuis le localStorage
        battleService.loadBattleState();
        const isInBattle = battleService.isInBattle();
        
        if (isInBattle) {
            // Afficher la section de combat
            const battleSection = document.getElementById('battle-section');
            const gameArea = document.querySelector('.game-area');
            
            if (battleSection && gameArea) {
                gameArea.style.display = 'none';
                battleSection.style.display = 'flex';
                
                // Masquer la collection et désactiver le booster en mode combat
                const collectionSection = document.getElementById('collection-section');
                if (collectionSection) collectionSection.style.display = 'none';
                const boosterBtn = document.getElementById('booster-button');
                if (boosterBtn) {
                    boosterBtn.disabled = true;
                    boosterBtn.style.opacity = '0.5';
                }
                
                // Réinitialiser l'affichage du combat
                battleController.initBattle().then(() => {
                }).catch(error => {
                    console.error('Erreur lors de la restauration du combat:', error);
                });
            } else {
                console.error('Éléments DOM manquants pour la restauration du combat');
            }
        } else {
            // Afficher la zone de jeu normale
            const battleSection = document.getElementById('battle-section');
            const gameArea = document.querySelector('.game-area');
            
            if (battleSection && gameArea) {
                battleSection.style.display = 'none';
                gameArea.style.display = 'grid';
                
                // Réafficher la collection et réactiver le booster en mode normal
                const collectionSection = document.getElementById('collection-section');
                if (collectionSection) collectionSection.style.display = '';
                const boosterBtn = document.getElementById('booster-button');
                if (boosterBtn) {
                    boosterBtn.disabled = false;
                    boosterBtn.style.opacity = '1';
                }
            }
        }
        
    } catch (error) {
        console.error('Erreur lors de la restauration de l\'état du combat:', error);
        // En cas d'erreur, afficher le mode normal
        const battleSection = document.getElementById('battle-section');
        const gameArea = document.querySelector('.game-area');
        
        if (battleSection && gameArea) {
            battleSection.style.display = 'none';
            gameArea.style.display = 'grid';
            
            // Réafficher la collection et réactiver le booster en cas d'erreur
            const collectionSection = document.getElementById('collection-section');
            if (collectionSection) collectionSection.style.display = '';
            const boosterBtn = document.getElementById('booster-button');
            if (boosterBtn) {
                boosterBtn.disabled = false;
                boosterBtn.style.opacity = '1';
            }
        }
    }
}

// Gestionnaire de nettoyage avant fermeture
function cleanup() {
    gameController.cleanup();
    dragDropService.cleanup();
}

// Écouter les événements de fermeture de page
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

// Ajout du bouton booster dans l'UI
function setupBoosterButton() {
    const boosterBtn = document.getElementById('booster-button');
    if (!boosterBtn) return;

    // Met à jour l'état du bouton selon le timer
    function updateBoosterBtn() {
        if (boosterService.canOpenBooster()) {
            boosterBtn.disabled = false;
            boosterBtn.textContent = 'Ouvrir un booster (5 cartes)';
        } else {
            boosterBtn.disabled = true;
            boosterBtn.textContent = `Attendez ${boosterService.formatTimeLeft()} pour un nouveau booster`;
        }
    }

    // Action à l'ouverture d'un booster
    boosterBtn.addEventListener('click', async () => {
        if (!boosterService.canOpenBooster()) return;
        boosterBtn.disabled = true;
        boosterBtn.textContent = 'Ouverture...';
        const cards = await boosterService.drawBooster();
        if (cards) {
            // TODO: Afficher la modal d'animation d'ouverture ici
            boosterService.addToCollection(cards);
            // Mettre à jour l'UI de la collection si besoin
            if (window.gameController && typeof window.gameController.updateUI === 'function') {
                window.gameController.updateUI();
            }
            // Après l'ajout à la collection, afficher la collection dans la console
            // logCollection(); // Supprimé
            // Affiche la collection dans l'UI
            renderCollectionUI();
        }
        updateBoosterBtn();
    });

    // Mettre à jour le bouton toutes les secondes
    setInterval(updateBoosterBtn, 1000);
    updateBoosterBtn();
}

// Ajout du bouton Mélanger le deck dans l'UI
function setupShuffleDeckButton() {
    const deckZone = document.querySelector('.deck-zone');
    if (!deckZone) return;
    let shuffleBtn = document.getElementById('shuffle-deck-btn');
    if (!shuffleBtn) {
        shuffleBtn = document.createElement('button');
        shuffleBtn.id = 'shuffle-deck-btn';
        shuffleBtn.textContent = 'Mélanger le deck';
        shuffleBtn.style = 'display:block;margin:0 auto 12px auto;padding:8px 18px;font-size:15px;border-radius:8px;border:1px solid #bbb;background:#e0e0e0;cursor:pointer;font-weight:bold;';
        deckZone.insertBefore(shuffleBtn, deckZone.querySelector('h3').nextSibling);
        shuffleBtn.addEventListener('click', () => {
            window.gameStateService.shuffleDeck();
            if (window.gameController && typeof window.gameController.updateUI === 'function') window.gameController.updateUI();
        });
    }
}

// Ajout du bouton Vider le deck dans l'UI
function setupClearDeckButton() {
    const deckZone = document.querySelector('.deck-zone');
    if (!deckZone) return;
    let clearBtn = document.getElementById('clear-deck-btn');
    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.id = 'clear-deck-btn';
        clearBtn.textContent = 'Vider le deck';
        clearBtn.style = 'display:block;margin:0 auto 8px auto;padding:8px 18px;font-size:15px;border-radius:8px;border:1px solid #e57373;background:#ffcdd2;color:#b71c1c;cursor:pointer;font-weight:bold;';
        deckZone.insertBefore(clearBtn, deckZone.querySelector('h3').nextSibling);
        clearBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment vider tout le deck et la main ? Les cartes seront remises dans la collection.')) {
                const cardsToReturn = window.gameStateService.clearDeckAndHand();
                if (cardsToReturn && cardsToReturn.length > 0) {
                    const cardService = window.cardService;
                    if (cardService) {
                        for (const card of cardsToReturn) {
                            cardService.collection.push(card);
                        }
                        cardService.saveCollection();
                    }
                }
                if (window.gameController && typeof window.gameController.updateUI === 'function') window.gameController.updateUI();
                renderCollectionUI();
            }
        });
    }
}

// Ajoute le drag&drop natif sur les cartes de la main et de la pioche
function enableHandAndDeckDragDrop() {
    // Main
    const handContainer = document.getElementById('hand-container');
    if (handContainer) {
        Array.from(handContainer.children).forEach(cardDiv => {
            cardDiv.draggable = true;
            cardDiv.addEventListener('dragstart', (e) => {
                const cardId = cardDiv.getAttribute('data-card-id');
                const hand = window.gameStateService.getHand();
                const card = hand.find(c => c.id == cardId);
                if (card) {
                    e.dataTransfer.setData('application/json', JSON.stringify(card));
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
        });
    }
    // Pioche
    const deckContainer = document.getElementById('deck-container');
    if (deckContainer) {
        Array.from(deckContainer.children).forEach(cardDiv => {
            cardDiv.draggable = true;
            cardDiv.addEventListener('dragstart', (e) => {
                const cardId = cardDiv.getAttribute('data-card-id');
                const deck = window.gameStateService.getDeck();
                const card = deck.find(c => c.id == cardId);
                if (card) {
                    e.dataTransfer.setData('application/json', JSON.stringify(card));
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
        });
    }
}

// Démarrer l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupBoosterButton();
    setupClearDeckButton();
    
    // Appeler renderCollectionUI au chargement initial
    renderCollectionUI();
    // Appeler enableHandAndDeckDragDrop après chaque updateUI
    if (window.gameController && typeof window.gameController.updateUI === 'function') {
        const originalUpdateUI = window.gameController.updateUI;
        window.gameController.updateUI = function() {
            originalUpdateUI.apply(this, arguments);
            enableHandAndDeckDragDrop();
        };
    }
    // Appeler enableHandAndDeckDragDrop au chargement initial
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enableHandAndDeckDragDrop();
    } else {
        document.addEventListener('DOMContentLoaded', enableHandAndDeckDragDrop);
    }
}); 

// Affiche la collection dans l'UI
function renderCollectionUI() {
    const grid = document.getElementById('collection-grid');
    const count = document.getElementById('collection-count');
    if (!grid || !count) return;
    // Ajout ou récupération de la barre de recherche
    let searchBar = document.getElementById('collection-search-bar');
    if (!searchBar) {
        searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.id = 'collection-search-bar';
        searchBar.placeholder = 'Rechercher une carte...';
        searchBar.style = 'display:block;margin:0 auto 8px auto;padding:8px;width:220px;border-radius:6px;border:1px solid #ccc;';
        grid.parentElement.insertBefore(searchBar, grid);
        searchBar.addEventListener('input', () => renderCollectionUI());
    }
    // Ajout ou récupération du menu de tri
    let sortMenu = document.getElementById('collection-sort-menu');
    if (!sortMenu) {
        sortMenu = document.createElement('select');
        sortMenu.id = 'collection-sort-menu';
        sortMenu.style = 'display:block;margin:0 auto 16px auto;padding:6px;width:160px;border-radius:6px;border:1px solid #ccc;';
        sortMenu.innerHTML = `
            <option value="az">Trier A → Z</option>
            <option value="za">Trier Z → A</option>
        `;
        grid.parentElement.insertBefore(sortMenu, grid);
        sortMenu.addEventListener('change', () => renderCollectionUI());
    }
    const searchValue = searchBar.value.trim().toLowerCase();
    const sortValue = sortMenu.value;
    const collection = cardService.getCollection();
    grid.innerHTML = '';
    grid.classList.remove('empty-collection-bg');
    let filtered = collection;
    if (searchValue) {
        filtered = collection.filter(card => card.name.toLowerCase().includes(searchValue));
    }
    // Tri alphabétique
    filtered = filtered.slice(); // clone
    filtered.sort((a, b) => {
        if (sortValue === 'az') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });
    // Calcul des quantités par nom
    const nameCount = {};
    for (const card of collection) {
        nameCount[card.name] = (nameCount[card.name] || 0) + 1;
    }
    if (filtered.length === 0) {
        grid.classList.add('empty-collection-bg');
        count.textContent = '';
    } else {
        const unique = new Set(filtered.map(c => c.id)).size;
        count.textContent = `${filtered.length} cartes (${unique} uniques)`;
        filtered.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'collection-card';
            cardDiv.style = 'border:1px solid #ccc;border-radius:8px;padding:8px;width:110px;background:#fff;box-shadow:0 2px 6px #0001;text-align:center;cursor:pointer;position:relative;';
            if (card.imageUrl) {
                cardDiv.innerHTML = `<img src="${card.imageUrl}" alt="${card.name}" style="width:90px;height:120px;object-fit:cover;border-radius:6px;">`;
            } else {
                cardDiv.innerHTML = `<div style='width:90px;height:120px;display:flex;align-items:center;justify-content:center;background:#eee;border-radius:6px;color:#aaa;font-size:12px;'>Pas d'image</div>`;
            }
            cardDiv.innerHTML += `<div style='margin-top:6px;font-weight:bold;'>${card.name}</div><div style='font-size:12px;color:#666;'>${card.type || (card.types ? card.types.join(', ') : '')}</div>`;
            // Badge de quantité si doublon
            if (nameCount[card.name] > 1) {
                const badge = document.createElement('div');
                badge.textContent = `x${nameCount[card.name]}`;
                badge.style = 'position:absolute;top:4px;right:8px;background:#ffb703;color:#222;font-weight:bold;padding:2px 7px;border-radius:12px;font-size:13px;box-shadow:0 1px 4px #0002;z-index:2;';
                cardDiv.appendChild(badge);
            }
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                cardService.showCardDetails(card);
            });
            dragDropService.setupCardDrag(cardDiv, card, 'collection', index);
            grid.appendChild(cardDiv);
        });
    }
    // Plus de code natif de drag&drop ici
} 

// Met à jour l'UI après chaque mouvement de carte (drag&drop global)
document.addEventListener('cardMoved', () => {
    if (typeof renderCollectionUI === 'function') renderCollectionUI();
    if (window.gameController && typeof window.gameController.updateUI === 'function') window.gameController.updateUI();
}); 

// Écouter l'événement de rafraîchissement de la collection
document.addEventListener('refreshCollection', () => {
    console.log('📡 Événement refreshCollection reçu, rafraîchissement de la collection');
    if (typeof renderCollectionUI === 'function') {
        renderCollectionUI();
    }
}); 