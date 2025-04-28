const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Import models
const User = require('./models/User');
const Task = require('./models/Task');
const Category = require('./models/Category');
const Comment = require('./models/Comment');
const ActivityLog = require('./models/ActivityLog');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Setup associations
const setupAssociations = () => {
  // User associations
  User.hasMany(Task, { foreignKey: 'userId' });
  User.hasMany(Comment, { foreignKey: 'userId' });
  User.hasMany(ActivityLog, { foreignKey: 'userId' });
  User.belongsToMany(Task, { through: 'TaskCollaborators', as: 'collaboratedTasks' });

  // Task associations
  Task.belongsTo(User, { foreignKey: 'userId' });
  Task.belongsTo(Category, { foreignKey: 'categoryId' });
  Task.hasMany(Comment, { foreignKey: 'taskId' });
  Task.belongsToMany(User, { through: 'TaskCollaborators', as: 'collaborators' });

  // Category associations
  Category.hasMany(Task, { foreignKey: 'categoryId' });

  // Comment associations
  Comment.belongsTo(User, { foreignKey: 'userId' });
  Comment.belongsTo(Task, { foreignKey: 'taskId' });

  // ActivityLog associations
  ActivityLog.belongsTo(User, { foreignKey: 'userId' });
};

setupAssociations();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
