const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/tasks/:id/comments')
  .get(commentController.getComments)
  .post(commentController.addComment);

module.exports = router;
