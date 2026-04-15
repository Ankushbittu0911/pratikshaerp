const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const users = [
  { name: 'Super Admin', email: 'superadmin@pratiksha.com', password: 'Admin@123', role: 'SUPER_ADMIN', phone: '9999999990' },
  { name: 'Sales Admin', email: 'sales@pratiksha.com', password: 'Admin@123', role: 'SALES_ADMIN', phone: '9999999991' },
  { name: 'Quotation Admin', email: 'quotation@pratiksha.com', password: 'Admin@123', role: 'QUOTATION_ADMIN', phone: '9999999992' },
  { name: 'Purchase Admin', email: 'purchase@pratiksha.com', password: 'Admin@123', role: 'PURCHASE_ADMIN', phone: '9999999993' },
  { name: 'Fabrication Admin', email: 'fabrication@pratiksha.com', password: 'Admin@123', role: 'FABRICATION_ADMIN', phone: '9999999994' },
  { name: 'Electrical Admin', email: 'electrical@pratiksha.com', password: 'Admin@123', role: 'ELECTRICAL_ADMIN', phone: '9999999995' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pratiksha_erp');
    console.log('Connected to MongoDB');
    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Created: ${u.email}`);
      } else {
        console.log(`Exists: ${u.email}`);
      }
    }
    console.log('\n=== SEED COMPLETE ===');
    console.log('Login with any of these credentials:');
    users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`));
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
