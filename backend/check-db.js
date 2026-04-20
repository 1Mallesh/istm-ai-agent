const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/itsm-agent');
    console.log('✅ Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n👥 Users count: ${usersCount}`);

    if (usersCount > 0) {
      const users = await db.collection('users').find({}, { projection: { firstName: 1, lastName: 1, email: 1, role: 1, isAdmin: 1 } }).toArray();
      console.log('\n👤 Users:');
      users.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}, Admin: ${user.isAdmin}`);
      });
    }

  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();