const authDao = require('./auth.dao');
const { schemas, validate } = require('./auth.dto');

const register = async (req, res) => {
  // Validación
  const { valid, errors, data } = validate(schemas.register, req.body);
  if (!valid) return res.status(400).json({ success: false, errors });

  try {
    // Verificar si el usuario existe
    const existingUser = await authDao.findUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Crear usuario
    const newUser = await authDao.createUser(data);
    const token = authDao.generateToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const login = async (req, res) => {
  // Validación
  const { valid, errors, data } = validate(schemas.login, req.body);
  if (!valid) return res.status(400).json({ success: false, errors });

  try {
    // Buscar usuario
    const user = await authDao.findUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Verificar contraseña
    const validPassword = await authDao.verifyPassword(user, data.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Generar token
    const token = authDao.generateToken({
      id: user._id,
      email: user.email
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  register,
  login
};