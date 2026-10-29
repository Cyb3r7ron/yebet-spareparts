const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE: GET SALES ANALYTICS (Admin/Manager Only)
// ========================================
// GET /api/sales?period=daily (or monthly, yearly)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // Default to monthly
    let startDate = new Date();
    const now = new Date();

    // Calculate the start date based on the period
    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0); // Start of today
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
    }

    // Fetch all sales records in this date range
    const sales = await prisma.salesRecord.findMany({
      where: {
        saleDate: { gte: startDate }
      }
    });

    // Calculate Summary
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    res.json({
      success: true,
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalItems,
        totalTransactions: sales.length
      },
      salesData: sales // Raw data for charts
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Server error fetching sales data.' });
  }
});

module.exports = router;