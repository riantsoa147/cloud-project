const MyConnect = require('../db/MyConnect');

class Configuration {
    constructor(id, keys, valeurs) {
        this.id = id;
        this.keys = keys;
        this.valeurs = valeurs;
    }

    // Récupérer un enregistrement par ID
    static async getById(id) {
        const query = 'SELECT * FROM configuration WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new Configuration(row.id, row.keys, row.valeurs);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching configuration by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Récupérer un enregistrement par la clee
    static async getByKey(key) {
        const query = 'SELECT * FROM configuration WHERE keys = $1';
        const values = [key];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new Configuration(row.id, row.keys, row.valeurs);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching configuration by Key: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Récupérer tous les enregistrements
    static async getAll() {
        const query = 'SELECT * FROM configuration ORDER BY id ASC';
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query);
            return result.rows.map(row => new Configuration(row.id, row.keys, row.valeurs));
        } catch (err) {
            throw new Error(`Error fetching all configurations: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Insérer un nouvel enregistrement
    async insert() {
        const query = `
            INSERT INTO configuration (keys, valeurs)
            VALUES ($1, $2) RETURNING id
        `;
        const values = [this.keys, this.valeurs];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            this.id = result.rows[0].id;
            return this.id;
        } catch (err) {
            throw new Error(`Error inserting configuration: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Mettre à jour un enregistrement existant
    async update() {
        const query = `
            UPDATE configuration
            SET keys = $1, valeurs = $2
            WHERE id = $3
        `;
        const values = [this.keys, this.valeurs, this.id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error updating configuration: ${err.message}`);
        } finally {
            client.release();
        }
    }

    // Supprimer un enregistrement par ID
    static async deleteById(id) {
        const query = 'DELETE FROM configuration WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error deleting configuration by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = Configuration;
