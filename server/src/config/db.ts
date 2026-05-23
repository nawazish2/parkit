import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

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
    // Only alter tables in development — use migrations in production
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Models synchronized.');
    const { seedDatabase } = require('./seed');
    await seedDatabase();
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};
