const Joi = require('joi');

const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(passwordRegex).required()
      .messages({
        'string.pattern.base': 'Password must contain at least 8 characters, one uppercase letter and one number'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message.replace(/['"]+/g, '')
    }));
    return { valid: false, errors };
  }
  
  return { valid: true, data: value };
};

module.exports = {
  schemas,
  validate
};