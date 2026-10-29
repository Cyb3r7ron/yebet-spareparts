const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE 1: GET ALL PRODUCTS (Public/Protected)
// Includes Search and Category Filter
// ========================================
// GET /api/products?search=brake&category=Engine
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    
    // Build the filter object
    const where = {};

    // If search term exists, search by name OR sku (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // If category exists, filter by category
    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' } // Newest first
    });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// ========================================
// ROUTE 2: GET SINGLE PRODUCT BY ID (Public/Protected)
// ========================================
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
});

// ========================================
// ROUTE 3: CREATE NEW PRODUCT (Admin/Manager Only)
// ========================================
// POST /api/products
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, sku, category, price, quantity, minStock, imageUrl } = req.body;

    // Validate required fields
    if (!name || !sku || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Please provide name, sku, category, price, and quantity.' });
    }

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }

    // Auto-calculate isSoldOut
    const isSoldOut = quantity <= 0;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        sku,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock) || 5,
        imageUrl: imageUrl || '',
        isSoldOut
      }
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error creating product.' });
  }
});

// ========================================
// ROUTE 4: UPDATE PRODUCT (Admin/Manager Only)
// ========================================
// PUT /api/products/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sku, category, price, quantity, minStock, imageUrl } = req.body;

    // If quantity is being updated, check if it should be marked as sold out
    const updateData = {
      name,
      description,
      sku,
      category,
      price: price !== undefined ? parseFloat(price) : undefined,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      minStock: minStock !== undefined ? parseInt(minStock) : undefined,
      imageUrl
    };

    // Remove undefined values so Prisma doesn't try to update them to null
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Auto-update isSoldOut if quantity is provided
    if (quantity !== undefined) {
      updateData.isSoldOut = parseInt(quantity) <= 0;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, message: 'Product updated successfully!', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

// ========================================
// ROUTE 5: DELETE PRODUCT (Admin Only)
// ========================================
// DELETE /api/products/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;