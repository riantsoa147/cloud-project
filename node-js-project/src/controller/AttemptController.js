const express = require('express');
const Util = require('../util/Util');
const Attempt = require('../model/Attempt');
const router = express.Router();

// **Contrôleur GET pour reinitialiser le nombre de tentative**
/**
 * @swagger
 * /resetAtempt/{idUser}:
 *   get:
 *     summary: Réinitialise le nombre de tentatives d'un utilisateur
 *     description: Réinitialise le nombre de tentatives pour un utilisateur en fonction de son ID. Vérifie ensuite si l'horodatage actuel est encore valide par rapport à la date de validation.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         description: L'ID de l'utilisateur.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: La réinitialisation a réussi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "réinitialisation réussie."
 *       500:
 *         description: Le temps accordé pour réinitialiser les tentatives est écoulé ou une erreur s'est produite lors du processus de réinitialisation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Temps écoulé, requete invalide."

 */

router.get('/resetAtempt/:idUser', async (req, res) => { 
  const idUser = req.params['idUser'] ;

  const check = null;
  try {
    check = await Attempt.resetAttempts(idUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  if (check != null) {
    const currentTimestamp = new Date();

    if (currentTimestamp.getTime() <= check.validation_date.getTime()) {
      return res.status(200).json({ error : 'reinitialisation réussi.' });
    } else {
      return res.status(500).json({ error : 'Temps écoulé, requete invalide.' });
    }
  } else {
    return res.status(500).json({ error : 'Impossible de confirmer la requete.' });
  }
});

module.exports = router;