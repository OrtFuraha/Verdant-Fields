const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// Admin dashboard
router.get('/', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  // Get statistics
  db.get('SELECT COUNT(*) as total_users FROM users', (err, users) => {
    if (err) users = { total_users: 0 };
    
    db.get('SELECT COUNT(*) as total_products FROM products', (err, products) => {
      if (err) products = { total_products: 0 };
      
      db.get('SELECT COUNT(*) as total_orders FROM orders', (err, orders) => {
        if (err) orders = { total_orders: 0 };
        
        db.get('SELECT COUNT(*) as pending_orders FROM orders WHERE status = "pending"', (err, pending) => {
          if (err) pending = { pending_orders: 0 };
          
          db.get('SELECT SUM(final_amount) as revenue FROM orders WHERE status = "delivered"', (err, revenue) => {
            if (err) revenue = { revenue: 0 };
            
            // Get recent orders
            db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10', (err, recentOrders) => {
              if (err) recentOrders = [];
              
              res.render('admin/index', {
                title: 'Admin Dashboard - Verdant Fields',
                user: req.session.user,
                stats: {
                  users: users.total_users || 0,
                  products: products.total_products || 0,
                  orders: orders.total_orders || 0,
                  pending: pending.pending_orders || 0,
                  revenue: revenue.revenue || 0
                },
                recentOrders
              });
            });
          });
        });
      });
    });
  });
});

// Manage users
router.get('/users', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) users = [];
    
    res.render('admin/users', {
      title: 'Manage Users - Verdant Fields',
      user: req.session.user,
      users
    });
  });
});

// Manage products
router.get('/products', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  db.all(`
    SELECT p.*, u.first_name, u.last_name 
    FROM products p
    LEFT JOIN users u ON p.farmer_id = u.id
    ORDER BY p.created_at DESC
  `, (err, products) => {
    if (err) products = [];
    
    res.render('admin/products', {
      title: 'Manage Products - Verdant Fields',
      user: req.session.user,
      products
    });
  });
});

// Manage orders
router.get('/orders', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  db.all(`
    SELECT o.*, u.first_name, u.last_name 
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `, (err, orders) => {
    if (err) orders = [];
    
    res.render('admin/orders', {
      title: 'Manage Orders - Verdant Fields',
      user: req.session.user,
      orders
    });
  });
});

// Update order status
router.post('/orders/:id/status', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function(err) {
    if (err) {
      req.flash('error', 'Failed to update order status');
    } else {
      req.flash('success', 'Order status updated');
    }
    res.redirect('/admin/orders');
  });
});

// Manage payments
router.get('/payments', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/payments', {
    title: 'Manage Payments - Verdant Fields',
    user: req.session.user
  });
});

// Manage deliveries
router.get('/deliveries', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/deliveries', {
    title: 'Manage Deliveries - Verdant Fields',
    user: req.session.user
  });
});

// Manage categories
router.get('/categories', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/categories', {
    title: 'Manage Categories - Verdant Fields',
    user: req.session.user
  });
});

// Manage coupons
router.get('/coupons', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/coupons', {
    title: 'Manage Coupons - Verdant Fields',
    user: req.session.user
  });
});

// Analytics
router.get('/analytics', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/analytics', {
    title: 'Analytics - Verdant Fields',
    user: req.session.user
  });
});

// Settings
router.get('/settings', auth.isAuthenticated, auth.isAdmin, (req, res) => {
  res.render('admin/settings', {
    title: 'Settings - Verdant Fields',
    user: req.session.user
  });
});

module.exports = router;
