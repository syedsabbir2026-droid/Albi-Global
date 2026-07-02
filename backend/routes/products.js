const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory product storage
const products = {};

// Get All Products
router.get('/', (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;
    
    let filteredProducts = Object.values(products);
    
    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (minPrice || maxPrice) {
      filteredProducts = filteredProducts.filter(p => {
        const price = p.price;
        if (minPrice && price < minPrice) return false;
        if (maxPrice && price > maxPrice) return false;
        return true;
      });
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Pagination
    const startIdx = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIdx, startIdx + limit);
    
    res.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        current: page,
        total: Math.ceil(filteredProducts.length / limit),
        count: paginatedProducts.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Product Details
router.get('/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const product = products[productId];
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Product (Seller)
router.post('/', (req, res) => {
  try {
    const { title, description, price, category, images, sellerId } = req.body;
    
    if (!title || !price || !sellerId) {
      return res.status(400).json({ error: 'Title, price and seller required' });
    }
    
    const productId = uuidv4();
    products[productId] = {
      id: productId,
      title,
      description,
      price,
      category,
      images: images || [],
      sellerId,
      rating: 0,
      reviews: 0,
      createdAt: new Date()
    };
    
    res.status(201).json({ success: true, product: products[productId] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Review
router.post('/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, userId } = req.body;
    
    const product = products[productId];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Reviews
router.get('/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    res.json({ success: true, reviews: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
