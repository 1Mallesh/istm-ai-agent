const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/itsm-agent');

    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      department: String,
      jobTitle: String,
      isAdmin: Boolean,
      status: { type: String, default: 'active' },
      employeeType: { type: String, default: 'full_time' },
    }, { timestamps: true });

    const User = mongoose.model('User', UserSchema);

    const existing = await User.findOne({ email: 'admin@company.com' });
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);

    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      isAdmin: true,
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@company.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();