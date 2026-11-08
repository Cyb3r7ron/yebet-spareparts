const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
    const products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
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
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
});

// ========================================
// ROUTE 3: CREATE NEW PRODUCT (Admin/Manager Only)
// ========================================
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, sku, category, price, quantity, minStock, imageUrl } = req.body;
    if (!name || !sku || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Please provide name, sku, category, price, and quantity.' });
    }
    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) return res.status(400).json({ error: 'A product with this SKU already exists.' });
    
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
        isSoldOut: parseInt(quantity) <= 0
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
      name, description, sku, category,
      price: price !== undefined ? parseFloat(price) : undefined,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      minStock: minStock !== undefined ? parseInt(minStock) : undefined,
      imageUrl
    };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    if (quantity !== undefined) updateData.isSoldOut = parseInt(quantity) <= 0;
    
    const product = await prisma.product.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Product updated successfully!', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

// ========================================
// ROUTE 5: DELETE PRODUCT (Admin/Manager Only) ✅ UPDATED
// ========================================
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    // ✅ This will print the EXACT Prisma error (e.g., Foreign Key Constraint) to your Render logs
    console.error('Delete product error DETAILS:', error);
    res.status(500).json({ error: 'Server error deleting product. It may be linked to existing orders.' });
  }
});

module.exports = router;