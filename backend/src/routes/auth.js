const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Auth роуты для VHM24

/**
 * Логин пользователя
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password: _password } = req.body;
    
    // TODO: Проверка пользователя в БД
    const user = { id: 1, email, role: 'OPERATOR' };
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: { user, token },
      message: 'Авторизация успешна'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка авторизации',
      error: error.message
    });
  }
});

/**
 * Регистрация пользователя
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password: _password, firstName, role } = req.body;
    
    // TODO: Создание пользователя в БД
    const user = { id: Date.now(), email, firstName, role: role || 'OPERATOR' };
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'Пользователь создан успешно'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации',
      error: error.message
    });
  }
});

/**
 * Получение текущего пользователя
 */
router.get('/me', async (req, res) => {
  try {
    // TODO: Получение пользователя из БД
    res.json({
      success: true,
      data: req.user || { id: 1, email: 'demo@example.com' },
      message: 'Данные пользователя получены'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных пользователя',
      error: error.message
    });
  }
});

module.exports = router;
