// Service pour gérer les commentaires de combat
class CommentService {
    constructor() {
        this.storageKey = 'battleComments';
        this.maxComments = 20;
    }

    // Récupérer tous les commentaires
    getComments() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            return [];
        }
    }

    // Sauvegarder un nouveau commentaire
    saveComment(commentText) {
        try {
            const comments = this.getComments();
            const newComment = {
                text: commentText,
                date: new Date().toISOString()
            };
            
            // Ajouter au début de la liste
            comments.unshift(newComment);
            
            // Limiter le nombre de commentaires
            const limitedComments = comments.slice(0, this.maxComments);
            
            localStorage.setItem(this.storageKey, JSON.stringify(limitedComments));
            return true;
        } catch (error) {
            return false;
        }
    }

    // Supprimer un commentaire par index
    deleteComment(index) {
        try {
            const comments = this.getComments();
            if (index >= 0 && index < comments.length) {
                comments.splice(index, 1);
                localStorage.setItem(this.storageKey, JSON.stringify(comments));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Effacer tous les commentaires
    clearAllComments() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Obtenir des statistiques sur les commentaires
    getCommentStats() {
        const comments = this.getComments();
        return {
            total: comments.length,
            maxAllowed: this.maxComments,
            oldest: comments.length > 0 ? new Date(comments[comments.length - 1].date) : null,
            newest: comments.length > 0 ? new Date(comments[0].date) : null
        };
    }

    // Formater un commentaire pour l'affichage
    formatComment(comment) {
        const date = new Date(comment.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return {
            text: comment.text,
            date: formattedDate,
            timestamp: comment.date
        };
    }

    // Valider un commentaire
    validateComment(text) {
        if (!text || typeof text !== 'string') {
            return { valid: false, error: 'Le commentaire doit être une chaîne de caractères' };
        }
        
        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            return { valid: false, error: 'Le commentaire ne peut pas être vide' };
        }
        
        if (trimmedText.length > 500) {
            return { valid: false, error: 'Le commentaire ne peut pas dépasser 500 caractères' };
        }
        
        return { valid: true, text: trimmedText };
    }
}

// Exporter une instance unique du service
export const commentService = new CommentService(); 