const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Setup Multer for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ========================================
// ROUTE 1: GET ALL USERS (Admin Only)
// ========================================
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// ========================================
// ROUTE 2: APPROVE USER (Admin Only)
// ========================================
router.patch('/:id/approve', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    res.json({ success: true, message: 'User approved.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error approving user.' });
  }
});

// ========================================
// ROUTE 3: CHANGE ROLE (Admin Only)
// ========================================
router.patch('/:id/role', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json({ success: true, message: 'Role updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating role.' });
  }
});

// ========================================
// ROUTE 4: UPDATE PROFILE (Admin/Manager)
// ========================================
router.patch('/profile', authenticate, authorize('ADMIN', 'MANAGER'), upload.single('avatar'), async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updateData = { firstName, lastName, phone };

    // If an image was uploaded, save the path
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData
    });

    // Send back the updated user (without password)
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// ========================================
// ROUTE 5: CHANGE PASSWORD (Admin/Manager)
// ========================================
router.patch('/password', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Get current user
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    // 2. Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // 3. Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password.' });
  }
});

module.exports = router;