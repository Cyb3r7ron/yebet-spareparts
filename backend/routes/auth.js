const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ========================================
// ROUTE 1: REGISTER (Public)
// ========================================
// POST /api/auth/register
// Anyone can register, but they become USER role and need approval
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // 1. Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Please provide email, password, firstName, and lastName.' 
      });
    }

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // 3. Hash the password (never store plain text passwords!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user
    // - role defaults to "USER" (from schema)
    // - isApproved defaults to false (from schema)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'USER',
        isApproved: false
      }
    });

    // 5. Return success (don't send password back!)
    res.status(201).json({
      message: 'Registration successful! Waiting for admin approval.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ========================================
// ROUTE 2: LOGIN (Public)
// ========================================
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // 3. Check if password matches
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // 4. Check if user is approved (except for ADMIN role)
    if (!user.isApproved && user.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please wait.' 
      });
    }

    // 5. Create JWT token (valid for 7 days)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Return token and user info
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ========================================
// ROUTE 3: GET CURRENT USER (Protected)
// ========================================
// GET /api/auth/me
// Returns info about the currently logged-in user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        phone: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;