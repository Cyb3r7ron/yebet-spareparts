const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Admin account details - CHANGE THESE!
  const adminEmail = 'admin@yebet.com';
  const adminPassword = 'Admin123!'; // Change this to a strong password!

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin already exists:', adminEmail);
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      isApproved: true, // Admin is auto-approved
      phone: '0000000000'
    }
  });

  console.log('✅ Admin created successfully!');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('⚠️  Remember to change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });