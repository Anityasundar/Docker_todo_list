const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendReminderEmail = async (to, data) => {
  try {
    const info = await transporter.sendMail({
      from: `"Todo App" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Task Reminder',
      text: `You have a task "${data.title}" due soon (${data.dueDate})`,
      html: `<p>You have a task <strong>${data.title}</strong> due soon (${new Date(data.dueDate).toLocaleString()})</p>`
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
