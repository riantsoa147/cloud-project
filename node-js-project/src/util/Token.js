const { v4: uuidv4 } = require('uuid');
const Configuration = require('../model/Configuration');
const MyConnect = require('../db/MyConnect');
const Util = require('./Util');

class Token {
    // Propriété privée pour stocker la configuration une fois chargée
    static #TOKEN_EXPIRATION_DELAY_CONFIG = null;

    constructor(value, creationDate, expirationDate) {
        this.value = value; // Valeur du token
        this.creationDate = creationDate; // Date de création
        this.expirationDate = expirationDate; // Date d'expiration
    }

    // Getter statique avec initialisation différée
    static async getTokenExpirationDelayConfig() {
        if (!Token.#TOKEN_EXPIRATION_DELAY_CONFIG) {
            // Charger la configuration si elle n'a pas encore été chargée
            Token.#TOKEN_EXPIRATION_DELAY_CONFIG = await Util.getConfiguration("token_expiration_delay");
            if (!Token.#TOKEN_EXPIRATION_DELAY_CONFIG) {
                throw new Error("Le délai d'expiration du token n'est pas configuré.");
            }
        }
        return Token.#TOKEN_EXPIRATION_DELAY_CONFIG;
    }

    /**
     * Génère un token avec une valeur UUID, une date de création, et une date d'expiration.
     * @returns {Promise<Token>} Une instance de Token
     */
    static async generateToken() {
        try {
            // Générer la valeur UUID pour le token
            const tokenValue = uuidv4();

            // Obtenir la date actuelle comme date de création
            const creationDate = new Date();

            // Charger la configuration pour le délai d'expiration
            const expirationDelayConfig = await Token.getTokenExpirationDelayConfig();

            // Calculer la date d'expiration
            const expirationDate = await Util.treatDateByConfig(expirationDelayConfig, creationDate);

            // Retourner une nouvelle instance de Token
            return new Token(tokenValue, creationDate, expirationDate);
        } catch (error) {
            console.error("Erreur lors de la génération du token :", error);
            throw error; // Propager l'erreur
        }
    }
}

module.exports = Token;
