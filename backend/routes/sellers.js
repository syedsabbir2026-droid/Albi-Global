const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory seller storage
const sellers = {};

// Register Seller
router.post('/register', (req, res) => {
  try {
    const { userId, storeName, businessLicense } = req.body;
    
    if (!userId || !storeName) {
      return res.status(400).json({ error: 'User ID and store name required' });
    }
    
    const sellerId = uuidv4();
    sellers[sellerId] = {
      id: sellerId,
      userId,
      storeName,
      businessLicense,
      verificationStatus: 'pending',
      verified: false,
      rating: 0,
      createdAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      seller: sellers[sellerId],
      message: 'Seller registration submitted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Seller Profile
router.get('/:sellerId', (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = sellers[sellerId];
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Seller Orders
router.get('/:sellerId/orders', (req, res) => {
  try {
    const { sellerId } = req.params;
    res.json({ success: true, orders: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Sales Report
router.get('/:sellerId/sales-report', (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate } = req.query;
    
    res.json({
      success: true,
      report: {
        totalSales: 0,
        commission: 0,
        netEarnings: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
