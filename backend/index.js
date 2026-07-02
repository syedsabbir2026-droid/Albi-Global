const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const logger = require('pino')();

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
const http = require('http');
const pinoHttp = require('pino-http');
app.use(pinoHttp());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes (To be implemented)
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/sellers', require('./routes/sellers'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/wishlist', require('./routes/wishlist'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/delivery', require('./routes/delivery'));
app.use('/api/v1/social', require('./routes/social'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// WebSocket for real-time features
const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  logger.info('User connected:', socket.id);
  
  // Real-time order tracking
  socket.on('track_order', (orderId) => {
    socket.join(`order_${orderId}`);
  });
  
  // Live chat
  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    logger.info('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Albi Global Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
