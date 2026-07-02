const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory payment storage
const payments = {};

// Process Payment
router.post('/', (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Order ID, amount and payment method required' });
    }
    
    const paymentId = uuidv4();
    
    payments[paymentId] = {
      id: paymentId,
      orderId,
      amount,
      paymentMethod,
      status: 'success', // In real scenario, integrate with payment gateway
      transactionId: `TXN-${Date.now()}`,
      createdAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      payment: payments[paymentId],
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Payment Status
router.get('/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = payments[paymentId];
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refund
router.post('/:paymentId/refund', (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = payments[paymentId];
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ success: true, message: 'Refund processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
