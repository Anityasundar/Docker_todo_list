const { Op } = require('sequelize');
const Task = require('../models/Task');
const User = require('../models/User');
const emailService = require('./emailService');

// This would be called periodically (e.g., via cron job)
async function checkDueTasks() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const tasks = await Task.findAll({
    where: {
      dueDate: {
        [Op.between]: [now, soon]
      },
      isCompleted: false
    },
    include: [User]
  });
  
  for (const task of tasks) {
    await emailService.sendReminderEmail(task.User.email, {
      title: task.title,
      dueDate: task.dueDate
    });
  }
}

module.exports = {
  checkDueTasks
};
