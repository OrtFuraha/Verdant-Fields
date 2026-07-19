const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Home page
router.get('/', (req, res) => {
  const user = req.session.user || null;
  
  res.render('home', {
    title: 'Verdant Fields - Connecting Farmers to Markets',
    user
  });
});

// Search
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const user = req.session.user || null;
  
  if (!query.trim()) {
    return res.render('search', { title: 'Search', user, results: [], query: '' });
  }
  
  const searchTerm = `%${query}%`;
  
  db.all(`
    SELECT * FROM products 
    WHERE (name LIKE ? OR description LIKE ?) AND status = 'active'
  `, [searchTerm, searchTerm], (err, products) => {
    if (err) products = [];
    
    db.all(`
      SELECT * FROM users 
      WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) AND role IN ('farmer', 'customer', 'buyer')
    `, [searchTerm, searchTerm, searchTerm], (err, users) => {
      if (err) users = [];
      
      res.render('search', {
        title: 'Search Results',
        user,
        query,
        products,
        users
      });
    });
  });
});

module.exports = router;
