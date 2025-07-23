// Service pour gérer les boosters (packs de 5 cartes), le timer/cooldown et la persistance
import { apiService } from './apiService.js';
import { storageService } from './storageService.js';
import { cardService } from './cardService.js';

class BoosterService {
    constructor() {
        this.COOLDOWN = 5 * 60 * 1000; // 5 minutes en ms
        this.lastDrawTime = this.loadLastDrawTime();
    }

    // Vérifie si le joueur peut ouvrir un booster
    canOpenBooster() {
        if (!this.lastDrawTime) return true;
        const now = Date.now();
        return (now - this.lastDrawTime) >= this.COOLDOWN;
    }

    // Temps restant avant le prochain booster (en ms)
    getTimeLeft() {
        if (!this.lastDrawTime) return 0;
        const now = Date.now();
        const timeLeft = this.COOLDOWN - (now - this.lastDrawTime);
        return Math.max(0, timeLeft);
    }

    // Formate le temps restant en mm:ss
    formatTimeLeft() {
        const ms = this.getTimeLeft();
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Tire un booster (5 cartes aléatoires)
    async drawBooster() {
        if (!this.canOpenBooster()) {
            return null;
        }
        try {
            const cards = await apiService.getRandomCards(5);
            this.lastDrawTime = Date.now();
            this.saveLastDrawTime(this.lastDrawTime);
            return cards;
        } catch (error) {
            return null;
        }
    }

    // Ajoute les cartes tirées à la collection
    addToCollection(cards) {
        if (!cards || !Array.isArray(cards)) return;
        const added = cardService.addCardsToCollection(cards);
        if (added > 0) {
        } else {
        }
    }

    // Persistance du timer
    saveLastDrawTime(time) {
        storageService.savePartialData('boosterLastDraw', { lastDrawTime: time });
    }
    loadLastDrawTime() {
        const data = storageService.loadPartialData('boosterLastDraw', {});
        return data.lastDrawTime || null;
    }
}

export const boosterService = new BoosterService(); 