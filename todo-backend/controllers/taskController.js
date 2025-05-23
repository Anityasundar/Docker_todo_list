const { Op } = require('sequelize');
const Task = require('../models/Task');
const User = require('../models/User');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

exports.getAllTasks = async (req, res) => {
  try {
    const { search, category, priority, completed, dueDate } = req.query;
    
    const where = { userId: req.user.id };
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (completed) {
      where.isCompleted = completed === 'true';
    }
    
    if (dueDate) {
      where.dueDate = {
        [Op.lte]: new Date(dueDate)
      };
    }
    
    const tasks = await Task.findAll({
      where,
      include: [
        { model: Category },
        { model: User, as: 'collaborators', attributes: ['id', 'username'] },
        { model: Comment, include: [{ model: User, attributes: ['username'] }] }
      ],
      order: [
        ['isCompleted', 'ASC'],
        ['dueDate', 'ASC'],
        ['priority', 'DESC']
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, categoryId } = req.body;
    
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      categoryId,
      userId: req.user.id
    });
    
    // Log activity
    await ActivityLog.create({
      action: 'create',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify(task)
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Other CRUD operations (getTask, updateTask, deleteTask) would follow similar patterns

exports.shareTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this task' });
    }
    
    const userToShareWith = await User.findByPk(userId);
    
    if (!userToShareWith) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await task.addCollaborator(userToShareWith);
    
    // Log activity
    await ActivityLog.create({
      action: 'share',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify({ sharedWith: userId })
    });
    
    res.json({ message: 'Task shared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to the task
    if (task.userId !== req.user.id && !(await task.hasCollaborator(req.user))) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }
    
    const comment = await Comment.create({
      content,
      taskId,
      userId: req.user.id
    });
    
    // Log activity
    await ActivityLog.create({
      action: 'comment',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify({ commentId: comment.id })
    });
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ... (previous code)

exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id, {
      include: [
        { model: User, attributes: ['username'] },
        { model: Category },
        { model: User, as: 'collaborators', attributes: ['id', 'username'] },
        { 
          model: Comment, 
          include: [{ model: User, attributes: ['username'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to the task
    if (task.userId !== req.user.id && !(await task.hasCollaborator(req.user))) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, categoryId, isCompleted } = req.body;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    const updatedTask = await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      priority: priority || task.priority,
      categoryId: categoryId !== undefined ? categoryId : task.categoryId,
      isCompleted: isCompleted !== undefined ? isCompleted : task.isCompleted
    });
    
    // Log activity
    await ActivityLog.create({
      action: 'update',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify(updatedTask)
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    await task.destroy();
    
    // Log activity
    await ActivityLog.create({
      action: 'delete',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify(task)
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.userId !== req.user.id && !(await task.hasCollaborator(req.user))) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    const updatedTask = await task.update({ isCompleted });
    
    // Log activity
    await ActivityLog.create({
      action: isCompleted ? 'complete' : 'incomplete',
      model: 'Task',
      modelId: task.id,
      userId: req.user.id,
      data: JSON.stringify({ isCompleted })
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};