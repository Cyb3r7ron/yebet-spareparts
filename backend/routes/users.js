const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE 1: GET ALL USERS (Admin Only)
// ========================================
// GET /api/users
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Get all users, but EXCLUDE the password for security
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' } // Show newest users first
    });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// ========================================
// ROUTE 2: APPROVE A USER (Admin Only)
// ========================================
// PATCH /api/users/:id/approve
router.patch('/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true }
    });

    res.json({ success: true, message: `User ${user.email} has been approved!`, user });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Server error approving user.' });
  }
});

// ========================================
// ROUTE 3: CHANGE USER ROLE (Admin Only)
// ========================================
// PATCH /api/users/:id/role
router.patch('/:id/role', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Security: Only allow promoting to MANAGER or demoting to USER. 
    // Prevents accidentally making someone an ADMIN.
    if (role !== 'MANAGER' && role !== 'USER') {
      return res.status(400).json({ error: 'Invalid role. Must be MANAGER or USER.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({ success: true, message: `User role updated to ${role}!`, user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error updating role.' });
  }
});

// ========================================
// ROUTE 4: DELETE A USER (Admin Only)
// ========================================
// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user.' });
  }
});

module.exports = router;