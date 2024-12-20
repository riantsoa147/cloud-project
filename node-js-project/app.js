const express = require('express');
const app = express();
const updatePasswordController = require('./src/controller/UpdatePasswordController');
const loginController = require('./src/controller/LoginController');
const { signup, validation } = require('./src/controller/SignUpController');
const { swaggerUi, swaggerDocs } = require('./swagger');

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Routes
app.use(
  '/api', 
  updatePasswordController, 
  loginController
);
app.post('/signup', signup); // Route pour inscription
app.get('/validate/:id', validation); // Route pour validation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Démarrage du serveur
app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
  console.log('Docs API disponible sur http://localhost:3000/api-docs');
});