const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// Verdant Mart homepage
router.get('/', (req, res) => {
  const user = req.session.user || null;
  const category = req.query.category || '';
  const search = req.query.search || '';
  
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
  
  query += ' ORDER BY created_at DESC LIMIT 12';
  
  db.all(query, params, (err, products) => {
    if (err) products = [];
    
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      if (err) categories = [];
      
      // Get featured products for mart
      db.all('SELECT * FROM products WHERE is_featured = 1 AND status = "active" LIMIT 6', (err, featured) => {
        if (err) featured = [];
        
        res.render('mart/index', {
          title: 'Verdant Mart - Fresh Groceries',
          user,
          products,
          categories,
          featured,
          category,
          search
        });
      });
    });
  });
});

// Cart page
router.get('/cart', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  db.all(`
    SELECT c.*, p.name, p.price, p.discount_price, p.images, p.stock
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [userId], (err, cartItems) => {
    if (err) cartItems = [];
    
    let total = 0;
    cartItems.forEach(item => {
      const price = item.discount_price || item.price;
      total += price * item.quantity;
    });
    
    res.render('mart/cart', {
      title: 'Shopping Cart - Verdant Fields',
      user: req.session.user,
      cartItems,
      total
    });
  });
});

// Update cart
router.post('/cart/update', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { productId, quantity } = req.body;
  
  if (quantity <= 0) {
    db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);
  } else {
    db.run('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
  }
  
  res.redirect('/mart/cart');
});

// Checkout
router.get('/checkout', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  db.all(`
    SELECT c.*, p.name, p.price, p.discount_price, p.stock
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [userId], (err, cartItems) => {
    if (err) cartItems = [];
    
    if (cartItems.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/mart/cart');
    }
    
    let subtotal = 0;
    cartItems.forEach(item => {
      const price = item.discount_price || item.price;
      subtotal += price * item.quantity;
    });
    
    // Get user profile for address
    db.get('SELECT * FROM profiles WHERE user_id = ?', [userId], (err, profile) => {
      if (err) profile = null;
      
      res.render('mart/checkout', {
        title: 'Checkout - Verdant Fields',
        user: req.session.user,
        cartItems,
        subtotal,
        profile
      });
    });
  });
});

// Process order
router.post('/checkout', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { address, city, phone, payment_method, delivery_notes } = req.body;
  
  // Get cart items
  db.all(`
    SELECT c.*, p.price, p.discount_price, p.farmer_id
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [userId], async (err, cartItems) => {
    if (err || cartItems.length === 0) {
      req.flash('error', 'Cart is empty');
      return res.redirect('/mart/cart');
    }
    
    let subtotal = 0;
    let farmerId = null;
    
    cartItems.forEach(item => {
      const price = item.discount_price || item.price;
      subtotal += price * item.quantity;
      if (!farmerId) farmerId = item.farmer_id;
    });
    
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Create order
    db.run(`
      INSERT INTO orders 
      (order_number, user_id, farmer_id, total_amount, delivery_fee, final_amount, 
       delivery_address, delivery_city, delivery_phone, delivery_notes, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber, userId, farmerId, subtotal, deliveryFee, total,
      address, city, phone, delivery_notes, payment_method, 'pending'
    ], function(err) {
      if (err) {
        req.flash('error', 'Failed to create order');
        return res.redirect('/mart/checkout');
      }
      
      const orderId = this.lastID;
      
      // Add order items
      cartItems.forEach(item => {
        const price = item.discount_price || item.price;
        db.run(
          'INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, price, price * item.quantity]
        );
      });
      
      // Clear cart
      db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
      
      req.flash('success', 'Order placed successfully!');
      res.redirect(`/orders/${orderId}`);
    });
  });
});

module.exports = router;
