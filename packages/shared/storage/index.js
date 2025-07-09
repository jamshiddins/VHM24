const S3StorageAdapter = require('./s3');

module.exports = {
  S3StorageAdapter,
  // Создаем singleton instance
  storage: new S3StorageAdapter()
};