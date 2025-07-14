const { validationResult, body, param, query } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Ошибки валидации',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  handleValidationErrors,
  body,
  param,
  query
};
