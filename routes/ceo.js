const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// CEO Dashboard
router.get('/', auth.isAuthenticated, auth.isCEO, (req, res) => {
  // Get all stats
  db.get('SELECT COUNT(*) as users FROM users', (err, users) => {
    if (err) users = { users: 0 };
    
    db.get('SELECT COUNT(*) as farmers FROM users WHERE role = "farmer"', (err, farmers) => {
      if (err) farmers = { farmers: 0 };
      
      db.get('SELECT COUNT(*) as customers FROM users WHERE role = "customer"', (err, customers) => {
        if (err) customers = { customers: 0 };
        
        db.get('SELECT COUNT(*) as buyers FROM users WHERE role = "buyer"', (err, buyers) => {
          if (err) buyers = { buyers: 0 };
          
          db.get('SELECT COUNT(*) as products FROM products', (err, products) => {
            if (err) products = { products: 0 };
            
            db.get('SELECT COUNT(*) as orders FROM orders', (err, orders) => {
              if (err) orders = { orders: 0 };
              
              db.get('SELECT SUM(final_amount) as revenue FROM orders WHERE status = "delivered"', (err, revenue) => {
                if (err) revenue = { revenue: 0 };
                
                db.get('SELECT AVG(ratings_avg) as avg_rating FROM products WHERE ratings_count > 0', (err, rating) => {
                  if (err) rating = { avg_rating: 0 };
                  
                  // Get monthly sales
                  db.all(`
                    SELECT strftime('%Y-%m', created_at) as month, 
                           COUNT(*) as orders,
                           SUM(final_amount) as revenue
                    FROM orders 
                    WHERE status = 'delivered'
                    GROUP BY strftime('%Y-%m', created_at)
                    ORDER BY month DESC
                    LIMIT 6
                  `, (err, monthlyData) => {
                    if (err) monthlyData = [];
                    
                    // Get top products
                    db.all(`
                      SELECT p.name, p.id, COUNT(oi.id) as order_count, SUM(oi.total) as total_revenue
                      FROM order_items oi
                      LEFT JOIN products p ON oi.product_id = p.id
                      GROUP BY oi.product_id
                      ORDER BY total_revenue DESC
                      LIMIT 5
                    `, (err, topProducts) => {
                      if (err) topProducts = [];
                      
                      res.render('ceo/index', {
                        title: 'CEO Dashboard - Verdant Fields',
                        user: req.session.user,
                        stats: {
                          users: users.users || 0,
                          farmers: farmers.farmers || 0,
                          customers: customers.customers || 0,
                          buyers: buyers.buyers || 0,
                          products: products.products || 0,
                          orders: orders.orders || 0,
                          revenue: revenue.revenue || 0,
                          avgRating: rating.avg_rating || 0
                        },
                        monthlyData,
                        topProducts
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
