const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { body, validationResult } = require('express-validator');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    title: 'Login - Verdant Fields',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// Login process
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Please check your input');
    return res.redirect('/auth/login');
  }

  const { email, password, remember } = req.body;

  try {
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    if (!user.is_active) {
      req.flash('error', 'Your account has been deactivated');
      return res.redirect('/auth/login');
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_verified: user.is_verified
    };

    // Set cookie if remember me
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    req.flash('success', 'Welcome back!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred');
    res.redirect('/auth/login');
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', { 
    title: 'Register - Verdant Fields',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// Register process
router.post('/register', [
  body('first_name').trim().isLength({ min: 2 }),
  body('last_name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('confirm_password').custom((value, { req }) => value === req.body.password)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Please check your input');
    return res.redirect('/auth/register');
  }

  const { first_name, last_name, email, password, phone, role } = req.body;

  try {
    // Check if email exists
    const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.runAsync(
      'INSERT INTO users (email, password, first_name, last_name, phone, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, phone, role || 'customer', 1]
    );

    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred');
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password - Verdant Fields',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// Forgot password process
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Please enter a valid email');
    return res.redirect('/auth/forgot-password');
  }

  const { email } = req.body;

  try {
    const user = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    
    if (!user) {
      req.flash('error', 'Email not found');
      return res.redirect('/auth/forgot-password');
    }

    // Generate reset token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const expiry = new Date(Date.now() + 3600000);

    await db.runAsync(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [token, expiry.toISOString(), user.id]
    );

    req.flash('success', 'Password reset link sent to your email');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred');
    res.redirect('/auth/forgot-password');
  }
});

// Reset password page
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await db.getAsync(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")',
      [token]
    );

    if (!user) {
      req.flash('error', 'Invalid or expired reset token');
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Reset Password - Verdant Fields',
      token,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred');
    res.redirect('/auth/forgot-password');
  }
});

// Reset password process
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }),
  body('confirm_password').custom((value, { req }) => value === req.body.password)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Please check your input');
    return res.redirect(`/auth/reset-password/${req.params.token}`);
  }

  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await db.getAsync(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")',
      [token]
    );

    if (!user) {
      req.flash('error', 'Invalid or expired reset token');
      return res.redirect('/auth/forgot-password');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.runAsync(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    req.flash('success', 'Password reset successfully! Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred');
    res.redirect(`/auth/reset-password/${token}`);
  }
});

module.exports = router;
