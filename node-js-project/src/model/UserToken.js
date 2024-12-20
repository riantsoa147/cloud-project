const MyConnect = require('../db/MyConnect');
const { v4: uuidv4 } = require('uuid'); // Pour générer des UUID
const Users = require('./Users'); // Assurez-vous que la classe Users est dans le bon chemin

class UserToken {
  constructor(id, token, creationDate, expirationDate, userId) {
    this.id = id || null; // ID auto-incrémenté par la base de données
    this.token = token || uuidv4();
    this.creationDate = creationDate || new Date();
    this.expirationDate = expirationDate || null;
    this.userId = userId;
  }

  static fromObjects(idUser, token){
    return new UserToken(null, token.value, token.creationDate, token.expirationDate, idUser);
  }
  // **Créer un nouvel enregistrement de token**
  async insert() {
    const query = `
      INSERT INTO user_token (token, creation_date, expiration_date, id_users)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const values = [this.token, this.creationDate, this.expirationDate, this.userId];
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, values);
      this.id = result.rows[0].id;
      return this.id;
    } catch (error) {
      throw new Error(`Erreur lors de l'insertion : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Récupérer un token par ID**
  static async getById(id) {
    const query = `SELECT * FROM user_token WHERE id = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error(`Token avec l'ID ${id} non trouvé`);
      }
      const row = result.rows[0];
      return new UserToken(row.id, row.token, row.creation_date, row.expiration_date, row.id_users);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Récupérer un token par la valeur du token **
  static async getByTokenValue (token) {
    const query = `SELECT * FROM user_token WHERE token = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [token]);
      if (result.rows.length === 0) {
        throw new Error(`Token avec la valeur ${token} non trouvé`);
      }
      const row = result.rows[0];
      return new UserToken(row.id, row.token, row.creation_date, row.expiration_date, row.id_users);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Récupérer tous les tokens**
  static async getAll() {
    const query = `SELECT * FROM user_token ORDER BY id ASC`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query);
      return result.rows.map(row => new UserToken(row.id, row.token, row.creation_date, row.expiration_date, row.id_users));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des tokens : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Mettre à jour un token**
  async update() {
    const query = `
      UPDATE user_token
      SET token = $1, creation_date = $2, expiration_date = $3, id_users = $4
      WHERE id = $5
    `;
    const values = [this.token, this.creationDate, this.expirationDate, this.userId, this.id];
    let con;
    try {
      con = await MyConnect.getConnection();
      await con.query(query, values);
      return `Token avec l'ID ${this.id} mis à jour avec succès`;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Supprimer un token par ID**
  static async deleteById(id) {
    const query = `DELETE FROM user_token WHERE id = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      await con.query(query, [id]);
      return `Token avec l'ID ${id} supprimé avec succès`;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }
}

module.exports = UserToken;
