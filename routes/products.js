const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// List all products
router.get('/', (req, res) => {
  const category = req.query.category || '';
  const search = req.query.search || '';
  const user = req.session.user || null;
  
  let query = 'SELECT * FROM products WHERE status = "active"';
  let params = [];
  
  if (category) {
    query += ' AND category_id = ?';
    params.push(category);
  }
  
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, products) => {
    if (err) products = [];
    
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      if (err) categories = [];
      
      res.render('products/list', {
        title: 'Products - Verdant Fields',
        user,
        products,
        categories,
        category,
        search
      });
    });
  });
});

// Product details
router.get('/:id', (req, res) => {
  const user = req.session.user || null;
  const productId = req.params.id;
  
  db.get(`
    SELECT p.*, u.first_name, u.last_name, f.name as farm_name 
    FROM products p
    LEFT JOIN users u ON p.farmer_id = u.id
    LEFT JOIN farms f ON u.id = f.farmer_id
    WHERE p.id = ?
  `, [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).render('404', { title: 'Product Not Found', user });
    }
    
    // Get related products
    db.all(`
      SELECT * FROM products 
      WHERE category_id = ? AND id != ? AND status = "active"
      LIMIT 4
    `, [product.category_id, productId], (err, relatedProducts) => {
      if (err) relatedProducts = [];
      
      // Get reviews
      db.all(`
        SELECT r.*, u.first_name, u.last_name 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [productId], (err, reviews) => {
        if (err) reviews = [];
        
        res.render('products/details', {
          title: product.name,
          user,
          product,
          relatedProducts,
          reviews
        });
      });
    });
  });
});

// Add to cart
router.post('/:id/cart', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const productId = req.params.id;
  const quantity = parseInt(req.body.quantity) || 1;
  
  db.run(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?',
    [userId, productId, quantity, quantity],
    function(err) {
      if (err) {
        req.flash('error', 'Failed to add to cart');
        return res.redirect(`/products/${productId}`);
      }
      
      req.flash('success', 'Added to cart successfully!');
      res.redirect(`/products/${productId}`);
    }
  );
});

// Add to wishlist
router.post('/:id/wishlist', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const productId = req.params.id;
  
  db.run(
    'INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
    function(err) {
      if (err) {
        req.flash('error', 'Failed to add to wishlist');
        return res.redirect(`/products/${productId}`);
      }
      
      req.flash('success', 'Added to wishlist!');
      res.redirect(`/products/${productId}`);
    }
  );
});

module.exports = router;
