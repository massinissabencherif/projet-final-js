# 🎮 Pokémon TCG - Application de Gestion de Cartes

Une application web moderne pour gérer une collection de cartes Pokémon, construire des decks et combattre contre une IA.

## 🚀 Fonctionnalités Principales

### 📦 Gestion de Collection
- **Collection illimitée** : Stockage de toutes vos cartes Pokémon
- **Interface intuitive** : Affichage en grille avec images des cartes
- **Recherche et tri** : Filtrage par nom et tri alphabétique
- **Détails des cartes** : Modal avec informations complètes (HP, types, etc.)
- **Gestion des doublons** : Badges de quantité pour les cartes multiples

### 🎴 Système de Deck
- **Limite stricte** : Maximum 30 cartes combinées (deck + main)
- **Rotation automatique** : Main pleine → première carte retourne au deck
- **Drag & Drop** : Déplacement fluide entre collection, deck et main
- **Validation en temps réel** : Empêche les ajouts au-delà de la limite

### 🎯 Système de Tirage
- **Tirage automatique** : 5 cartes toutes les 5 minutes
- **Timer visuel** : Compte à rebours du prochain tirage
- **Bouton manuel** : Possibilité de tirer immédiatement
- **Gestion des erreurs** : Fallback en cas de problème API

### 🎁 Système de Booster
- **Booster de 5 cartes** : Ajout automatique à la collection
- **Timer de 3 minutes** : Cooldown entre les boosters
- **Persistance** : Sauvegarde du timer même après fermeture
- **Interface responsive** : Bouton désactivé pendant le cooldown

### ⚔️ Système de Combat
- **Combat contre IA** : Système de tour par tour
- **Zones de jeu** : Deck, main, défausse, Pokémon actif
- **Mécanique de combat** : Comparaison des HP des Pokémon
- **Système de score** : Victoires, défaites, égalités
- **Fin automatique** : Combat terminé à 10 victoires
- **Persistance** : État sauvegardé même après rafraîchissement

### 💬 Système de Commentaires
- **Commentaires utilisateur** : Ajout de messages personnalisés
- **Commentaires IA** : Messages automatiques après chaque round
- **Persistance** : Sauvegarde des commentaires pendant le combat
- **Nettoyage automatique** : Suppression à la fin du combat

## 🏗️ Architecture Technique

### Structure des Fichiers
```
projet-final-js/
├── index.html                 # Point d'entrée HTML
├── src/
│   ├── css/
│   │   └── styles.css         # Styles et animations
│   ├── js/
│   │   ├── app.js            # Point d'entrée JavaScript
│   │   ├── controllers/      # Contrôleurs UI
│   │   │   ├── gameController.js
│   │   │   └── battleController.js
│   │   └── services/         # Services métier
│   │       ├── apiService.js
│   │       ├── battleService.js
│   │       ├── cardService.js
│   │       ├── commentService.js
│   │       ├── dragDropService.js
│   │       ├── gameStateService.js
│   │       ├── notificationService.js
│   │       └── storageService.js
│   └── assets/
│       └── background.png    # Image d'arrière-plan
├── data/
│   └── pokemon-cards.json    # Données des cartes
└── README.md
```

### Pattern Architectural

#### 🎯 Service-Oriented Architecture
- **Services** : Logique métier centralisée
- **Contrôleurs** : Gestion des interactions UI
- **Séparation des responsabilités** : Chaque service a un rôle spécifique

#### 📊 État Global
- **gameStateService** : État du jeu (deck, main, défausse, stats)
- **battleService** : État du combat (scores, zones de combat)
- **Persistance** : Sauvegarde automatique dans localStorage

#### 🔄 Communication Inter-Modules
- **Événements personnalisés** : `cardMoved`, `refreshCollection`
- **Exposition globale** : Services accessibles via `window`
- **Callbacks** : Communication directe entre modules

## 🎮 Logique de Jeu

### 📋 Règles du Deck
1. **Limite stricte** : `deck.length + hand.length ≤ 30`
2. **Rotation de main** : Main pleine → première carte va au deck
3. **Validation** : Tous les ajouts vérifient la limite
4. **Mouvements internes** : Deck ↔ Main autorisés même à 30 cartes

### ⚔️ Mécanique de Combat
1. **Initialisation** : Vérification des cartes disponibles
2. **Tour par tour** : Joueur vs IA
3. **Résolution** : Comparaison HP des Pokémon actifs
4. **Mise à jour** : Scores et commentaires automatiques
5. **Fin** : 10 victoires ou bouton "Finir le combat"

### 🎁 Système de Booster
1. **Timer** : 3 minutes entre chaque booster
2. **API** : Récupération de 5 cartes aléatoires
3. **Ajout** : Intégration automatique à la collection
4. **Persistance** : Sauvegarde du timer

## 🔧 Fonctionnalités Techniques

### 💾 Persistance des Données
- **localStorage** : Sauvegarde automatique de tous les états
- **Récupération** : Restauration automatique au chargement
- **Synchronisation** : État cohérent entre sessions

### 🎨 Interface Utilisateur
- **Design responsive** : Adaptation mobile/desktop
- **Animations fluides** : Transitions et effets visuels
- **Feedback utilisateur** : États visuels clairs
- **Accessibilité** : Focus visible, ARIA labels

### 🔄 Drag & Drop
- **Zones multiples** : Collection, deck, main, combat
- **Validation** : Empêche les mouvements invalides
- **Feedback visuel** : Indicateurs de drop zones
- **Gestion d'erreurs** : Fallback en cas d'échec

### 🌐 Gestion API
- **Mode local** : Données de cartes intégrées
- **Fallback** : Gestion des erreurs réseau
- **Cache** : Optimisation des performances
- **Validation** : Vérification des données reçues

## 🚀 Installation et Utilisation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Serveur web local (pour éviter les problèmes CORS)

### Installation
1. Cloner le repository
2. Ouvrir dans un serveur web local
3. Accéder à `index.html`

### Utilisation
1. **Collection** : Ouvrir des boosters pour obtenir des cartes
2. **Deck** : Construire un deck de maximum 30 cartes
3. **Combat** : Lancer un combat contre l'IA
4. **Persistance** : Toutes les données sont sauvegardées automatiquement

## 🎯 Fonctionnalités Avancées

### 🔒 Validation et Sécurité
- **Limites strictes** : Empêche les états invalides
- **Validation en temps réel** : Feedback immédiat
- **Gestion d'erreurs** : Fallbacks robustes

### 📱 Responsive Design
- **Mobile-first** : Interface adaptée aux petits écrans
- **Touch-friendly** : Optimisé pour les interactions tactiles
- **Performance** : Chargement rapide et animations fluides

### 🎨 Expérience Utilisateur
- **Feedback visuel** : États clairs et animations
- **Persistance** : Pas de perte de données
- **Intuitif** : Interface simple et efficace

## 🔮 Évolutions Futures

### Fonctionnalités Potentielles
- **Multi-joueur** : Combats en ligne
- **Tournois** : Système de compétition
- **Achievements** : Système de récompenses
- **Statistiques avancées** : Analyses détaillées
- **Thèmes** : Personnalisation visuelle

### Améliorations Techniques
- **PWA** : Application web progressive
- **Offline** : Fonctionnement hors ligne
- **Performance** : Optimisations avancées
- **Tests** : Couverture de tests complète

---

## 📝 Notes de Développement

### Technologies Utilisées
- **HTML5** : Structure sémantique
- **CSS3** : Styles modernes et animations
- **JavaScript ES6+** : Logique métier
- **localStorage** : Persistance des données
- **Drag & Drop API** : Interactions utilisateur

### Bonnes Pratiques
- **Code modulaire** : Architecture service-oriented
- **Séparation des responsabilités** : UI/logique séparées
- **Gestion d'erreurs** : Fallbacks robustes
- **Performance** : Optimisations de chargement
- **Maintenabilité** : Code propre et documenté

---

*Développé avec ❤️ pour les fans de Pokémon TCG*
