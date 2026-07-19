const db = require('./db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

function initDatabase() {
  console.log('🌱 Initializing Verdant Fields Database...');
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Drop existing tables if they exist (for clean setup)
  const tables = ['users', 'profiles', 'farms', 'categories', 'products', 'orders', 
                  'order_items', 'wishlist', 'cart', 'reviews', 'deliveries', 
                  'wallet_transactions', 'notifications', 'coupons', 'articles', 'audit_logs'];
  
  // Create tables in order
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      is_verified BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
      return;
    }
    console.log('✅ Users table created');
  });

  // User profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      avatar TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      bio TEXT,
      social_links TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating profiles table:', err.message);
    else console.log('✅ Profiles table created');
  });

  // Farms
  db.run(`
    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      latitude REAL,
      longitude REAL,
      size TEXT,
      organic_certified BOOLEAN DEFAULT 0,
      verified BOOLEAN DEFAULT 0,
      verification_docs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating farms table:', err.message);
    else console.log('✅ Farms table created');
  });

  // Categories
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating categories table:', err.message);
    else console.log('✅ Categories table created');
  });

  // Products
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      discount_price DECIMAL(10,2),
      stock INTEGER DEFAULT 0,
      unit TEXT,
      images TEXT,
      is_organic BOOLEAN DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'active',
      ratings_avg DECIMAL(3,2) DEFAULT 0,
      ratings_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating products table:', err.message);
    else console.log('✅ Products table created');
  });

  // Orders
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      farmer_id INTEGER,
      total_amount DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      delivery_fee DECIMAL(10,2) DEFAULT 0,
      final_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      delivery_city TEXT,
      delivery_phone TEXT,
      delivery_notes TEXT,
      scheduled_delivery DATETIME,
      delivered_at DATETIME,
      cancelled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating orders table:', err.message);
    else console.log('✅ Orders table created');
  });

  // Order items
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating order_items table:', err.message);
    else console.log('✅ Order_items table created');
  });

  // Wishlist
  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )
  `, (err) => {
    if (err) console.error('Error creating wishlist table:', err.message);
    else console.log('✅ Wishlist table created');
  });

  // Cart
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    )
  `, (err) => {
    if (err) console.error('Error creating cart table:', err.message);
    else console.log('✅ Cart table created');
  });

  // Reviews
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating reviews table:', err.message);
    else console.log('✅ Reviews table created');
  });

  // Deliveries
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER,
      status TEXT DEFAULT 'assigned',
      pickup_location TEXT,
      delivery_location TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      delivery_lat REAL,
      delivery_lng REAL,
      distance REAL,
      delivery_fee DECIMAL(10,2),
      proof_image TEXT,
      signature TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating deliveries table:', err.message);
    else console.log('✅ Deliveries table created');
  });

  // Wallet transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      reference TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating wallet_transactions table:', err.message);
    else console.log('✅ Wallet_transactions table created');
  });

  // Notifications
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT,
      is_read BOOLEAN DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating notifications table:', err.message);
    else console.log('✅ Notifications table created');
  });

  // Coupons
  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value DECIMAL(10,2) NOT NULL,
      min_order_amount DECIMAL(10,2),
      max_discount DECIMAL(10,2),
      start_date DATETIME,
      end_date DATETIME,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating coupons table:', err.message);
    else console.log('✅ Coupons table created');
  });

  // Education articles
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      category TEXT,
      author_id INTEGER,
      image TEXT,
      views INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT 1,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating articles table:', err.message);
    else console.log('✅ Articles table created');
  });

  // Audit logs
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error('Error creating audit_logs table:', err.message);
    else console.log('✅ Audit_logs table created');
  });

  console.log('✅ All database tables created successfully');
  
  // Create default admin user after tables are created
  setTimeout(() => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@verdantfields.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
      if (err) {
        console.error('Error checking admin:', err.message);
        return;
      }
      
      if (!row) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        db.run(
          'INSERT INTO users (email, password, first_name, last_name, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
          [adminEmail, hashedPassword, 'Admin', 'User', 'admin', 1],
          function(err) {
            if (err) {
              console.error('Error creating admin:', err.message);
            } else {
              console.log(`✅ Admin user created: ${adminEmail}`);
              console.log(`🔑 Password: ${adminPassword}`);
            }
          }
        );
      } else {
        console.log('✅ Admin user already exists');
      }
    });
  }, 500);
}

initDatabase();
