import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/parkit';

export const sequelize = new Sequelize(dbUrl, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    // For TiDB Serverless, SSL is usually required
    ssl: dbUrl.includes('tidbcloud') ? {
      require: true,
      rejectUnauthorized: true
    } : false
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    // Sync models
    await sequelize.sync();
    console.log('✅ Models synchronized.');
    const { seedDatabase } = require('./seed');
    await seedDatabase();
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};
