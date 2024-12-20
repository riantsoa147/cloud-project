const MyConnect = require('../db/MyConnect');
const Email = require('../util/Email');
const Util = require('../util/Util');

class Attempt {
    // Propriétés privées pour stocker les configurations
    static #ATTEMPT_DELAY_CONFIG = null;
    static #ATTEMPT_NUMBER_CONFIG = null;

    constructor(id, dateNextAttempt, countAttempt, idUsers) {
        this.id = id;
        this.dateNextAttempt = dateNextAttempt;
        this.countAttempt = countAttempt;
        this.idUsers = idUsers;
    }

    /**
     * Vérifie si un utilisateur peut encore tenter quelque chose.
     * @param {number} idUser - L'ID de l'utilisateur.
     * @returns {Promise<Object>} Un objet avec les informations sur la capacité de l'utilisateur à tenter.
     */
    static async canAttempt(idUser) {
        const attempt = await Attempt.getByIdUser(idUser);
        const attemptNumber = await Attempt.getAttemptNumberConfig();
        if (attempt.countAttempt < attemptNumber) {
            return {
                isAble: true,
                remainingAttempt: attemptNumber - attempt.countAttempt,
            };
        } else {
            return {
                isAble: false,
                remainingAttempt: 0,
            };
        }
    }

    // Récupérer un enregistrement par IDUSER
    static async getByIdUser(id_users) {
        const query = 'SELECT * FROM attempts WHERE id_users = $1';
        const values = [id_users];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new Attempt(row.id, row.date_next_attempt, row.count_attempt, row.id_users);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching attempt by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Reinitialiser l'attempts
    static async reset(idUsers) {
        const query = `
            UPDATE attempts
            SET date_next_attempt = null, count_attempt = 0 WHERE id_users = $1
        `;
        const values = [idUsers];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error reseting attempt: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Bloquer un utilisateur en fixant la date de prochaine tentative
    blockUser() {
        const attemptMinuteLimit = Attempt.getAttemptDelayConfig();
        const nextAttemptDate = new Date();
        nextAttemptDate.setSeconds(nextAttemptDate.getSeconds() + attemptMinuteLimit);
        this.dateNextAttempt = nextAttemptDate;
    }

    // Gérer les tentatives d'un utilisateur
    static async incrementAttempts(idUsers) {
        try {
            let attempt = await Attempt.getByIdUser(idUsers);
            const maxAttempts = await Attempt.getAttemptNumberConfig();

            if (!attempt) {
                attempt = new Attempt(null, null, 1, idUsers);
                await attempt.insert();
            } else if (attempt.countAttempt >= maxAttempts) {
                attempt.blockUser();
                await attempt.update();
                const email= new Email();
                const user= await User.getById(idUsers);

                const mailOptions = {
                    from: `<${email.sender}>`,
                    to: user.email,
                    subject: `reinitialisation nombre de tentative`,
                    text: `<p>Lien pour reinitialiser le nombre de tentative de connection pour vous:</p>
                            <p><a href="localhost:3000/api/resetAtempt/${ idUsers }">resetAtempt []</a></p>`
                };
            
                  // Envoi de l'email
                  const info = await email.transporter.sendMail(mailOptions);

                throw new Error('Trop de tentatives. Veuillez reinitialiser votre nombre de tentative sur votre compte email!');
            } else {
                attempt.countAttempt++;
                await attempt.update();
            }
            return maxAttempts - attempt.countAttempt;
        } catch (err) {
            throw new Error(`Erreur lors du traitement des tentatives : ${err.message}`);
        }
    }

    // Getter statique pour charger la configuration de délai
    static async getAttemptDelayConfig() {
        if (!Attempt.#ATTEMPT_DELAY_CONFIG) {
            Attempt.#ATTEMPT_DELAY_CONFIG = await Util.getConfiguration("attempt_delay");
            if (!Attempt.#ATTEMPT_DELAY_CONFIG) {
                throw new Error("La configuration de délai pour les tentatives est introuvable.");
            }
        }
        return Attempt.#ATTEMPT_DELAY_CONFIG;
    }

    // Getter statique pour charger la configuration du nombre maximal de tentatives
    static async getAttemptNumberConfig() {
        if (!Attempt.#ATTEMPT_NUMBER_CONFIG) {
            const config = await Util.getConfiguration("attempt_number");
            Attempt.#ATTEMPT_NUMBER_CONFIG = await Util.getConfigInt(config);
            if (!Attempt.#ATTEMPT_NUMBER_CONFIG) {
                throw new Error("La configuration du nombre de tentatives est introuvable.");
            }
        }
        return Attempt.#ATTEMPT_NUMBER_CONFIG;
    }

    // Récupérer un enregistrement par ID

    static async getById(id) {
        const query = 'SELECT * FROM attempts WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new Attempt(row.id, row.date_next_attempt, row.count_attempt, row.id_users);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching attempt by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Récupérer tous les enregistrements
    static async getAll() {
        const query = 'SELECT * FROM attempts ORDER BY id ASC';
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query);
            return result.rows.map(row => new Attempt(row.id, row.date_next_attempt, row.count_attempt, row.id_users));
        } catch (err) {
            throw new Error(`Error fetching all attempts: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Insérer un nouvel enregistrement
    async insert() {
        const query = `
            INSERT INTO attempts (date_next_attempt, count_attempt, id_users)
            VALUES ($1, $2, $3) RETURNING id
        `;
        const values = [this.dateNextAttempt, this.countAttempt, this.idUsers];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            this.id = result.rows[0].id;
            return this.id;
        } catch (err) {
            throw new Error(`Error inserting attempt: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Mettre à jour un enregistrement existant
    async update() {
        const query = `
            UPDATE attempts
            SET date_next_attempt = $1, count_attempt = $2, id_users = $3
            WHERE id = $4
        `;
        const values = [this.dateNextAttempt, this.countAttempt, this.idUsers, this.id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error updating attempt: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Supprimer un enregistrement par ID
    static async deleteById(id) {
        const query = 'DELETE FROM attempts WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error deleting attempt by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Réinitialiser les tentatives pour un utilisateur spécifique
    static async resetAttempts(id_users) {
        const query = `
            UPDATE attempts
            SET date_next_attempt = NULL, count_attempt = 0
            WHERE id_users = $1
        `;
        const values = [id_users];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error resetting attempts for UserID ${id_users}: ${err.message}`);
        } finally {
            client.release();
        }
    }

}

module.exports = Attempt;
