const MyConnect = require('../db/MyConnect');

class PasswordChange {
    constructor(id, id_users, password, validation_date) {
        this.id = id;
        this.id_users = id_users;
        this.password = password;
        this.validation_date = validation_date;
    }

    static async getById(id) {
        const query = 'SELECT * FROM password_change WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return new PasswordChange(row.id, row.id_users, row.password, row.validation_date);
            } else {
                return null;
            }
        } catch (err) {
            throw new Error(`Error fetching password_change by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }

    static async getAll() {
        const query = 'SELECT * FROM password_change ORDER BY id ASC';
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query);
            return result.rows.map(row => 
                new PasswordChange(row.id, row.id_users, row.password, row.validation_date)
            );
        } catch (err) {
            throw new Error(`Error fetching all password_changes: ${err.message}`);
        } finally {
            client.release();
        }
    }

    async insert() {
        const query = `
            INSERT INTO password_change (id_users, password)
            VALUES ($1, $2) RETURNING id
        `;
        const values = [this.id_users, this.password];
        const client = await MyConnect.getConnection();

        try {
            const result = await client.query(query, values);
            this.id = result.rows[0].id;
            return this.id;
        } catch (err) {
            throw new Error(`Error inserting password_change: ${err.message}`);
        } finally {
            client.release();
        }
    }

    async insertReturningId () {
        const query = `
            INSERT INTO password_change (id_users, password)
            VALUES ($1, $2) RETURNING id
        `;
        const values = [this.id_users, this.password];
        const client = await MyConnect.getConnection();
    
        try {
            const result = await client.query(query, values);
            this.id = result.rows[0].id; // Récupérer l'ID généré
            return this.id; // Retourner l'ID
        } catch (err) {
            throw new Error(`Error inserting password_change: ${err.message}`);
        } finally {
            client.release();
        }
    }
    

    async update() {
        const query = `
            UPDATE password_change
            SET id_users = $1, password = $2, validation_date = $3
            WHERE id = $4
        `;
        const values = [this.id_users, this.password, this.validation_date, this.id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error updating password_change: ${err.message}`);
        } finally {
            client.release();
        }
    }

    static async deleteById(id) {
        const query = 'DELETE FROM password_change WHERE id = $1';
        const values = [id];
        const client = await MyConnect.getConnection();

        try {
            await client.query(query, values);
        } catch (err) {
            throw new Error(`Error deleting password_change by ID: ${err.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = PasswordChange;