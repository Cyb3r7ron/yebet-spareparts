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
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one item.' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

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
        price: product.price
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        totalAmount,
        orderType: 'ONLINE',
        status: 'PENDING',
        items: { create: orderItemsData }
      },
      include: { items: true }
    });

    for (const item of orderItemsData) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const newQuantity = product.quantity - item.quantity;

      await prisma.product.update({
        where: { id: item.productId },
        data: { 
          quantity: newQuantity,
          isSoldOut: newQuantity <= 0
        }
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
// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    
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

// ========================================
// ROUTE 4: CONFIRM ORDER (Admin/Manager Only)
// Changes status to PAID and ensures sales data is recorded
// ========================================
// PATCH /api/orders/:id/confirm
router.patch('/:id/confirm', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status === 'PAID') {
      return res.status(400).json({ error: 'Order is already confirmed.' });
    }

    // Update order status to PAID
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'PAID' }
    });

    // Ensure sales records exist for this order (Dashboard charts)
    const existingSales = await prisma.salesRecord.findFirst({
      where: { orderId: id }
    });

    if (!existingSales) {
      for (const item of order.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        await prisma.salesRecord.create({
          data: {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            quantity: item.quantity,
            totalAmount: item.price * item.quantity,
            orderId: order.id
          }
        });
      }
    }

    res.json({ success: true, message: 'Order confirmed and marked as PAID!', order: updatedOrder });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Server error confirming order.' });
  }
});

// ========================================
// ROUTE 5: UPDATE ORDER STATUS (Admin/Manager Only)
// ========================================
// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the status
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, message: `Order status updated to ${status}!`, order: updatedOrder });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating order status.' });
  }
});

module.exports = router;