const MyConnect = require('../db/MyConnect');

class UserPin {
    constructor(id, pin, creation_date, expiration_date, id_users) {
        this.id = id;
        this.pin = pin;
        this.creation_date = creation_date;
        this.expiration_date = expiration_date;
        this.id_users = id_users;
    }
    static async isPINcorrect(id, pin){
        const query = 'SELECT * FROM user_pin WHERE id_users = $1 AND pin = $2 AND expiration_date > NOW()';
        const values = [id, pin];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                return true;
            } else {
                return false;
            } 
        } catch (error) {
            throw new Error(`Error while identifying corresponding PIN: ${error.message}`);
        }
    }

    static async getById(id) {
        const query = 'SELECT * FROM user_pin WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new UserPin(row.id, row.pin, row.creation_date, row.expiration_date, row.id_users);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching user_pin by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    static async getAll() {
        const query = 'SELECT * FROM user_pin ORDER BY id ASC';
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query);
            return result.rows.map(row => 
                new UserPin(row.id, row.pin, row.creation_date, row.expiration_date, row.id_users)
            );
        } catch (err) {
            throw new Error(`Error fetching all user_pins: ${err.message}`);
        } finally {
            client.release();
        }
    }

    async insert() {
        const query = `
            INSERT INTO user_pin (pin, creation_date, expiration_date, id_users)
            VALUES ($1, $2, $3, $4) RETURNING id
        `;
        const values = [this.pin, this.creation_date, this.expiration_date, this.id_users];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            this.id = result.rows[0].id;
            return this.id;
        } catch (err) {
            throw new Error(`Error inserting user_pin: ${err.message}`);
        } finally {
            client.release();
        }
    }

    async update() {
        const query = `
            UPDATE user_pin
            SET pin = $1, creation_date = $2, expiration_date = $3, id_users = $4
            WHERE id = $5
        `;
        const values = [this.pin, this.creation_date, this.expiration_date, this.id_users, this.id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error updating user_pin: ${err.message}`);
        } finally {
            client.release();
        }
    }

    static async deleteById(id) {
        const query = 'DELETE FROM user_pin WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error deleting user_pin by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Generating a PIN code with default length set on 3
     * @param {number} length
     * @returns {string}
     */
    static generatePin(length = 3) {
        if (length <= 0 || !Number.isInteger(length)) {
            throw new Error("La longueur du PIN doit être un entier positif.");
        }

        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;

        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }

    /**
     * Verify if the PIN exist and is still valid
     * @param {string} pin 
     * @param {number} userId
     * @returns {boolean} True if valid and still in use
     */
    static async verifyPin(pin, userId) {
        const query = 'SELECT * FROM user_pin WHERE pin = $1 AND id_users = $2';
        const values = [pin, userId];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];

                // Verify if the pin is expired
                const currentDate = new Date();
                if (currentDate > new Date(row.expiration_date)) {
                    throw new Error("Le PIN est expiré.");
                }

                // The PIN is still in use and valid
                return true;
            } else {
                throw new Error("PIN incorrect ou inexistant.");
            }

        } catch (err) {
            throw new Error('Erreur lors de la vérification du PIN :' + err.message);
        } finally {
            client.release();
        }
    }
}

module.exports = UserPin;
