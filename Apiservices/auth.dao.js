const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const config = process.env;

const usersCollection = () => getDB().collection('users');

const findUserByEmail = async (email) => {
  try {
    return await usersCollection().findOne({ email });
  } catch (err) {
    console.error('Error finding user:', err);
    throw err;
  }
};

const createUser = async (userData) => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection().insertOne(newUser);
    
    if (!result.acknowledged) {
      throw new Error('User creation failed');
    }

    return {
      id: result.insertedId,
      name: newUser.name,
      email: newUser.email
    };
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

const verifyPassword = async (user, password) => {
  return bcrypt.compare(password, user.password);
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.TOKEN_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  verifyPassword,
  generateToken
};