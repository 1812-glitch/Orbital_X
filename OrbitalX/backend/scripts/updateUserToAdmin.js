require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (e) {}
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function updateUserRole() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment!');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const allUsers = await User.find({});
    console.log('\n--- Current Users in Database ---');
    allUsers.forEach(u => {
      console.log(`ID: ${u._id} | Name: "${u.name}" | Email: ${u.email} | Role: ${u.role}`);
    });

    // Update any user with name "Admin User" or email starting with "admin" or "operator" to ADMIN
    const result = await User.updateMany(
      { $or: [{ name: /admin/i }, { email: /admin/i }, { email: /operator/i }] },
      { $set: { role: 'ADMIN' } }
    );

    console.log(`\nUpdated ${result.modifiedCount} user(s) to role: 'ADMIN'.`);

    const updatedUsers = await User.find({});
    console.log('\n--- Updated Users in Database ---');
    updatedUsers.forEach(u => {
      console.log(`ID: ${u._id} | Name: "${u.name}" | Email: ${u.email} | Role: ${u.role}`);
    });

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating user role:', err);
    process.exit(1);
  }
}

updateUserRole();
