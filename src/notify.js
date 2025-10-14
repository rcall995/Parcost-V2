const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, timestamp } = req.body;

  if (!message || !timestamp) {
    return res.status(400).json({ error: 'Missing message or timestamp' });
  }

  // Configure Nodemailer with Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-gmail@gmail.com', // Replace with your Gmail address
      pass: 'your-app-password' // Replace with Gmail App Password (not regular password)
    }
  });

  // Email-to-SMS to Google Voice (Verizon gateway)
  const mailOptions = {
    from: 'your-gmail@gmail.com',
    to: '7167712273@vtext.com', // Google Voice SMS gateway
    cc: 'info@10kpostcards.com', // Replace with your email for backup
    subject: '', // SMS gateways ignore subject
    text: `New Chatbot Question: ${message}\nTime: ${timestamp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};