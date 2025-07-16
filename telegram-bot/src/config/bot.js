require('dotenv').config();

module.exports = {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8000/api/v1'
};
