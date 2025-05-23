const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(categoryController.getAllCategories)
  .post(categoryController.createCategory);

module.exports = router;
