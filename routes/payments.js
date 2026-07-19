const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// Payment methods
router.get('/methods', auth.isAuthenticated, (req, res) => {
  res.render('payments/methods', {
    title: 'Payment Methods - Verdant Fields',
    user: req.session.user
  });
});

// Wallet
router.get('/wallet', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  db.get(`
    SELECT SUM(amount) as balance 
    FROM wallet_transactions 
    WHERE user_id = ? AND status = 'completed'
  `, [userId], (err, wallet) => {
    if (err) wallet = { balance: 0 };
    
    db.all(`
      SELECT * FROM wallet_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [userId], (err, transactions) => {
      if (err) transactions = [];
      
      res.render('payments/wallet', {
        title: 'Wallet - Verdant Fields',
        user: req.session.user,
        balance: wallet.balance || 0,
        transactions
      });
    });
  });
});

// Fund wallet
router.post('/wallet/fund', auth.isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { amount, payment_method } = req.body;
  
  if (!amount || amount <= 0) {
    req.flash('error', 'Invalid amount');
    return res.redirect('/payments/wallet');
  }
  
  const reference = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  
  db.run(`
    INSERT INTO wallet_transactions (user_id, amount, type, description, reference, status)
    VALUES (?, ?, 'deposit', ?, ?, 'completed')
  `, [userId, amount, `Wallet funding via ${payment_method}`, reference], function(err) {
    if (err) {
      req.flash('error', 'Failed to fund wallet');
    } else {
      req.flash('success', 'Wallet funded successfully!');
    }
    res.redirect('/payments/wallet');
  });
});

module.exports = router;
