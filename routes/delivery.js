const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// Delivery dashboard
router.get('/', auth.isAuthenticated, auth.isRider, (req, res) => {
  const userId = req.session.user.id;
  
  db.all(`
    SELECT d.*, o.order_number, o.delivery_address, o.delivery_city,
           u.first_name, u.last_name, u.phone
    FROM deliveries d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE d.rider_id = ?
    ORDER BY d.created_at DESC
  `, [userId], (err, deliveries) => {
    if (err) deliveries = [];
    
    res.render('delivery/index', {
      title: 'Delivery Dashboard - Verdant Fields',
      user: req.session.user,
      deliveries
    });
  });
});

// Update delivery status
router.post('/:id/status', auth.isAuthenticated, auth.isRider, (req, res) => {
  const deliveryId = req.params.id;
  const { status, proof_image } = req.body;
  
  const updates = { status };
  if (status === 'picked') updates.started_at = new Date().toISOString();
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    if (proof_image) updates.proof_image = proof_image;
  }
  
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(deliveryId);
  
  db.run(`UPDATE deliveries SET ${setClause} WHERE id = ?`, values, function(err) {
    if (err) {
      req.flash('error', 'Failed to update delivery status');
    } else {
      // Update order status if delivery completed
      if (status === 'completed') {
        db.get('SELECT order_id FROM deliveries WHERE id = ?', [deliveryId], (err, result) => {
          if (!err && result) {
            db.run('UPDATE orders SET status = "delivered", delivered_at = datetime("now") WHERE id = ?', [result.order_id]);
          }
        });
      }
      req.flash('success', 'Delivery status updated');
    }
    res.redirect('/delivery');
  });
});

module.exports = router;
