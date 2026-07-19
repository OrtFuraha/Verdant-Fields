const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const db = require('../database/db');

// Dashboard redirect based on role
router.get('/', auth.isAuthenticated, (req, res) => {
  const user = req.session.user;
  
  switch(user.role) {
    case 'admin':
      return res.redirect('/admin');
    case 'ceo':
      return res.redirect('/ceo');
    case 'farmer':
      return res.redirect('/dashboard/farmer');
    case 'delivery_rider':
      return res.redirect('/dashboard/delivery');
    case 'warehouse_staff':
      return res.redirect('/dashboard/warehouse');
    case 'buyer':
      return res.redirect('/dashboard/buyer');
    default:
      return res.redirect('/dashboard/customer');
  }
});

// Customer dashboard
router.get('/customer', auth.isAuthenticated, (req, res) => {
  const user = req.session.user;
  
  // Get orders count
  db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [user.id], (err, orders) => {
    if (err) orders = { count: 0 };
    
    // Get wishlist count
    db.get('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [user.id], (err, wishlist) => {
      if (err) wishlist = { count: 0 };
      
      // Get cart count
      db.get('SELECT COUNT(*) as count FROM cart WHERE user_id = ?', [user.id], (err, cart) => {
        if (err) cart = { count: 0 };
        
        // Get recent orders
        db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [user.id], (err, recentOrders) => {
          if (err) recentOrders = [];
          
          // Get wallet balance
          db.get('SELECT SUM(amount) as balance FROM wallet_transactions WHERE user_id = ? AND status = "completed"', [user.id], (err, wallet) => {
            if (err) wallet = { balance: 0 };
            
            res.render('dashboard/customer', {
              title: 'Customer Dashboard - Verdant Fields',
              user,
              orders: orders.count,
              wishlist: wishlist.count,
              cart: cart.count,
              recentOrders,
              wallet: wallet.balance || 0
            });
          });
        });
      });
    });
  });
});

// Farmer dashboard
router.get('/farmer', auth.isAuthenticated, auth.isFarmer, (req, res) => {
  const user = req.session.user;
  
  // Get farm
  db.get('SELECT * FROM farms WHERE farmer_id = ?', [user.id], (err, farm) => {
    if (err) farm = null;
    
    // Get products count
    db.get('SELECT COUNT(*) as count FROM products WHERE farmer_id = ?', [user.id], (err, products) => {
      if (err) products = { count: 0 };
      
      // Get orders count
      db.get('SELECT COUNT(*) as count FROM orders WHERE farmer_id = ?', [user.id], (err, orders) => {
        if (err) orders = { count: 0 };
        
        // Get revenue
        db.get('SELECT SUM(final_amount) as revenue FROM orders WHERE farmer_id = ? AND status = "delivered"', [user.id], (err, revenue) => {
          if (err) revenue = { revenue: 0 };
          
          // Get recent orders
          db.all('SELECT * FROM orders WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 5', [user.id], (err, recentOrders) => {
            if (err) recentOrders = [];
            
            res.render('dashboard/farmer', {
              title: 'Farmer Dashboard - Verdant Fields',
              user,
              farm,
              products: products.count,
              orders: orders.count,
              revenue: revenue.revenue || 0,
              recentOrders
            });
          });
        });
      });
    });
  });
});

// Farmer - Farm Profile
router.get('/farmer/farm', auth.isAuthenticated, auth.isFarmer, (req, res) => {
  const user = req.session.user;
  
  db.get('SELECT * FROM farms WHERE farmer_id = ?', [user.id], (err, farm) => {
    if (err) farm = null;
    
    res.render('dashboard/farmer-farm', {
      title: 'Farm Profile - Verdant Fields',
      user,
      farm
    });
  });
});

// Farmer - Products
router.get('/farmer/products', auth.isAuthenticated, auth.isFarmer, (req, res) => {
  const user = req.session.user;
  
  db.all('SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC', [user.id], (err, products) => {
    if (err) products = [];
    
    res.render('dashboard/farmer-products', {
      title: 'My Products - Verdant Fields',
      user,
      products
    });
  });
});

// Farmer - Add Product
router.get('/farmer/add-product', auth.isAuthenticated, auth.isFarmer, (req, res) => {
  res.render('dashboard/farmer-add-product', {
    title: 'Add Product - Verdant Fields',
    user: req.session.user
  });
});

// Farmer - Verification
router.get('/farmer/verify', auth.isAuthenticated, auth.isFarmer, (req, res) => {
  const user = req.session.user;
  
  db.get('SELECT * FROM farms WHERE farmer_id = ?', [user.id], (err, farm) => {
    if (err) farm = null;
    
    res.render('dashboard/farmer-verify', {
      title: 'Farm Verification - Verdant Fields',
      user,
      farm
    });
  });
});

// Buyer dashboard
router.get('/buyer', auth.isAuthenticated, (req, res) => {
  const user = req.session.user;
  
  // Get bulk orders
  db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND order_type = "bulk"', [user.id], (err, bulkOrders) => {
    if (err) bulkOrders = { count: 0 };
    
    // Get total orders
    db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [user.id], (err, totalOrders) => {
      if (err) totalOrders = { count: 0 };
      
      // Get saved products
      db.get('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [user.id], (err, saved) => {
        if (err) saved = { count: 0 };
        
        // Get recent purchases
        db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [user.id], (err, recentOrders) => {
          if (err) recentOrders = [];
          
          res.render('dashboard/buyer', {
            title: 'Buyer Dashboard - Verdant Fields',
            user,
            bulkOrders: bulkOrders.count,
            totalOrders: totalOrders.count,
            saved: saved.count,
            recentOrders
          });
        });
      });
    });
  });
});

// Delivery rider dashboard
router.get('/delivery', auth.isAuthenticated, auth.isRider, (req, res) => {
  const user = req.session.user;
  
  // Get assigned deliveries
  db.get('SELECT COUNT(*) as count FROM deliveries WHERE rider_id = ? AND status IN ("assigned", "picked")', [user.id], (err, assigned) => {
    if (err) assigned = { count: 0 };
    
    // Get completed deliveries
    db.get('SELECT COUNT(*) as count FROM deliveries WHERE rider_id = ? AND status = "completed"', [user.id], (err, completed) => {
      if (err) completed = { count: 0 };
      
      // Get earnings
      db.get('SELECT SUM(delivery_fee) as earnings FROM deliveries WHERE rider_id = ? AND status = "completed"', [user.id], (err, earnings) => {
        if (err) earnings = { earnings: 0 };
        
        // Get recent deliveries
        db.all('SELECT * FROM deliveries WHERE rider_id = ? ORDER BY created_at DESC LIMIT 5', [user.id], (err, recentDeliveries) => {
          if (err) recentDeliveries = [];
          
          res.render('dashboard/delivery', {
            title: 'Delivery Dashboard - Verdant Fields',
            user,
            assigned: assigned.count,
            completed: completed.count,
            earnings: earnings.earnings || 0,
            recentDeliveries
          });
        });
      });
    });
  });
});

module.exports = router;
