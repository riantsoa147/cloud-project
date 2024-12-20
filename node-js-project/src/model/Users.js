const MyConnect = require('../db/MyConnect');
const Util = require('../util/Util');
const Token = require('../util/Token');
const UserToken = require('./UserToken');

const { v4: uuidv4 } = require('uuid'); // Pour générer des UUID
const UserPin = require('./UserPin');
const Attempt = require('./Attempt');

class Users {
  constructor(id, email, name, firstname, validation_date, password) {
    this.id = id || uuidv4(); // Génère un UUID si l'ID n'est pas fourni
    this.email = email;
    this.name = name;
    this.firstname = firstname;
    this.validation_date = validation_date || null;
    this.password = password;
  }

  // ** Login **
  static async checkPIN(id, pin) {
    try {
      if(await UserPin.isPINcorrect(id, pin)){
        const token = await Token.generateToken();
        const user_token = UserToken.fromObjects(id, token);
        await user_token.insert();
        return token.value; 
      } else {
        try {
          await Attempt.incrementAttempts(id);
        } catch (error) {
          throw new Error(`Erreur lors de l'enregistrement de l'essai : ${error.message}`);
        }
        throw new Error(`Code PIN éronné`);
      }
    } catch (error) {
      throw new Error(`Erreur lors de la connexion : ${error.message}`);
    }
  }

  static async identify(email, password) {
    // Récupérer l'utilisateur par email
    const user = await Users.getByEmail(email);
    if (!user) {
        throw new Error("Utilisateur introuvable");
    }

    // Vérifier si l'utilisateur peut tenter une nouvelle connexion
    const bool_attempt = await Attempt.canAttempt(user.id);

    // Gérer les tentatives
    if (!bool_attempt.isAble) {
        throw new Error(`Vous avez dépassé le nombre maximal de tentatives. Il vous reste ${bool_attempt.remainingAttempt} essai(s).`);
    }

    // Cryptage du mot de passe et vérification
    const crypted_psd = await Util.encrypt(password);
    if (crypted_psd !== user.password) {
        await this.handleFailedAttempt(user.id);
        throw new Error(`Mot de passe incorrect. Il vous reste ${bool_attempt.remainingAttempt - 1} essai(s).`);
    }
    return user.id;
  } 

  static async handleFailedAttempt(userId) {
    try {
        await Attempt.incrementAttempts(userId);
    } catch (error) {
        throw new Error(`Erreur lors de l'enregistrement de l'essai : ${error.message}`);
    }
  }

  // **Retrouver un utilisateur selon son email**
  static async getByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [email]);
      if (result.rows.length === 0) {
        throw new Error(`Utilisateur avec l'email ${email} non trouvé`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Créer un nouvel utilisateur**
    async insert() {
      const query = `
        INSERT INTO users (id, email, name, firstname, validation_date, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      let con;
      try {
        // Crypter le mot de passe avant de l'insérer
        this.password = await Util.encrypt(this.password);
  
        const values = [this.id, this.email, this.name, this.firstname, this.validation_date, this.password];
        con = await MyConnect.getConnection();
        const result = await con.query(query, values);
        return result.rows[0].id;
      } catch (error) {
        throw new Error(`Erreur lors de l'insertion : ${error.message}`);
      } finally {
        if (con) await con.release();
      }
    }
  
      // **Mise à jour avec un nouveau mot de passe**
  async updateWithPassword() {
    const query = `
      UPDATE users
      SET email = $1, name = $2, firstname = $3, validation_date = $4, password = $5
      WHERE id = $6
    `;
    let con;
    try {
      // Crypter le mot de passe avant la mise à jour
      this.password = await Util.encrypt(this.password);

      const values = [this.email, this.name, this.firstname, this.validation_date, this.password, this.id];
      con = await MyConnect.getConnection();
      await con.query(query, values);
      return `Utilisateur avec l'ID ${this.id} mis à jour avec un nouveau mot de passe`;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour avec mot de passe : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Mise à jour sans toucher au mot de passe**
  async updateUnlessPassword() {
    const query = `
      UPDATE users
      SET email = $1, name = $2, firstname = $3, validation_date = $4
      WHERE id = $5
    `;
    let con;
    try {
      const values = [this.email, this.name, this.firstname, this.validation_date, this.id];
      con = await MyConnect.getConnection();
      await con.query(query, values);
      return `Utilisateur avec l'ID ${this.id} mis à jour sans modification du mot de passe`;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour sans mot de passe : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }
  

  // **Récupérer un utilisateur par ID**
  static async getById(id) {
    const query = `SELECT * FROM users WHERE id = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  static async getByIdUser(iduser) {
    const query = `SELECT * FROM users WHERE id_user = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error(`Utilisateur avec l'ID ${id} non trouvé`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Récupérer tous les utilisateurs**
  static async getAll() {
    const query = `SELECT * FROM users ORDER BY id ASC`;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de tous les utilisateurs : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Supprimer un utilisateur par ID**
  static async deleteById(id) {
    const query = `DELETE FROM users WHERE id = $1`;
    let con;
    try {
      con = await MyConnect.getConnection();
      await con.query(query, [id]);
      return `Utilisateur avec l'ID ${id} supprimé avec succès`;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  // **Valider un utilisateur : mettre à jour validation_date**
  async validate() {
    const query = `
      UPDATE users
      SET validation_date = CURRENT_TIMESTAMP
      WHERE id = $1 and validation_date IS NULL
      RETURNING validation_date
    `;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [this.id]);

      if (result.rowCount === 0) {
        throw new Error(`Utilisateur avec l'ID ${this.id} non trouvé pour validation ou a été déja validé`);
      }
      
      this.validation_date = result.rows[0].validation_date;
      return this.validation_date;
    } catch (error) {
      throw new Error(`Erreur lors de la validation : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  static async updatePasswordByEmail(email, newPassword) {
    const query = `
      UPDATE users
      SET password = $1
      WHERE email = $2
    `;
    let con;
    try {
      // Crypter le nouveau mot de passe avant de l'enregistrer
      const encryptedPassword = await Util.encrypt(newPassword);

      con = await MyConnect.getConnection();
      const result = await con.query(query, [encryptedPassword, email]);

      if (result.rowCount === 0) {
        throw new Error(`Utilisateur avec l'email ${email} non trouvé`);
      }

      return `Mot de passe mis à jour avec succès pour l'utilisateur ayant l'email ${email}`;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du mot de passe : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }

  static async updatePasswordByIdWithoutEncryption (id, newPassword) {
    console.log("we're here");

    const query = `
      UPDATE users
      SET password = $1
      WHERE id = $2
    `;
    let con;
    try {
      con = await MyConnect.getConnection();
      const result = await con.query(query, [newPassword, id]);

      if (result.rowCount === 0) {
        throw new Error(`Utilisateur avec l'email ${id} non trouvé`);
      }

      return `Mot de passe mis à jour avec succès pour l'utilisateur ayant l'id ${id}`;
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du mot de passe : ${error.message}`);
    } finally {
      if (con) await con.release();
    }
  }
}

module.exports = Users;
