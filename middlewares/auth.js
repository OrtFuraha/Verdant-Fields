const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authMiddleware = {
  // Check if user is authenticated
  isAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error', 'Please login to continue');
    res.redirect('/auth/login');
  },

  // Check if user is logged in (for API)
  verifyToken: (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  // Role-based access control
  hasRole: (roles) => {
    return (req, res, next) => {
      if (!req.session.user) {
        req.flash('error', 'Please login first');
        return res.redirect('/auth/login');
      }

      if (!roles.includes(req.session.user.role)) {
        req.flash('error', 'You do not have permission to access this page');
        return res.redirect('/');
      }

      next();
    };
  },

  // Check if user is admin
  isAdmin: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    req.flash('error', 'Admin access required');
    res.redirect('/');
  },

  // Check if user is CEO
  isCEO: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'ceo') {
      return next();
    }
    req.flash('error', 'CEO access required');
    res.redirect('/');
  },

  // Check if user is farmer
  isFarmer: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'farmer') {
      return next();
    }
    req.flash('error', 'Farmer access required');
    res.redirect('/');
  },

  // Check if user is delivery rider
  isRider: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'delivery_rider') {
      return next();
    }
    req.flash('error', 'Delivery rider access required');
    res.redirect('/');
  },

  // Check if user is warehouse staff
  isWarehouse: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'warehouse_staff') {
      return next();
    }
    req.flash('error', 'Warehouse staff access required');
    res.redirect('/');
  }
};

module.exports = authMiddleware;
