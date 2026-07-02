const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory order storage
const orders = {};

// Create Order
router.post('/', (req, res) => {
  try {
    const { customerId, items, deliveryAddressId, paymentMethod } = req.body;
    
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items required' });
    }
    
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;
    
    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += item.price * item.quantity;
    });
    
    const commission = (totalAmount * 10) / 100; // 10% commission
    
    orders[orderId] = {
      id: orderId,
      orderNumber,
      customerId,
      items,
      totalAmount,
      commission,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      deliveryAddressId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      order: orders[orderId],
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Order Details
router.get('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Orders
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userOrders = Object.values(orders).filter(o => o.customerId === userId);
    
    res.json({ success: true, orders: userOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Order Status
router.put('/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = orders[orderId];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    order.updatedAt = new Date();
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel Order
router.post('/:orderId/cancel', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders[orderId];
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel this order' });
    }
    
    order.status = 'cancelled';
    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
