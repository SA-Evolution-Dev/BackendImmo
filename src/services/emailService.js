import nodemailer from 'nodemailer'
import config from '../config/env.js';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Template HTML de base
const getEmailTemplate = (content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
      .header h1 { font-size: 28px; font-weight: 700; margin: 0; }
      .content { padding: 40px 30px; }
      .content h2 { color: #1a202c; font-size: 24px; margin-bottom: 20px; }
      .content p { color: #4a5568; font-size: 16px; margin-bottom: 15px; }
      .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
      .link-box { background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
      .link-box a { color: #667eea; text-decoration: none; font-size: 14px; }
      .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 14px; color: #718096; }
      .footer p { margin: 5px 0; }
      .warning { background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0; }
      .warning p { color: #c53030; margin: 0; }
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. Tous droits réservés.</p>
        <p>Si vous n'êtes pas à l'origine de cette action, veuillez ignorer cet email.</p>
      </div>
    </div>
  </body>
  </html>
`;

// Envoyer un email de vérification
const sendVerificationEmail = async (email, firstName, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const content = `
    <div class="header">
      <h1>Bienvenue sur ${process.env.APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>Bonjour ${firstName} ! 👋</h2>
      <p>Merci de vous être inscrit sur ${process.env.APP_NAME}. Nous sommes ravis de vous accueillir !</p>
      <p>Pour finaliser votre inscription et activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
      <center>
        <a href="${verificationUrl}" class="button">Vérifier mon email</a>
      </center>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <div class="link-box">
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
      <div class="warning">
        <p><strong>⚠️ Ce lien expire dans 24 heures.</strong></p>
      </div>
      <p>Une fois votre email vérifié, vous pourrez profiter pleinement de toutes les fonctionnalités de notre plateforme.</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Vérifiez votre compte ${process.env.APP_NAME}`,
    html: getEmailTemplate(content)
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer un email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, firstName, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const content = `
    <div class="header">
      <h1>Réinitialisation de mot de passe</h1>
    </div>
    <div class="content">
      <h2>Bonjour ${firstName},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe sur ${process.env.APP_NAME}.</p>
      <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
      <center>
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      </center>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <div class="link-box">
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
      <div class="warning">
        <p><strong>⚠️ Ce lien expire dans 1 heure pour des raisons de sécurité.</strong></p>
      </div>
      <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Réinitialisation de votre mot de passe - ${process.env.APP_NAME}`,
    html: getEmailTemplate(content)
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer un email de bienvenue après vérification
const sendWelcomeEmail = async (email, firstName) => {
  const content = `
    <div class="header">
      <h1>Bienvenue sur ${process.env.APP_NAME} ! 🎉</h1>
    </div>
    <div class="content">
      <h2>Félicitations ${firstName} !</h2>
      <p>Votre email a été vérifié avec succès. Vous faites maintenant partie de la communauté ${process.env.APP_NAME}.</p>
      <p>Vous pouvez dès maintenant :</p>
      <ul style="color: #4a5568; margin: 20px 0; padding-left: 20px;">
        <li style="margin: 10px 0;">Parcourir nos annonces immobilières</li>
        <li style="margin: 10px 0;">Créer vos propres annonces</li>
        <li style="margin: 10px 0;">Sauvegarder vos favoris</li>
        <li style="margin: 10px 0;">Contacter directement les propriétaires</li>
      </ul>
      <center>
        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Accéder à mon compte</a>
      </center>
      <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Bienvenue sur ${process.env.APP_NAME} !`,
    html: getEmailTemplate(content)
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendWelcomeEmail 
};
