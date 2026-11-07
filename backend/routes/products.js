const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer'); // ✅ 1. ADDED MULTER

const router = express.Router();
const prisma = new PrismaClient();

// ✅ 2. ADDED: Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Saves to the 'uploads' folder in your backend
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ========================================
// ROUTE 1: GET ALL PRODUCTS
// ========================================
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// ========================================
// ROUTE 2: GET SINGLE PRODUCT BY ID
// ========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

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
// ✅ 3. ADDED: upload.single('image') middleware
// ========================================
// ROUTE 3: CREATE NEW PRODUCT (Admin/Manager Only)
// ========================================
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), upload.single('image'), async (req, res) => {
  try {
    // ✅ DEBUGGER: This will show up in your Render logs!
    console.log('--- CREATE PRODUCT ROUTE HIT ---');
    console.log('REQ BODY:', req.body);
    console.log('REQ FILE:', req.file ? req.file.filename : 'NO FILE');

    const { name, description, sku, category, price, quantity, minStock, imageUrl } = req.body;
    const finalImageUrl = req.file ? `/uploads/${req.file.filename}` : (imageUrl || '');

    if (!name || !sku || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Please provide name, sku, category, price, and quantity.' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }

    const isSoldOut = parseInt(quantity) <= 0;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        sku,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock) || 5,
        imageUrl: finalImageUrl,
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
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sku, category, price, quantity, minStock, imageUrl } = req.body;

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

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

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