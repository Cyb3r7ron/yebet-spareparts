const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE 1: PLACE AN ORDER (Customer / Online)
// ========================================
// POST /api/orders
router.post('/', authenticate, async (req, res) => {
  try {
    const { items } = req.body; // items should be an array: [{ productId, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one item.' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    // 1. Validate stock and calculate total price
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found.` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
      }
      
      totalAmount += product.price * item.quantity;
      
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price // Save the price at the time of purchase
      });
    }

    // 2. Create the Order
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        totalAmount,
        orderType: 'ONLINE',
        status: 'PENDING', // Customer orders start as pending until they pay in person
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    // 3. Deduct Inventory and Record Sales
    for (const item of orderItemsData) {
      // Deduct stock
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const newQuantity = product.quantity - item.quantity;

      await prisma.product.update({
        where: { id: item.productId },
        data: { 
          quantity: newQuantity,
          isSoldOut: newQuantity <= 0 // Auto-mark as sold out if 0
        }
      });

      // Record the sale for analytics
      await prisma.salesRecord.create({
        data: {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity,
          orderId: order.id
        }
      });
    }

    res.status(201).json({ success: true, message: 'Order placed successfully!', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error creating order.' });
  }
});

// ========================================
// ROUTE 2: MANUAL IN-PERSON SALE (Admin/Manager)
// ========================================
// POST /api/orders/manual
router.post('/manual', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Please provide userId and items.' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product?.name}.` });
      }
      
      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create order (Marked as PAID immediately since they paid in person)
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        orderType: 'IN_PERSON',
        status: 'PAID', 
        items: { create: orderItemsData }
      },
      include: { items: true }
    });

    // Deduct inventory and record sales
    for (const item of orderItemsData) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const newQuantity = product.quantity - item.quantity;

      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: newQuantity, isSoldOut: newQuantity <= 0 }
      });

      await prisma.salesRecord.create({
        data: {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity,
          orderId: order.id
        }
      });
    }

    res.status(201).json({ success: true, message: 'In-person sale recorded!', order });
  } catch (error) {
    console.error('Manual sale error:', error);
    res.status(500).json({ error: 'Server error recording manual sale.' });
  }
});

// ========================================
// ROUTE 3: GET ORDERS
// ========================================
// GET /api/orders (Admin sees all, Users see their own)
router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    
    // If user is not Admin/Manager, only show their own orders
    if (req.user.role === 'USER') {
      whereClause = { userId: req.user.userId };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { 
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { product: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

module.exports = router;