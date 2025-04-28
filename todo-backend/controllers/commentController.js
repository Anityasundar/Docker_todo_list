const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await Comment.findAll({
      where: { taskId: id },
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to the task
    if (task.userId !== req.user.id && !(await task.hasCollaborator(req.user))) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }
    
    const comment = await Comment.create({
      content,
      taskId: id,
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