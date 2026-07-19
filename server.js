const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const flash = require('connect-flash');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8880;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(flash());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database
const db = require('./database/db');

// Routes
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const martRoutes = require('./routes/mart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes = require('./routes/admin');
const ceoRoutes = require('./routes/ceo');
const pagesRoutes = require('./routes/pages');
const categoryRoutes = require('./routes/categories');
const adminUsersRoutes = require('./routes/admin-users');

// Use routes
app.use('/', homeRoutes);
app.use('/', pagesRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);
app.use('/mart', martRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminUsersRoutes);
app.use('/ceo', ceoRoutes);
app.use('/', categoryRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    user: req.session.user || null
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌾 Verdant Fields running on http://localhost:${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
});

module.exports = app;
