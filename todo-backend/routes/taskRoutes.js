const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

router.route('/:id')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.post('/:id/complete', taskController.completeTask);
router.post('/:id/share', taskController.shareTask);
router.post('/:id/comments', taskController.addComment);
// router.get('/:id/comments', taskController.getComments);

module.exports = router;
