const logger = require('@vhm24/shared/logger');

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

/**
 * DigitalOcean Spaces Storage Module
 * Модуль для загрузки файлов в DigitalOcean Spaces
 */

class S3Storage {
  constructor() {
    // Конфигурация DigitalOcean Spaces
    this.spacesEndpoint = new AWS.Endpoint(process.env.S3_ENDPOINT || 'https://fra1.digitaloceanspaces.com');
    this.s3 = new AWS.S3({
      endpoint: this.spacesEndpoint,
      accessKeyId: process.env.S3_ACCESS_KEY || 'DO00XEB6BC6XZ8Q2M4KQ',
      secretAccessKey: process.env.S3_SECRET_KEY || 'SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk',
      region: process.env.S3_REGION || 'fra1'
    });
    
    this.bucketName = process.env.S3_BUCKET || 'vhm24-uploads';
    this.cdnUrl = `https://${this.bucketName}.fra1.cdn.digitaloceanspaces.com`;
  }

  /**
   * Загрузка файла в DigitalOcean Spaces
   * @param {string} filePath - Путь к локальному файлу
   * @param {string} fileName - Имя файла
   * @param {string} folder - Папка для загрузки (по умолчанию 'uploads')
   * @returns {Promise<string>} - URL загруженного файла
   */
  async uploadFile(filePath, fileName, folder = 'uploads') {
    try {
      // Генерируем уникальное имя файла
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${uniqueFileName}`;

      // Читаем файл
      const fileContent = await fsPromises.readFile(filePath);

      // Определяем MIME тип
      const mimeType = this.getMimeType(fileExtension);

      // Параметры загрузки
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
        ACL: 'public-read',
        ContentType: mimeType,
        CacheControl: 'max-age=31536000' // Кэширование на год
      };

      // Загружаем файл
      const result = await this.s3.upload(uploadParams).promise();
      
      // Возвращаем CDN URL
      const cdnUrl = `${this.cdnUrl}/${key}`;
      
      logger.info(`✅ File uploaded successfully: ${cdnUrl}`);
      return cdnUrl;

    } catch (error) {
      logger.error('❌ Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Загрузка фото из Telegram
   * @param {string} filePath - Путь к загруженному фото
   * @param {string} originalFileName - Оригинальное имя файла
   * @returns {Promise<string>} - URL загруженного фото
   */
  async uploadPhoto(filePath, originalFileName = 'photo.jpg') {
    return this.uploadFile(filePath, originalFileName, 'photos');
  }

  /**
   * Загрузка документа из Telegram
   * @param {string} filePath - Путь к загруженному документу
   * @param {string} originalFileName - Оригинальное имя файла
   * @returns {Promise<string>} - URL загруженного документа
   */
  async uploadDocument(filePath, originalFileName) {
    return this.uploadFile(filePath, originalFileName, 'documents');
  }

  /**
   * Загрузка отчета
   * @param {string} filePath - Путь к файлу отчета
   * @param {string} fileName - Имя файла отчета
   * @returns {Promise<string>} - URL загруженного отчета
   */
  async uploadReport(filePath, fileName) {
    return this.uploadFile(filePath, fileName, 'reports');
  }

  /**
   * Определение MIME типа по расширению файла
   * @param {string} extension - Расширение файла
   * @returns {string} - MIME тип
   */
  getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Удаление файла из DigitalOcean Spaces
   * @param {string} fileUrl - URL файла для удаления
   * @returns {Promise<boolean>} - Результат удаления
   */
  async deleteFile(fileUrl) {
    try {
      // Извлекаем ключ из URL
      const key = fileUrl.replace(`${this.cdnUrl}/`, '');

      const deleteParams = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(deleteParams).promise();
      logger.info(`✅ File deleted successfully: ${fileUrl}`);
      return true;

    } catch (error) {
      logger.error('❌ Error deleting file from S3:', error);
      return false;
    }
  }

  /**
   * Получение информации о файле
   * @param {string} fileUrl - URL файла
   * @returns {Promise<Object>} - Информация о файле
   */
  async getFileInfo(fileUrl) {
    try {
      const key = fileUrl.replace(`${this.cdnUrl}/`, '');

      const headParams = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.headObject(headParams).promise();
      
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag
      };

    } catch (error) {
      logger.error('❌ Error getting file info:', error);
      return null;
    }
  }

  /**
   * Создание подписанного URL для временного доступа
   * @param {string} key - Ключ файла в S3
   * @param {number} expiresIn - Время жизни URL в секундах (по умолчанию 1 час)
   * @returns {string} - Подписанный URL
   */
  getSignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}

// Экспортируем singleton экземпляр
const s3Storage = new S3Storage();
module.exports = s3Storage;
