const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => res.json({ message: '🚗 Yebet Spareparts API is running!' }));
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ message: '✅ Database connected successfully!', totalUsers: userCount });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders'); // <-- ADD THIS
const salesRoutes = require('./routes/sales');  // <-- ADD THIS

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // <-- ADD THIS
app.use('/api/sales', salesRoutes);  // <-- ADD THIS

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});