const db = require('./db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

// Sample users data
const users = [
  {
    email: 'customer@verdantfields.com',
    password: 'customer123',
    first_name: 'John',
    last_name: 'Customer',
    phone: '+1 234 567 8901',
    role: 'customer',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'farmer1@verdantfields.com',
    password: 'farmer123',
    first_name: 'James',
    last_name: 'Farmer',
    phone: '+1 234 567 8902',
    role: 'farmer',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'farmer2@verdantfields.com',
    password: 'farmer123',
    first_name: 'Mary',
    last_name: 'Agricola',
    phone: '+1 234 567 8903',
    role: 'farmer',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'buyer@verdantfields.com',
    password: 'buyer123',
    first_name: 'Robert',
    last_name: 'Buyer',
    phone: '+1 234 567 8904',
    role: 'buyer',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'rider@verdantfields.com',
    password: 'rider123',
    first_name: 'Michael',
    last_name: 'Rider',
    phone: '+1 234 567 8905',
    role: 'delivery_rider',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'warehouse@verdantfields.com',
    password: 'warehouse123',
    first_name: 'Sarah',
    last_name: 'Warehouse',
    phone: '+1 234 567 8906',
    role: 'warehouse_staff',
    is_verified: 1,
    is_active: 1
  },
  {
    email: 'ceo@verdantfields.com',
    password: 'ceo123',
    first_name: 'David',
    last_name: 'CEO',
    phone: '+1 234 567 8907',
    role: 'ceo',
    is_verified: 1,
    is_active: 1
  }
];

// Sample farms
const farms = [
  {
    farmer_id: 2, // James Farmer
    name: 'Green Valley Farm',
    description: 'Organic vegetable farm specializing in tomatoes, peppers, and leafy greens.',
    address: '123 Valley Road',
    city: 'Green Valley',
    state: 'CA',
    country: 'USA',
    size: '50 acres',
    organic_certified: 1,
    verified: 1
  },
  {
    farmer_id: 3, // Mary Agricola
    name: 'Sunshine Organic Farm',
    description: 'Certified organic fruit farm with apples, oranges, and berries.',
    address: '456 Sunshine Lane',
    city: 'Sunshine Valley',
    state: 'FL',
    country: 'USA',
    size: '75 acres',
    organic_certified: 1,
    verified: 1
  }
];

// Sample products
const products = [
  {
    farmer_id: 2,
    category_id: 1,
    name: 'Organic Tomatoes',
    slug: 'organic-tomatoes',
    description: 'Fresh, juicy organic tomatoes grown in our green valley farm.',
    price: 4.99,
    discount_price: null,
    stock: 100,
    unit: 'kg',
    is_organic: 1,
    is_featured: 1,
    status: 'active'
  },
  {
    farmer_id: 2,
    category_id: 1,
    name: 'Bell Peppers',
    slug: 'bell-peppers',
    description: 'Colorful bell peppers, perfect for salads and cooking.',
    price: 3.99,
    discount_price: 2.99,
    stock: 80,
    unit: 'kg',
    is_organic: 1,
    is_featured: 0,
    status: 'active'
  },
  {
    farmer_id: 3,
    category_id: 2,
    name: 'Organic Apples',
    slug: 'organic-apples',
    description: 'Sweet and crisp organic apples from our orchard.',
    price: 5.99,
    discount_price: null,
    stock: 150,
    unit: 'kg',
    is_organic: 1,
    is_featured: 1,
    status: 'active'
  },
  {
    farmer_id: 3,
    category_id: 2,
    name: 'Fresh Strawberries',
    slug: 'fresh-strawberries',
    description: 'Sweet, ripe strawberries picked at peak freshness.',
    price: 6.99,
    discount_price: 5.99,
    stock: 60,
    unit: 'kg',
    is_organic: 1,
    is_featured: 1,
    status: 'active'
  }
];

// Sample categories
const categories = [
  { name: 'Vegetables', slug: 'vegetables', description: 'Fresh vegetables', icon: 'fa-carrot' },
  { name: 'Fruits', slug: 'fruits', description: 'Fresh fruits', icon: 'fa-apple-alt' },
  { name: 'Organic Foods', slug: 'organic', description: 'Organic food products', icon: 'fa-leaf' },
  { name: 'Seeds', slug: 'seeds', description: 'Quality seeds', icon: 'fa-seedling' },
  { name: 'Livestock', slug: 'livestock', description: 'Farm animals', icon: 'fa-horse' },
  { name: 'Dairy', slug: 'dairy', description: 'Fresh dairy products', icon: 'fa-cheese' },
  { name: 'Beverages', slug: 'beverages', description: 'Fresh beverages', icon: 'fa-wine-bottle' },
  { name: 'Equipment', slug: 'equipment', description: 'Farm equipment', icon: 'fa-tractor' }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...');
  
  try {
    // Insert categories
    console.log('📝 Inserting categories...');
    for (const category of categories) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
        [category.name, category.slug, category.description, category.icon]
      );
    }
    console.log('✅ Categories inserted');
    
    // Insert users
    console.log('📝 Inserting users...');
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.runAsync(
        `INSERT OR IGNORE INTO users 
        (email, password, first_name, last_name, phone, role, is_verified, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.email, hashedPassword, user.first_name, user.last_name, 
         user.phone, user.role, user.is_verified, user.is_active]
      );
    }
    console.log('✅ Users inserted');
    
    // Get farmer IDs for farms
    const farmer1 = await db.getAsync('SELECT id FROM users WHERE email = ?', ['farmer1@verdantfields.com']);
    const farmer2 = await db.getAsync('SELECT id FROM users WHERE email = ?', ['farmer2@verdantfields.com']);
    
    // Insert farms
    console.log('📝 Inserting farms...');
    if (farmer1) {
      await db.runAsync(
        `INSERT OR IGNORE INTO farms 
        (farmer_id, name, description, address, city, state, country, size, organic_certified, verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [farmer1.id, farms[0].name, farms[0].description, farms[0].address, 
         farms[0].city, farms[0].state, farms[0].country, farms[0].size, 
         farms[0].organic_certified, farms[0].verified]
      );
    }
    
    if (farmer2) {
      await db.runAsync(
        `INSERT OR IGNORE INTO farms 
        (farmer_id, name, description, address, city, state, country, size, organic_certified, verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [farmer2.id, farms[1].name, farms[1].description, farms[1].address, 
         farms[1].city, farms[1].state, farms[1].country, farms[1].size, 
         farms[1].organic_certified, farms[1].verified]
      );
    }
    console.log('✅ Farms inserted');
    
    // Get category IDs
    const vegCategory = await db.getAsync('SELECT id FROM categories WHERE slug = ?', ['vegetables']);
    const fruitCategory = await db.getAsync('SELECT id FROM categories WHERE slug = ?', ['fruits']);
    
    // Insert products
    console.log('📝 Inserting products...');
    const farmer1Id = farmer1 ? farmer1.id : 2;
    const farmer2Id = farmer2 ? farmer2.id : 3;
    
    const productsData = [
      {
        ...products[0],
        farmer_id: farmer1Id,
        category_id: vegCategory ? vegCategory.id : 1
      },
      {
        ...products[1],
        farmer_id: farmer1Id,
        category_id: vegCategory ? vegCategory.id : 1
      },
      {
        ...products[2],
        farmer_id: farmer2Id,
        category_id: fruitCategory ? fruitCategory.id : 2
      },
      {
        ...products[3],
        farmer_id: farmer2Id,
        category_id: fruitCategory ? fruitCategory.id : 2
      }
    ];
    
    for (const product of productsData) {
      await db.runAsync(
        `INSERT OR IGNORE INTO products 
        (farmer_id, category_id, name, slug, description, price, discount_price, 
         stock, unit, is_organic, is_featured, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.farmer_id, product.category_id, product.name, product.slug, 
         product.description, product.price, product.discount_price, 
         product.stock, product.unit, product.is_organic, 
         product.is_featured, product.status]
      );
    }
    console.log('✅ Products inserted');
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin: admin@verdantfields.com / admin123');
    console.log('👤 Customer: customer@verdantfields.com / customer123');
    console.log('🌾 Farmer 1: farmer1@verdantfields.com / farmer123');
    console.log('🌾 Farmer 2: farmer2@verdantfields.com / farmer123');
    console.log('🛒 Buyer: buyer@verdantfields.com / buyer123');
    console.log('🚚 Rider: rider@verdantfields.com / rider123');
    console.log('🏭 Warehouse: warehouse@verdantfields.com / warehouse123');
    console.log('👔 CEO: ceo@verdantfields.com / ceo123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    db.close();
  }
}

// Run the seed
seedDatabase();
