const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Marketplace page
router.get('/marketplace', (req, res) => {
  const user = req.session.user || null;
  res.render('products/marketplace', { title: 'Marketplace - Verdant Fields', user });
});

// Verdant Mart page
router.get('/mart', (req, res) => {
  const user = req.session.user || null;
  res.render('mart/index', { title: 'Verdant Mart - Verdant Fields', user });
});

// Farmers page
router.get('/farmers', (req, res) => {
  const user = req.session.user || null;
  db.all('SELECT * FROM users WHERE role = "farmer" AND is_verified = 1 LIMIT 12', (err, farmers) => {
    if (err) farmers = [];
    res.render('farmers/index', { title: 'Farmers - Verdant Fields', user, farmers });
  });
});

// Farmer profile
router.get('/farmers/:id', (req, res) => {
  const user = req.session.user || null;
  const farmerId = req.params.id;
  
  db.get('SELECT * FROM users WHERE id = ? AND role = "farmer"', [farmerId], (err, farmer) => {
    if (err || !farmer) {
      return res.status(404).render('404', { title: 'Farmer Not Found', user });
    }
    
    db.get('SELECT * FROM farms WHERE farmer_id = ?', [farmerId], (err, farm) => {
      if (err) farm = null;
      
      db.all('SELECT * FROM products WHERE farmer_id = ? AND status = "active"', [farmerId], (err, products) => {
        if (err) products = [];
        
        res.render('farmers/profile', {
          title: `${farmer.first_name} ${farmer.last_name} - Verdant Fields`,
          user,
          farmer,
          farm,
          products
        });
      });
    });
  });
});

// Education page
router.get('/education', (req, res) => {
  const user = req.session.user || null;
  res.render('education/index', { title: 'Education - Verdant Fields', user });
});

// About page
router.get('/about', (req, res) => {
  const user = req.session.user || null;
  res.render('about', { title: 'About Us - Verdant Fields', user });
});

// Contact page
router.get('/contact', (req, res) => {
  const user = req.session.user || null;
  res.render('contact', { title: 'Contact Us - Verdant Fields', user });
});

module.exports = router;
