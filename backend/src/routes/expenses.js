const express = require('express');
const router = express.Router();

// expenses роуты для VHM24

router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'expenses получены успешно'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения expenses',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      data: req.body,
      message: 'expenses создан успешно'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания expenses',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: { id },
      message: 'expenses найден'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения expenses',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: { id, ...req.body },
      message: 'expenses обновлен успешно'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления expenses',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `Объект с ID ${id} удален успешно`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления expenses',
      error: error.message
    });
  }
});

module.exports = router;
