const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;
let db;

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGODB_URI_ATLAS);
    await client.connect();
    db = client.db(process.env.DB_NAME || 'foodsDB');
    console.log('🟢 MongoDB connected');
    return db;
  } catch (err) {
    console.error('🔴 MongoDB connection error:', err);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error('Database not connected');
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('🔵 MongoDB disconnected');
  }
};

module.exports = { connectDB, getDB, closeDB };
