const express = require('express');
const Users = require('../model/Users');
const UserPin = require('../model/UserPin');
const Email = require('../util/Email');
const Configuration = require('../model/Configuration');
const Util = require('../util/Util');
const router = express.Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Se connecter à un compte utilisateur
 *     description: Authentifie un utilisateur avec son email et son mot de passe.
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
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur.
 *     responses:
 *       200:
 *         description: Connexion réussie. Redirige l'utilisateur vers l'URL pour accéder à son compte.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 description:
 *                   type: string
 *                   example: "Log in"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "12345"
 *                     url:
 *                       type: string
 *                       description: L'URL pour accéder au compte après connexion.
 *                       example: "http://localhost:3000/dashboard"
 *       500:
 *         description: Erreur de connexion. L'URL de l'erreur peut être ajoutée à cette réponse.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 description:
 *                   type: string
 *                   example: "Log in"
 *                 error:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Erreur lors de la connexion a votre compte"
 *                     message:
 *                       type: string
 *                       example: "Mot de passe incorrect."
 *                     url:
 *                       type: string
 *                       description: L'URL pour revenir à la page de connexion.
 *                       example: "http://localhost:3000/login"
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || email == '' || !password || password == '') {
    let data = {
      status: 500,
      description: 'Log in',
      data: null,
      error: {
        title: 'Empty required values',
        message: 'Please fill in all required fields (email and password) to continue',
      }
    };
    return res.status(500).json(data);
  }

  try {
    let user_id = await Users.identify(email, password);

    let data = {
      status: 200,
      description: 'Log in',
      data: {
        user_id: user_id,
      },
      error: null
    };

    return res.status(200).json(data);
  } catch (error) {
    let data = {
      status: 500,
      description: 'Log in',
      data: null,
      error: {
        title: 'Erreur lors de la connexion a votre compte',
        message: error.message,
      }
    };
    return res.status(500).json(data);
  }

});


// **Contrôleur POST pour mot de passe oublie**
/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Demande de réinitialisation de mot de passe
 *     description: Envoie un email avec un code PIN pour réinitialiser le mot de passe d'un utilisateur.
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
 *     responses:
 *       200:
 *         description: Un email a été envoyé avec un code PIN pour réinitialiser le mot de passe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 description:
 *                   type: string
 *                   example: "Forgot password"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Un email de réinitialisation de mot de passe a été envoyé à votre adresse email."
 *       500:
 *         description: Erreur interne du serveur ou utilisateur introuvable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 description:
 *                   type: string
 *                   example: "Forgot password"
 *                 error:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Utilisateur introuvable"
 *                     message:
 *                       type: string
 *                       example: "L'adresse email ne correspond à aucun compte."
 */

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || email == '') {
    let data = {
      status: 500,
      description: 'Forgot password',
      data: null,
      error: {
        title: 'Empty required values',
        message: 'Please fill in all required fields (email) to continue',
      }
    };
    return res.status(500).json(data);
  }

  try {
    const user = await Users.getByEmail(email);
    if (!user) {
      let data = {
        status: 500,
        description: 'Forgot password',
        data: null,
        error: {
          title: 'Utilisateur introuvable',
          message: 'L\'adresse email que vous avez entre ne correspond a aucun compte.',
        }
      };
      return res.status(500).json(data);
    }

    const pin = UserPin.generatePin();

    const configuration = await Configuration.getByKey("pin_expiration_minute");
    const configValue = parseInt(configuration.valeurs, 10);

    const formattedDate = Util.formatToPgDate(new Date());
    const formattedFutureDate = Util.formatToPgDate(new Date(new Date().getTime() + configValue * 60 * 1000));    

    const user_pin = new UserPin(0, pin, formattedDate, formattedFutureDate, user.id);
    await user_pin.insert();

    const mail = new Email('Talentis');
    const subject = 'Mot de passe oublie';
    const content = getMailContent(user_pin.pin, user.name, user.firstname);
    await mail.sendMail(email, subject, content);

  } catch (error) {
    let data = {
      status: 500,
      description: 'Forgot password',
      data: null,
      error: {
        title: 'Erreur interne du serveur',
        message: error.message,
      }
    };
    return res.status(500).json(data);
  }

  let data = {
    status: 200,
    description: 'Forgot password',
    data: {
      message: 'Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.',
    },
    error: null
  };

  return res.status(200).json(data);

});


// **Contrôleur POST pour se connecter**
/**
 * @swagger
 * /validate-pin:
 *   post:
 *     summary: Valider un code PIN pour réinitialiser le mot de passe
 *     description: Vérifie si le code PIN fourni est valide pour l'utilisateur spécifié.
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
 *               pin:
 *                 type: string
 *                 description: Code PIN reçu par email.
 *     responses:
 *       200:
 *         description: Le code PIN est valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 description:
 *                   type: string
 *                   example: "PIN validation"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Le code PIN que vous avez entré est correct, vous pouvez modifier votre mot de passe."
 *       500:
 *         description: Erreur interne du serveur ou utilisateur introuvable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 description:
 *                   type: string
 *                   example: "PIN validation"
 *                 error:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Utilisateur introuvable"
 *                     message:
 *                       type: string
 *                       example: "L'adresse email ne correspond à aucun compte."
 */

router.post('/validate-pin', async (req, res) => {
  const { email, pin } = req.body;

  if (!email || email == '' || !pin || pin == '') {
    let data = {
      status: 500,
      description: 'PIN validation',
      data: null,
      error: {
        title: 'Empty required values',
        message: 'Please fill in all required fields (email and pin) to continue',
      }
    };
    return res.status(500).json(data);
  }

  try {
    const user = await Users.getByEmail(email);
    if (!user) {
      let data = {
        status: 500,
        description: 'PIN validation',
        data: null,
        error: {
          title: 'Utilisateur introuvable',
          message: 'L\'adresse email que vous avez entre ne correspond a aucun compte.',
        }
      };
      return res.status(500).json(data);
    }

    const valid_pin = await UserPin.verifyPin(pin, user.id);
    if (valid_pin) {
      let data = {
        status: 200,
        description: 'PIN validation',
        data: {
          message: 'Le code PIN que vous avez entre est correct vous pouvez modifier votre mot de passe',
        },
        error: null
      };
      return res.status(200).json(data);
    }

  } catch (error) {
    let data = {
      status: 500,
      description: 'PIN validation',
      data: null,
      error: {
        title: 'Erreur interne du serveur',
        message: error.message,
      }
    };
    return res.status(500).json(data);
  }


});




// ------------------------------------------------
// Contenu de l'email
// ------------------------------------------------
function getMailContent(pin, name, firstname) {

  const mail = `<!DOCTYPE html>
  <html lang="fr">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }

      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }

      .header {
        background-color: #4CAF50;
        color: #ffffff;
        text-align: center;
        padding: 20px 0;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
      }

      .content {
        padding: 20px;
        color: #333333;
      }

      .content h2 {
        color: #4CAF50;
        font-size: 20px;
      }

      .content p {
        font-size: 16px;
        line-height: 1.5;
      }

      .footer {
        background-color: #f1f1f1;
        color: #888888;
        text-align: center;
        padding: 10px 0;
        font-size: 14px;
      }

      .footer a {
        color: #4CAF50;
        text-decoration: none;
      }

      /* Responsive */
      @media only screen and (max-width: 600px) {
        .container {
          width: 100%;
        }

        .header h1 {
          font-size: 20px;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">

      <div class="header">
        <h1>Reinitialisation de mot de passe</h1>
      </div>

      <div class="content">
        <h2>Bonjour ${name},</h2>

        <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Utilisez le code ci-dessous pour
          compléter cette opération :</p>
        <div class="code-box">${pin}</div>
        <p>Ce code est valable pendant 10 minutes.</p>

      </div>

      <div class="footer">
        <p>Merci de nous faire confiance.</p>
      </div>

    </div>
  </body>

  </html>`;

  return mail;
}

module.exports = router;
