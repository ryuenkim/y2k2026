const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const port = Number(process.env.SMTP_PORT || 587);
    const requiredSettings = ['SMTP_HOST', 'SMTP_EMAIL', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL'];
    const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be a valid TCP port');
    }
    if (missingSettings.length) {
        throw new Error(`Missing SMTP configuration: ${missingSettings.join(', ')}`);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        ...(options.html ? { html: options.html } : {}),
        attachments: options.attachments || []
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
