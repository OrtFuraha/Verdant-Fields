const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// My orders
router.get('/', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  db.all(`
    SELECT o.*, COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [userId], (err, orders) => {
    if (err) orders = [];
    
    res.render('orders/list', {
      title: 'My Orders - Verdant Fields',
      user: req.session.user,
      orders
    });
  });
});

// Order details
router.get('/:id', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const orderId = req.params.id;
  
  db.get(`
    SELECT o.*, u.first_name, u.last_name
    FROM orders o
    LEFT JOIN users u ON o.farmer_id = u.id
    WHERE o.id = ? AND o.user_id = ?
  `, [orderId, userId], (err, order) => {
    if (err || !order) {
      req.flash('error', 'Order not found');
      return res.redirect('/orders');
    }
    
    db.all(`
      SELECT oi.*, p.name, p.images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId], (err, items) => {
      if (err) items = [];
      
      // Get delivery info
      db.get('SELECT * FROM deliveries WHERE order_id = ?', [orderId], (err, delivery) => {
        if (err) delivery = null;
        
        res.render('orders/details', {
          title: `Order #${order.order_number}`,
          user: req.session.user,
          order,
          items,
          delivery
        });
      });
    });
  });
});

// Cancel order
router.post('/:id/cancel', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const orderId = req.params.id;
  
  db.run(
    'UPDATE orders SET status = "cancelled", cancelled_at = datetime("now") WHERE id = ? AND user_id = ? AND status = "pending"',
    [orderId, userId],
    function(err) {
      if (err || this.changes === 0) {
        req.flash('error', 'Cannot cancel this order');
      } else {
        req.flash('success', 'Order cancelled successfully');
      }
      res.redirect(`/orders/${orderId}`);
    }
  );
});

module.exports = router;
