const express = require('express');
const Users = require('../model/Users');
const Util = require('../util/Util');
const EmailUtil = require('../util/Email');
const PasswordChange = require('../model/PasswordChange');
const router = express.Router();

// **Contrôleur POST pour mettre à jour le mot de passe**
/**
 * @swagger
 * /update-password:
 *   post:
 *     summary: Mise à jour du mot de passe
 *     description: Permet de demander une mise à jour du mot de passe pour un utilisateur identifié par un email. Un email de confirmation est envoyé avec un lien de validation.
 *     security:
 *       - bearerAuth: []  # Utilisation du token d'authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Adresse email de l'utilisateur.
 *                 example: "utilisateur@example.com"
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe à définir.
 *                 example: "NouveauMotDePasse123!"
 *     responses:
 *       200:
 *         description: Email de confirmation envoyé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email de confirmation envoyé avec succès à l'adresse : utilisateur@example.com, le lien expirera dans 90 secondes."
 *                 validation_link:
 *                   type: string
 *                   description: Lien pour valider la mise à jour du mot de passe.
 *                   example: "http://localhost:3000/confirm-update-password/12345"
 *                   x-format: uri  # Annotation importante pour indiquer qu'il s'agit d'une URL
 *       400:
 *         description: Informations manquantes ou invalides.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email et nouveau mot de passe sont requis."
 *       500:
 *         description: Erreur interne du serveur ou token non valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de la vérification du token."
 */

router.post('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;

  let token = null;

  try {
    token = await Util.verifyToken(req);
  } catch (error) { 
    return res.status(500).json({ error: error.message });
  }

  if (token != null) {
    let tokenOwner = await Users.getById(token.userId);

    if (tokenOwner.email == email) {
        // Validation des données d'entrée
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email et nouveau mot de passe sont requis.' });
        }

        let changeId = null;
        try {
          let passwordChange = new PasswordChange(0, tokenOwner.id, await Util.encrypt(newPassword), null);
          changeId = await passwordChange.insertReturningId();
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }

        if (changeId != null) {
          const recipient = tokenOwner.email;
          await EmailUtil.sendPasswordUpdateValidation(recipient, changeId);
          return res.status(200).json({ message : `Email de confirmation envoyé avec succès à l'adresse : ${ tokenOwner.email }, le lien expirera dans 90 secondes`});
        }
    } else {
        return res.status(500).json({ error: 'Le mail entré ne correspond pas au token utilisé.' });
    }
  }
});

/**
 * @swagger
 * /confirm-update-password/{changeId}:
 *   get:
 *     summary: Confirmation du changement de mot de passe
 *     description: Permet de confirmer une demande de changement de mot de passe à l'aide d'un identifiant de validation.
 *     parameters:
 *       - in: path
 *         name: changeId
 *         required: true
 *         description: Identifiant de validation du changement de mot de passe.
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: Changement de mot de passe réussi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Changement de mot de passe réussi."
 *       500:
 *         description: Erreur interne ou validation expirée.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Temps écoulé, validation impossible."
 */

router.get('/confirm-update-password/:changeId', async (req, res) => { 
  const changeId = req.params['changeId'] ;

  let passwordChange = null;
  try {
    passwordChange = await PasswordChange.getById(changeId);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  if (passwordChange != null) {
    const currentTimestamp = new Date();

    if (currentTimestamp.getTime() <= passwordChange.validation_date.getTime()) {
      await Users.updatePasswordByIdWithoutEncryption(passwordChange.id_users, passwordChange.password);
    
      return res.status(200).json({ error : 'Changement de mot de passe réussi.' });
    } else {
      return res.status(500).json({ error : 'Temps écoulé, validation impossible.' });
    }
  } else {
    return res.status(500).json({ error : 'Impossible de confirmer le changement.' });
  }
});

module.exports = router;