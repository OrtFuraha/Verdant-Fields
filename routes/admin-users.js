const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middlewares/auth');

// Get all users
router.get('/api/users', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const users = await db.allAsync('SELECT id, email, first_name, last_name, phone, role, is_verified, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
router.get('/api/users/:id', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const user = await db.getAsync('SELECT id, email, first_name, last_name, phone, role, is_verified, is_active, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user role
router.put('/api/users/:id/role', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'farmer', 'buyer', 'delivery_rider', 'warehouse_staff', 'admin', 'ceo'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    
    await db.runAsync('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle user active status
router.put('/api/users/:id/toggle', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const user = await db.getAsync('SELECT is_active FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const newStatus = user.is_active ? 0 : 1;
    await db.runAsync('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, message: 'User status toggled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all farmers with their farms
router.get('/api/farmers', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const farmers = await db.allAsync(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
             f.id as farm_id, f.name as farm_name, f.description, f.city, f.state, f.size, 
             f.organic_certified, f.verified as farm_verified
      FROM users u
      LEFT JOIN farms f ON u.id = f.farmer_id
      WHERE u.role = 'farmer'
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, farmers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get farmer by ID with farm details
router.get('/api/farmers/:id', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const farmer = await db.getAsync(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
             f.id as farm_id, f.name as farm_name, f.description, f.address, f.city, f.state, 
             f.country, f.size, f.organic_certified, f.verified as farm_verified,
             COUNT(p.id) as product_count
      FROM users u
      LEFT JOIN farms f ON u.id = f.farmer_id
      LEFT JOIN products p ON u.id = p.farmer_id
      WHERE u.id = ? AND u.role = 'farmer'
      GROUP BY u.id
    `, [req.params.id]);
    
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    
    // Get farmer's products
    const products = await db.allAsync('SELECT id, name, price, stock, status FROM products WHERE farmer_id = ?', [req.params.id]);
    
    res.json({ success: true, farmer, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify farmer
router.put('/api/farmers/:id/verify', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const { verified } = req.body;
    
    // Update farm verification
    await db.runAsync('UPDATE farms SET verified = ? WHERE farmer_id = ?', [verified ? 1 : 0, req.params.id]);
    
    // Update user verification
    await db.runAsync('UPDATE users SET is_verified = ? WHERE id = ?', [verified ? 1 : 0, req.params.id]);
    
    res.json({ success: true, message: 'Farmer verification updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
