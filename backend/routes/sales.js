const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE: GET SALES ANALYTICS (Admin/Manager Only)
// Supports custom date ranges: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// ========================================
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build the date filter for Prisma
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.saleDate = {
        gte: new Date(startDate), // Greater than or equal to start date
        lte: new Date(endDate)    // Less than or equal to end date
      };
    }

    // Fetch all sales records within the date range
    const sales = await prisma.salesRecord.findMany({
      where: dateFilter,
      orderBy: { saleDate: 'asc' }
    });

    // Calculate Summary
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Count unique order IDs to get actual number of transactions
    const uniqueOrders = new Set(sales.map(sale => sale.orderId).filter(Boolean));
    const totalTransactions = uniqueOrders.size;

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalItems,
        totalTransactions
      },
      salesData: sales // Raw data for charts
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Server error fetching sales data.' });
  }
});

module.exports = router;