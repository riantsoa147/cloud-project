const nodemailer = require('nodemailer');

class Email {
  constructor( displayName) {
    // Configuration du transporteur SMTP
    this.sender = 'fanasinamanantsoa30@gmail.com';
    this.displayName = displayName;
    this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587, // ou 465 pour SSL
        secure: false, // false pour STARTTLS, true pour SSL
      auth: {
        user: this.sender, // Email expéditeur
        pass: 'kdly mfpi vduv jcsw', // Mot de passe ou clé API (géré par le serveur)
      },
      tls: {
        rejectUnauthorized: false, // Ignore les erreurs de certificat
      },
    });
  }

  /**
   * Envoie un email HTML sans exposer les détails d'authentification.
   * @param {string} recipient - Adresse email du destinataire
   * @param {string} subject - Sujet de l'email
   * @param {string} content - Contenu HTML de l'email
   */
  async sendMail(recipient, subject, content) {
    try {
      // Contenu HTML du message
      const bodyHtml = `
        <html>
          <body>
                ${content}
          </body>
        </html>
      `;

      // Paramètres du message
      const mailOptions = {
        from: `"${this.displayName}" <${this.sender}>`, // Adresse expéditeur (email + nom affiché)
        to: recipient, // Adresse destinataire
        subject: subject, // Sujet de l'email
        html: bodyHtml, // Contenu HTML
      };

      // Envoi de l'email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès : ', info.messageId);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email : ', error);
    }
  }

  static async sendPasswordUpdateValidation (recipient, changeId) {
    const emailUtil = new Email('nyavorakotonirina5@gmail.com', 'Talentis', 'wsfv fvqw imvl zdra');
    const subject = 'Valider votre changement de mot de passe';
    const content = `
      <p>Lien pour valider votre changement de mot de passe:</p>
      <p><a href="localhost:3000/api/confirm-update-password/${ changeId }">localhost:3000/api/confirm-update-password/${ changeId }</a></p>
      <p>Ce lien expire dans 90 secondes.</p>
    `;

    await emailUtil.sendMail(recipient, subject, content);
  }

  /**
   * Send the pin by email
   * @param {string} pin
   * @returns {Promise<void>} - Résultat de l'envoi
   */
  async sendPinByEmail(recipient, displayName, subject, pin) {
    try {
      // Paramètres du message
      const mailOptions = {
        from: `"${displayName}" <${this.sender}>`,
        to: recipient,
        subject: subject,
        text: `Bonjour,\n\nVotre code PIN est : ${pin}\n\nMerci.`
      };

      // Envoi de l'email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès a : ', recipient);
    } catch (error) {
      throw new Error(`Erreur lors de l'envoi de l'email : ${error.message}`);
    }
  }
}

module.exports = Email;