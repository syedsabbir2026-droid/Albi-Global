# Albi Global - Complete Project Plan & Implementation Guide

## 📋 Project Overview

**Project Name**: Albi Global
**Type**: Full-Stack E-Commerce Marketplace
**Scope**: Complete MVP with all core features
**Duration**: 12-16 weeks (estimate)
**Team Size**: 8-12 developers
**Target Users**: Millions (scalable)

---

## 🎯 Phase 1: Foundation Setup (Weeks 1-2)

### 1.1 Project Infrastructure

#### Backend Setup
- [ ] Initialize Node.js/Express API Gateway
- [ ] Setup PostgreSQL database schema
- [ ] Configure Redis for caching
- [ ] Setup JWT authentication middleware
- [ ] Configure environment variables
- [ ] Setup logging system (Winston/Morgan)
- [ ] Setup error handling middleware
- [ ] Configure CORS and security headers

#### Frontend Setup
- [ ] Initialize React Native project (Expo/Bare)
- [ ] Setup Next.js for web dashboard
- [ ] Configure Redux/Zustand for state management
- [ ] Setup API client (Axios/TanStack Query)
- [ ] Configure environment variables
- [ ] Setup Material Design components

#### DevOps Setup
- [ ] Initialize Docker setup
- [ ] Create docker-compose for local development
- [ ] Setup GitHub Actions CI/CD
- [ ] Configure linting and formatting (ESLint, Prettier)
- [ ] Setup pre-commit hooks

### 1.2 Database Schema Design

#### Core Tables
```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  phone VARCHAR UNIQUE,
  password_hash VARCHAR,
  full_name VARCHAR,
  profile_image_url VARCHAR,
  bio TEXT,
  user_type ENUM('customer', 'seller', 'delivery_partner', 'admin'),
  status ENUM('active', 'inactive', 'suspended', 'banned'),
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_method ENUM('sms', 'email', 'authenticator_app'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Sellers Table
CREATE TABLE sellers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  store_name VARCHAR,
  store_description TEXT,
  store_image_url VARCHAR,
  business_license VARCHAR,
  verification_status ENUM('pending', 'approved', 'rejected'),
  verified_badge BOOLEAN DEFAULT false,
  rating DECIMAL(3,2),
  total_reviews INT,
  commission_percentage DECIMAL(5,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id),
  title VARCHAR,
  description TEXT,
  category_id UUID,
  price DECIMAL(12,2),
  discount_percentage DECIMAL(5,2),
  stock_quantity INT,
  sku VARCHAR UNIQUE,
  images JSON,
  videos JSON,
  rating DECIMAL(3,2),
  total_reviews INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR UNIQUE,
  customer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES sellers(id),
  total_amount DECIMAL(12,2),
  commission_amount DECIMAL(12,2),
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
  payment_status ENUM('pending', 'completed', 'failed', 'refunded'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(12,2),
  payment_method ENUM('card', 'wallet', 'cod', 'bank_transfer'),
  transaction_id VARCHAR,
  status ENUM('pending', 'success', 'failed'),
  created_at TIMESTAMP
);

-- Admin Wallets (3 separate income streams)
CREATE TABLE admin_wallets (
  id UUID PRIMARY KEY,
  wallet_type ENUM('commission', 'business_plan', 'ai_service'),
  balance DECIMAL(18,2) DEFAULT 0,
  total_earned DECIMAL(18,2) DEFAULT 0,
  last_withdrawal_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🔐 Phase 2: Authentication & Security (Weeks 3-4)

### 2.1 User Authentication

#### Implementation
- [ ] Email/Password registration and login
- [ ] Social login integration (Google, Facebook)
- [ ] Phone OTP verification
- [ ] JWT token generation and refresh
- [ ] Password hashing with bcrypt
- [ ] Email verification
- [ ] Password reset functionality

#### Code Example
```javascript
// auth-service/controllers/authController.js
const register = async (req, res) => {
  try {
    const { email, password, phone, fullName } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      phone,
      fullName,
      userType: 'customer'
    });
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    res.status(201).json({
      success: true,
      user,
      tokens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 2.2 Two-Factor Authentication (2FA)

#### Implementation
- [ ] SMS-based 2FA
- [ ] Email-based 2FA
- [ ] Authenticator app (Google Authenticator)
- [ ] Backup codes
- [ ] Device tracking
- [ ] Login history

#### Database Table
```sql
CREATE TABLE two_factor_auth (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  method ENUM('sms', 'email', 'authenticator_app'),
  secret_key VARCHAR,
  backup_codes JSON,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE login_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ip_address VARCHAR,
  device_fingerprint VARCHAR,
  device_name VARCHAR,
  login_time TIMESTAMP,
  logout_time TIMESTAMP,
  user_agent TEXT
);
```

### 2.3 Role-Based Access Control (RBAC)

#### Middleware Implementation
```javascript
// middleware/rbac.js
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.post('/admin/users', requireRole(['admin']), adminController.getUsers);
router.post('/seller/products', requireRole(['seller']), sellerController.addProduct);
```

---

## 🛒 Phase 3: Product & Shopping Features (Weeks 5-6)

### 3.1 Product Catalog

#### Implementation
- [ ] Product model and schema
- [ ] Category management
- [ ] Product search functionality
- [ ] Smart filters (price, rating, brand, etc.)
- [ ] Product details page
- [ ] Image/video upload
- [ ] Reviews and ratings

#### Product Controller Example
```javascript
// product-service/controllers/productController.js
const searchProducts = async (req, res) => {
  try {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      rating,
      sortBy = 'popularity',
      page = 1,
      limit = 20
    } = req.query;
    
    let filter = {};
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    if (category) filter.category_id = category;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }
    
    if (rating) {
      filter.rating = { $gte: rating };
    }
    
    const sortOptions = {
      'popularity': { sold_count: -1 },
      'rating': { rating: -1 },
      'newest': { created_at: -1 },
      'price_low': { price: 1 },
      'price_high': { price: -1 }
    };
    
    const products = await Product.find(filter)
      .sort(sortOptions[sortBy])
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      products,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: products.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3.2 Shopping Cart

#### Database Schema
```sql
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  items JSON,
  subtotal DECIMAL(12,2),
  discount_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Cart Operations
```javascript
// Add item to cart
const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;
  
  let cart = await Cart.findOne({ user_id: userId });
  
  if (!cart) {
    cart = await Cart.create({ user_id: userId, items: [] });
  }
  
  const existingItem = cart.items.find(item => item.product_id === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product_id: productId, quantity });
  }
  
  await cart.save();
  res.json({ success: true, cart });
};
```

### 3.3 Wishlist

#### Implementation
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, product_id)
);
```

---

## 💳 Phase 4: Payment & Orders (Weeks 7-8)

### 4.1 Payment Gateway Integration

#### Supported Methods
- [ ] Credit/Debit Cards (Stripe)
- [ ] Mobile Wallets (Bkash, Nagad)
- [ ] Cash on Delivery (COD)
- [ ] Bank Transfer
- [ ] User Wallet

#### Implementation
```javascript
// payment-service/controllers/paymentController.js
const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    
    let transaction;
    
    switch(paymentMethod) {
      case 'card':
        transaction = await stripePayment(amount);
        break;
      case 'bkash':
        transaction = await bkashPayment(amount);
        break;
      case 'cod':
        transaction = { status: 'pending', method: 'cod' };
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    const payment = await Payment.create({
      order_id: orderId,
      amount,
      payment_method: paymentMethod,
      transaction_id: transaction.id,
      status: 'success'
    });
    
    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      payment_status: 'completed'
    });
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 4.2 Order Management

#### Order Lifecycle
```
Pending → Confirmed → Shipped → Delivered → Completed
         ↓
         Cancelled
```

#### Implementation
```javascript
const createOrder = async (req, res) => {
  try {
    const { cartId, deliveryAddressId, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Get cart
    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    
    // Get products and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of cart.items) {
      const product = await Product.findById(item.product_id);
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product_id: product.id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemTotal
      });
    }
    
    // Calculate commission
    const commission = (totalAmount * COMMISSION_PERCENTAGE) / 100;
    
    // Create order
    const order = await Order.create({
      customer_id: userId,
      items: orderItems,
      total_amount: totalAmount,
      commission_amount: commission,
      payment_method: paymentMethod,
      delivery_address_id: deliveryAddressId,
      status: 'pending',
      payment_status: 'pending'
    });
    
    // Clear cart
    await Cart.deleteOne({ _id: cartId });
    
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 4.3 Wallet System

#### Database Schema
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  balance DECIMAL(18,2) DEFAULT 0,
  total_earned DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID REFERENCES user_wallets(id),
  type ENUM('credit', 'debit'),
  amount DECIMAL(18,2),
  description VARCHAR,
  reference_type VARCHAR,
  reference_id VARCHAR,
  created_at TIMESTAMP
);
```

---

## 🚚 Phase 5: Location & Delivery (Weeks 9-10)

### 5.1 Location Services

#### Implementation
- [ ] Google Maps integration
- [ ] Geolocation API
- [ ] Address autocomplete
- [ ] Distance calculation
- [ ] Route optimization

#### Code Example
```javascript
// location-service/controllers/locationController.js
const calculateDeliveryCharge = async (req, res) => {
  try {
    const { sellerId, customerId } = req.body;
    
    // Get seller location
    const seller = await Seller.findById(sellerId);
    const sellerLocation = seller.store_location;
    
    // Get customer location
    const customer = await User.findById(customerId);
    const address = await Address.findById(customer.default_address_id);
    const customerLocation = address.location;
    
    // Calculate distance using Google Maps API
    const distance = await calculateDistance(
      sellerLocation,
      customerLocation
    );
    
    // Calculate charge based on distance
    let deliveryCharge = BASE_DELIVERY_CHARGE;
    if (distance > 5) {
      deliveryCharge += (Math.ceil((distance - 5) / 1)) * DISTANCE_MULTIPLIER;
    }
    
    res.json({
      success: true,
      distance,
      deliveryCharge
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 5.2 Real-time Tracking

#### WebSocket Implementation
```javascript
// Using Socket.io for real-time tracking
io.on('connection', (socket) => {
  socket.on('track_order', (orderId) => {
    const order = getOrder(orderId);
    socket.join(`order_${orderId}`);
    
    socket.on('delivery_location_update', (location) => {
      // Update delivery location
      updateDeliveryLocation(orderId, location);
      
      // Broadcast to customer
      io.to(`order_${orderId}`).emit('location_update', {
        orderId,
        location,
        timestamp: new Date()
      });
    });
  });
});
```

---

## 👨‍💼 Phase 6: Seller System (Weeks 11-12)

### 6.1 Seller Registration & Verification

#### Implementation
```javascript
const registerSeller = async (req, res) => {
  try {
    const { storeName, businessLicense, bankAccount } = req.body;
    const userId = req.user.id;
    
    // Check if user already a seller
    const existingSeller = await Seller.findOne({ user_id: userId });
    if (existingSeller) {
      return res.status(409).json({ error: 'User already registered as seller' });
    }
    
    // Create seller
    const seller = await Seller.create({
      user_id: userId,
      store_name: storeName,
      business_license: businessLicense,
      bank_account: bankAccount,
      verification_status: 'pending'
    });
    
    // Create seller wallet
    await SellerWallet.create({
      seller_id: seller.id,
      balance: 0
    });
    
    res.status(201).json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 6.2 Product Management for Sellers

#### Add Product
```javascript
const addProduct = async (req, res) => {
  try {
    const { title, description, price, category, images } = req.body;
    const sellerId = req.user.seller_id;
    
    // Verify seller
    const seller = await Seller.findById(sellerId);
    if (seller.verification_status !== 'approved') {
      return res.status(403).json({ error: 'Seller not verified' });
    }
    
    // Upload images
    const uploadedImages = await Promise.all(
      images.map(img => uploadToS3(img))
    );
    
    // Create product
    const product = await Product.create({
      seller_id: sellerId,
      title,
      description,
      price,
      category_id: category,
      images: uploadedImages,
      sku: generateSKU()
    });
    
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 6.3 Seller Dashboard Analytics

#### Database Queries
```javascript
const getSalesReport = async (req, res) => {
  try {
    const sellerId = req.user.seller_id;
    const { startDate, endDate } = req.query;
    
    const sales = await Order.aggregate([
      {
        $match: {
          seller_id: ObjectId(sellerId),
          created_at: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          totalSales: { $sum: '$total_amount' },
          commission: { $sum: '$commission_amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🤖 Phase 7: AI Features (Weeks 13-14)

### 7.1 AI Product Recommendations

#### Implementation with TensorFlow/PyTorch
```python
# ai-service/recommendation_engine.py
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Embedding, Flatten, Dense
import numpy as np

class RecommendationEngine:
    def __init__(self):
        self.model = self.build_model()
    
    def build_model(self):
        # Collaborative filtering model
        user_input = Input(shape=(1,))
        user_embedding = Embedding(10000, 50)(user_input)
        user_vec = Flatten()(user_embedding)
        
        product_input = Input(shape=(1,))
        product_embedding = Embedding(100000, 50)(product_input)
        product_vec = Flatten()(product_embedding)
        
        concat = concatenate([user_vec, product_vec])
        dense1 = Dense(256, activation='relu')(concat)
        dense2 = Dense(128, activation='relu')(dense1)
        output = Dense(1, activation='sigmoid')(dense2)
        
        model = Model(inputs=[user_input, product_input], outputs=output)
        model.compile(optimizer='adam', loss='binary_crossentropy')
        return model
    
    def get_recommendations(self, user_id, num_recommendations=10):
        # Get user interaction history
        user_history = get_user_interactions(user_id)
        
        # Get all products
        all_products = get_all_products()
        
        # Predict scores
        scores = []
        for product in all_products:
            score = self.model.predict([[user_id], [product.id]])[0][0]
            scores.append((product.id, score))
        
        # Sort by score and return top N
        recommendations = sorted(scores, key=lambda x: x[1], reverse=True)[:num_recommendations]
        return recommendations
```

### 7.2 AI Chatbot

#### Integration with OpenAI
```javascript
// ai-service/chatbot.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const handleChatMessage = async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    const systemPrompt = `You are Albi Global AI Assistant. You help customers with:
    - Product search and recommendations
    - Order tracking
    - Return requests
    - Payment issues
    - General inquiries
    Always be helpful and professional.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const assistantMessage = response.choices[0].message.content;
    
    // Save conversation
    await ChatConversation.create({
      user_id: userId,
      user_message: message,
      ai_response: assistantMessage,
      context: context
    });
    
    res.json({ success: true, response: assistantMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 7.3 AI Translation

#### Google Translate API Integration
```javascript
// ai-service/translation.js
const translate = require('@google-cloud/translate').v2;

const translateText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    const result = await translate.translate(text, {
      to: targetLanguage
    });
    
    const translatedText = Array.isArray(result) ? result[0] : result;
    
    // Log translation for analytics
    await TranslationLog.create({
      original_text: text,
      translated_text: translatedText,
      target_language: targetLanguage
    });
    
    res.json({ success: true, translation: translatedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 👨‍💼 Phase 8: Admin Control Panel (Weeks 15-16)

### 8.1 Admin Dashboard

#### Key Metrics
```javascript
// admin-service/controllers/dashboardController.js
const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Revenue metrics
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: thirtyDaysAgo },
          payment_status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    
    // User metrics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });
    
    // Seller metrics
    const totalSellers = await Seller.countDocuments();
    const pendingSellerVerifications = await Seller.countDocuments({
      verification_status: 'pending'
    });
    
    // Order metrics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: 'pending'
    });
    
    // Commission earned (3 income streams)
    const commissionWallet = await AdminWallet.findOne({
      wallet_type: 'commission'
    });
    const businessPlanWallet = await AdminWallet.findOne({
      wallet_type: 'business_plan'
    });
    const aiServiceWallet = await AdminWallet.findOne({
      wallet_type: 'ai_service'
    });
    
    res.json({
      success: true,
      metrics: {
        revenue: totalRevenue[0]?.total || 0,
        users: totalUsers,
        newUsers: newUsersThisMonth,
        sellers: totalSellers,
        pendingVerifications: pendingSellerVerifications,
        orders: totalOrders,
        pendingOrders,
        wallets: {
          commission: commissionWallet?.balance || 0,
          businessPlan: businessPlanWallet?.balance || 0,
          aiService: aiServiceWallet?.balance || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 8.2 User Management

#### Admin Operations
```javascript
const suspendUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    await User.findByIdAndUpdate(userId, {
      status: 'suspended'
    });
    
    // Log action
    await AdminActionLog.create({
      admin_id: req.user.id,
      action: 'suspend_user',
      target_id: userId,
      reason: reason,
      timestamp: new Date()
    });
    
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 8.3 Seller Verification

#### Verification Process
```javascript
const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.body;
    
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        verification_status: 'approved',
        verified_badge: true
      },
      { new: true }
    );
    
    // Notify seller
    await sendNotification(seller.user_id, {
      title: 'Seller Verification Approved',
      message: 'Your seller account has been approved!'
    });
    
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 📊 Revenue System - Detailed Implementation

### Income Stream 1: Seller Commission

```javascript
const calculateAndCreditCommission = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    
    // Get commission percentage from admin settings
    const settings = await AdminSettings.findOne();
    const commissionPercentage = settings.seller_commission_percentage || 10;
    
    // Calculate commission
    const commission = (order.total_amount * commissionPercentage) / 100;
    
    // Credit to admin commission wallet
    const commissionWallet = await AdminWallet.findOne({
      wallet_type: 'commission'
    });
    
    commissionWallet.balance += commission;
    commissionWallet.total_earned += commission;
    await commissionWallet.save();
    
    // Log transaction
    await WalletTransaction.create({
      wallet_id: commissionWallet.id,
      type: 'credit',
      amount: commission,
      description: `Commission from order ${order.order_number}`,
      reference_type: 'order',
      reference_id: orderId
    });
    
    console.log(`Commission credited: ৳${commission}`);
  } catch (error) {
    console.error('Commission calculation error:', error);
  }
};
```

### Income Stream 2: Business Seller Plans

```javascript
const businessPlans = [
  {
    name: 'Basic',
    price: 5000,
    period: 'month',
    features: {
      productLimit: 100,
      analytics: true,
      prioritySupport: false
    }
  },
  {
    name: 'Professional',
    price: 15000,
    period: 'month',
    features: {
      productLimit: 500,
      analytics: true,
      prioritySupport: true,
      advancedTools: true
    }
  },
  {
    name: 'Enterprise',
    price: 50000,
    period: 'month',
    features: {
      productLimit: -1, // Unlimited
      analytics: true,
      prioritySupport: true,
      advancedTools: true,
      apiAccess: true
    }
  }
];

const subscribeToPlan = async (req, res) => {
  try {
    const { sellerId, planName } = req.body;
    
    const plan = businessPlans.find(p => p.name === planName);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    // Process payment
    const payment = await processPayment({
      amount: plan.price,
      type: 'business_plan'
    });
    
    if (payment.status !== 'success') {
      return res.status(400).json({ error: 'Payment failed' });
    }
    
    // Create subscription
    const subscription = await SellerSubscription.create({
      seller_id: sellerId,
      plan_name: planName,
      price: plan.price,
      features: plan.features,
      start_date: new Date(),
      end_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    });
    
    // Credit business plan wallet
    const businessWallet = await AdminWallet.findOne({
      wallet_type: 'business_plan'
    });
    businessWallet.balance += plan.price;
    businessWallet.total_earned += plan.price;
    await businessWallet.save();
    
    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Income Stream 3: AI Service Charges

```javascript
const aiServicePricing = {
  'product_recommendation': 0.10,
  'translation': 0.05,
  'chatbot': 0.20,
  'smart_search': 0.15,
  'product_comparison': 0.25
};

const trackAIUsage = async (serviceType, userId, amount) => {
  try {
    const charge = aiServicePricing[serviceType];
    
    // Log usage
    await AIUsageLog.create({
      user_id: userId,
      service_type: serviceType,
      charge: charge,
      timestamp: new Date()
    });
    
    // Credit AI service wallet
    const aiWallet = await AdminWallet.findOne({
      wallet_type: 'ai_service'
    });
    
    aiWallet.balance += charge;
    aiWallet.total_earned += charge;
    await aiWallet.save();
    
    // Monthly billing to seller
    const monthlyUsage = await AIUsageLog.aggregate([
      {
        $match: {
          user_id: userId,
          timestamp: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      },
      { $group: { _id: null, totalCharge: { $sum: '$charge' } } }
    ]);
    
  } catch (error) {
    console.error('AI usage tracking error:', error);
  }
};
```

---

## 🔄 Deployment & Scaling Strategy

### Microservices Architecture

```yaml
# docker-compose.yml
version: '3.8'
services:
  # API Gateway
  api-gateway:
    image: albi-global/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    depends_on:
      - postgres
      - redis
  
  # Core Services
  auth-service:
    image: albi-global/auth-service
    expose:
      - "3001"
    depends_on:
      - postgres
  
  product-service:
    image: albi-global/product-service
    expose:
      - "3002"
    depends_on:
      - postgres
      - elasticsearch
  
  order-service:
    image: albi-global/order-service
    expose:
      - "3003"
    depends_on:
      - postgres
  
  payment-service:
    image: albi-global/payment-service
    expose:
      - "3004"
    depends_on:
      - postgres
  
  ai-service:
    image: albi-global/ai-service
    expose:
      - "3005"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
  
  # Databases
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=albi_global
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    volumes:
      - es_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  es_data:
```

---

## ✅ Testing Strategy

### Test Coverage
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User workflows
- **Performance Tests**: Load testing

### Example Test
```javascript
// tests/auth.test.js
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test@1234',
        fullName: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.tokens).toHaveProperty('accessToken');
  });
  
  it('should not register duplicate email', async () => {
    await User.create({
      email: 'existing@example.com',
      password: 'hashed_password'
    });
    
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'Test@1234'
      });
    
    expect(response.status).toBe(409);
  });
});
```

---

## 📈 Performance Optimization

### Caching Strategy
```javascript
// Middleware for caching
const cacheMiddleware = (duration = 5 * 60) => {
  return (req, res, next) => {
    const key = `${req.originalUrl || req.url}`;
    const cachedResponse = redis.get(key);
    
    if (cachedResponse) {
      res.send(cachedResponse);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        redis.set(key, body, 'EX', duration);
        res.sendResponse(body);
      };
      next();
    }
  };
};

// Usage
router.get('/products', cacheMiddleware(10 * 60), getProducts);
```

### Database Indexing
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_product_rating ON products(rating DESC);
CREATE INDEX idx_user_created_at ON users(created_at);
```

---

## 🎯 Success Metrics

- **API Response Time**: < 200ms (p95)
- **Database Query**: < 50ms (p95)
- **Mobile App Load**: < 3s (FMP)
- **Web App Load**: < 2s (FCP)
- **99.95%** Uptime
- **100,000+** Concurrent Users
- **1,000,000+** Daily Active Users

---

## 📞 Support & Documentation

- API Documentation: Swagger/OpenAPI
- Developer Docs: Complete Setup Guides
- Admin Docs: Dashboard Usage Guide
- Seller Docs: Store Management Guide
- Customer Docs: FAQ & Help Center

---

**Project Status**: Ready for Implementation
**Last Updated**: 2026-07-02
**Owner**: Albi Global Team
