Projet Web : Pokémon TCG – Interface d’échange et de tirage de cartes

Objectif
Créer une interface web interactive pour tirer, gérer, échanger et visualiser des cartes Pokémon. Le système simule une expérience proche d’un jeu de cartes à collectionner (TCG) avec des combats et des interactions entre joueurs.

Fonctionnalités principales

1. Tirage de cartes aléatoires
   - L'utilisateur peut tirer un paquet de 5 cartes Pokémon toutes les 5 minutes.
   - Chaque tirage est aléatoire.
   - Un compteur ou timer empêche les tirages trop rapprochés (intervalle de 5 min).

2. Gestion de deck
   - Chaque joueur possède :
     - Une pioche (pile de cartes disponibles)
     - Une main (cartes en cours d’utilisation)
   - Il doit être possible de :
     - Glisser-déposer (drag & drop) une carte depuis la pioche vers la main.
     - Lorsque cela se produit, la première carte de la main est envoyée à la fin de la pioche (rotation automatique).

3. Couleur dynamique selon le type de Pokémon
   - Les cartes changent de couleur en fonction du type du Pokémon (exemple : type Feu → rouge, type Eau → bleu, etc.).

4. Détail d’une carte
   - L'utilisateur peut consulter les détails d’une carte :
     - Soit via une popup (modale)
     - Soit via une page dédiée avec informations détaillées (nom, type, points de vie, attaque, etc.).

5. Combat entre dresseurs
   - Implémenter un système de combat entre deux joueurs (libre à vous de définir les règles).
   - À la fin du combat, il est possible de laisser une note ou un commentaire à l'autre joueur.

6. Persistance des données
   - Les données (deck, cartes tirées, main, pioche, etc.) doivent être persistées :
     - Rien ne doit être perdu en cas de rechargement de la page.

Technologies et notions attendues
- Utilisation des notions abordées en cours et TP :
  - DOM
  - Fetch
  - Promise
  - LocalStorage ou backend si nécessaire
- Expérience utilisateur fluide :
  - Messages d’erreur explicites
  - États de chargement visibles
  - Feedback visuel cohérent lors des interactions
