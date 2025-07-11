const Joi = require('joi');

const validator = {
  // Схемы валидации
  schemas: {
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    id: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required()
  },

  // Валидация данных
  validate(data, schema) {
    return schema.validate(data);
  },

  // Валидация пользователя
  validateUser(userData) {
    const schema = Joi.object({
      email: this.schemas.email,
      password: this.schemas.password,
      name: this.schemas.name,
      phone: this.schemas.phone.optional()
    });
    return this.validate(userData, schema);
  },

  // Валидация машины
  validateMachine(machineData) {
    const schema = Joi.object({
      name: this.schemas.name,
      location: Joi.string().required(),
      capacity: Joi.number().positive().required(),
      status: Joi.string().valid('active', 'inactive', 'maintenance').required()
    });
    return this.validate(machineData, schema);
  }
};

module.exports = validator;
