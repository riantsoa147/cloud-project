// controllers/SignUpController.js
const Users = require('../model/Users');
const Email = require('../util/Email');

// Fonction pour l'inscription
/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Permet à un utilisateur de s'inscrire en fournissant les informations nécessaires. Envoie un email pour valider l'inscription.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mail:
 *                 type: string
 *                 description: Adresse email de l'utilisateur.
 *               name:
 *                 type: string
 *                 description: Nom de l'utilisateur.
 *               firstname:
 *                 type: string
 *                 description: Prénom de l'utilisateur.
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur.
 *     responses:
 *       201:
 *         description: Inscription réussie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Inscription réussie"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "utilisateur@example.com"
 *                     password:
 *                       type: string
 *                       example: "******"
 *                     validation_link:
 *                       type: string
 *                       description: Lien de validation pour activer le compte.
 *                       example: "http://localhost:3000/validate/12345"
 *       400:
 *         description: Informations manquantes ou invalides.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "All information are required"
 *                 data:
 *                   type: null
 *       500:
 *         description: Erreur interne du serveur.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Erreur interne du serveur."
 *                 data:
 *                   type: null
 */

const signup = async (req, res) => {
    const { mail, name, firstname, password } = req.body;

    if (!mail || !password || !name || !firstname) {
        return res.status(400).json({
            status: "error",
            message: "All information are required",
            data: null
        });
    }

    const user = new Users (null, mail, name, firstname, null , password);
    user.insert();
    const displayName = 'Talentis';
    const email = new Email(displayName);
    const subject = `Validation de votre inscription`;
    const content = `<style>
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
  <div class="container">

    <div class="header">
      <h1>Validation d'inscription</h1>
    </div>

    <div class="content">
      <h2>Bonjour ${name} ${firstname},</h2>

      <p>Merci de rejoindre notre communauté !</p>
      <p>Cliquez sur ce lien ci dessous pour finaliser votre inscription</p>
      <a href="http://localhost:3000/validate/${user.id}">http://localhost:3000/validate/${user.id}</a>

    </div>

    <div class="footer">
      <p>Merci de nous faire confiance.</p>
    </div>

    </div>`;
    await email.sendMail(mail, subject, content);

    res.status(201).json({
        status: "success",
        message: "Inscription réussie",
        data: {
            email: mail,
            password: "******", // Ne jamais renvoyer les mots de passe en clair !
            validation_link: `http://localhost:3000/validate/${user.id}`
        }
    });
};

// Fonction pour la validation
/**
 * @swagger
 * /validate/{id}:
 *   get:
 *     summary: Validation d'un utilisateur
 *     description: Valide un compte utilisateur à l'aide de son ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur à valider.
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: Validation réussie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Validation réussie"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "12345"
 *                     validatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-19T12:00:00Z"
 *       400:
 *         description: ID manquant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "ID is required"
 *                 data:
 *                   type: null
 *       500:
 *         description: Erreur interne du serveur.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la validation de l'utilisateur."
 *                 data:
 *                   type: null
 */

const validation = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: "error",
            message: "ID is required",
            data: null
        });
    }

    try {
        // Tentative de récupération de l'utilisateur
        const user = await Users.getById(id);
        
        // Tentative de validation de l'utilisateur
        const validatedAt = await user.validate();
        
        // Réponse en cas de succès
        res.status(200).json({
            status: "success",
            message: "Validation réussie",
            data: {
                userId: id,
                validatedAt: validatedAt
            }
        });
    } catch (error) {
        // Gestion des erreurs
        console.error("Erreur lors de la validation :", error.message);
        res.status(500).json({
            status: "error",
            message: `Erreur lors de la validation de l'utilisateur : ${error.message}`,
            data: null
        });
    }
};


module.exports = { signup, validation };
