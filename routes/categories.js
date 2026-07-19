const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Categories main page
router.get('/categories', (req, res) => {
  const user = req.session.user || null;
  res.render('categories/index', {
    title: 'Categories - Verdant Fields',
    user
  });
});

// Category detail pages
router.get('/categories/:category', (req, res) => {
  const user = req.session.user || null;
  const category = req.params.category;
  
  // Category data
  const categories = {
    'vegetables': {
      name: 'Vegetables',
      icon: 'fas fa-carrot',
      count: '120+',
      description: 'Fresh, organic vegetables from local farms'
    },
    'fruits': {
      name: 'Fruits',
      icon: 'fas fa-apple-alt',
      count: '85+',
      description: 'Sweet, juicy fruits picked at peak ripeness'
    },
    'organic': {
      name: 'Organic Foods',
      icon: 'fas fa-leaf',
      count: '60+',
      description: 'Certified organic products for healthy living'
    },
    'seeds': {
      name: 'Seeds',
      icon: 'fas fa-seedling',
      count: '45+',
      description: 'High-quality seeds for your farm and garden'
    },
    'livestock': {
      name: 'Livestock',
      icon: 'fas fa-horse',
      count: '30+',
      description: 'Healthy livestock and farm animals'
    },
    'dairy': {
      name: 'Dairy',
      icon: 'fas fa-cheese',
      count: '40+',
      description: 'Fresh dairy products from happy cows'
    },
    'beverages': {
      name: 'Beverages',
      icon: 'fas fa-wine-bottle',
      count: '25+',
      description: 'Refreshing beverages and drinks'
    },
    'equipment': {
      name: 'Equipment',
      icon: 'fas fa-tractor',
      count: '35+',
      description: 'Farm equipment and agricultural tools'
    }
  };
  
  const categoryData = categories[category];
  
  if (!categoryData) {
    return res.status(404).render('404', { 
      title: 'Category Not Found', 
      user 
    });
  }
  
  res.render('categories/detail', {
    title: `${categoryData.name} - Verdant Fields`,
    user,
    categoryName: categoryData.name,
    icon: categoryData.icon,
    productCount: categoryData.count,
    description: categoryData.description
  });
});

module.exports = router;
