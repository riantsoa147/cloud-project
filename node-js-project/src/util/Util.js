const MyConnect = require('../db/MyConnect');
const UserToken = require('../model/UserToken');
const Configuration = require('../model/Configuration');
const { config } = require('dotenv');

class Util {
    /**
     * Crypte une chaîne de caractères en utilisant la fonction crypt de PostgreSQL.
     * @param {string} plainText - Le texte à crypter.
     * @return {Promise<string>} - Le texte crypté.
     */

    static async treatDateByConfig(config, reference_date) {
        const min_value = Util.getConfigInt(config);
        const ans = new Date(reference_date.getTime() + min_value * 60 * 1000);
        return ans;
    }

    static async getConfigInt(config) {
        const ans = parseInt(config.valeurs, 10);
        if (isNaN(ans)) {
            throw new Error(`${config.keys} doit être un nombre valide`);
        }
    }

    static async getConfiguration(conf_key) {
        const config = await Configuration.getByKey(conf_key);
        if (!config) {
            throw new Error(`La configuration "${conf_key}" est introuvable`);
        }
        return config;
    }
    static async encrypt(plainText) {
        if (!plainText || typeof plainText !== 'string') {
            throw new Error('Invalid input: plainText must be a non-empty string.');
        }

        const query = `
            SELECT crypt($1, gen_salt('bf')) AS encrypted
        `;
        const values = [plainText];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            return result.rows[0].encrypted;
        } catch (err) {
            throw new Error(`Error encrypting string: ${err.message}`);
        } finally {
            client.release();
        }
    }

    static async isTokenValid(token) {
        const query = `
            SELECT expiration_date 
            FROM user_token 
            WHERE token = $1
        `;
        let con;
        try {
            con = await MyConnect.getConnection();
            const result = await con.query(query, [token]);

            if (result.rows.length === 0) {
                return false; // Token non trouvé
            }

            const { expiration_date } = result.rows[0];
            if (expiration_date && new Date(expiration_date) > new Date()) {
                return true; // Token valide
            }

            return false; // Token expiré
        } catch (error) {
            throw new Error(`Erreur lors de la vérification du token : ${error.message}`);
        } finally {
            if (con) await con.release();
        }
    }

    // Fonction pour vérifier si un token est valide
    static async verifyToken(req) {
        let token;

        // Récupération du token depuis les en-têtes ou les paramètres de requête
        if (req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1]; // Extrait le token après "Bearer "
            } else {
                throw new Error('Format du token invalide.');
            }
        } else if (req.query.token) {
            token = req.query.token; // Optionnel : Récupérer le token depuis un paramètre GET
        } else {
            throw new Error('Token manquant.');
        }

        // Vérification de la validité du token en utilisant la méthode isTokenValid
        const isValid = await Util.isTokenValid(token);

        if (!isValid) {
            throw new Error('Token invalide ou expiré.');
        }

        // Si le token est valide, la fonction retourne la valeur du token
        return await UserToken.getByTokenValue(token);
    }

    /**
     * Formate une date JavaScript en une chaîne compatible avec le type TIMESTAMP de PostgreSQL.
     * Le format retourné est 'YYYY-MM-DD HH:mm:ss'.
     *
     * @param {Date} date - L'objet Date à formater. Doit être une instance valide de Date.
     * @returns {string} La chaîne de caractères formatée, compatible avec le type TIMESTAMP de PostgreSQL.
     * @throws {Error} Si l'argument `date` n'est pas une instance valide de `Date`.
     *
     * @example
     * const now = new Date();
     * const formattedDate = formatDateForPostgresTimestamp(now);
     * console.log(formattedDate);  // Exemple : '2024-12-19 14:30:00'
     */
    static formatToPgDate(date) {
        // Vérifier si la date est valide
        if (!(date instanceof Date) || isNaN(date)) {
            throw new Error('Date invalide');
        }
    
        // Formater la date au format 'YYYY-MM-DD HH:mm:ss'
        const formattedDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0') + ':' +
            String(date.getSeconds()).padStart(2, '0');
    
        return formattedDate;
    }
    

}



module.exports = Util;
