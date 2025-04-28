const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const category = await Category.create({ name, color });
    
    // Log activity
    await ActivityLog.create({
      action: 'create',
      model: 'Category',
      modelId: category.id,
      userId: req.user.id,
      data: JSON.stringify(category)
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};