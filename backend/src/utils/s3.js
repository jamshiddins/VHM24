/**
 * Утилита для работы с S3-совместимыми хранилищами
 */
const logger = require('./logger');
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Класс для работы с S3-совместимыми хранилищами
 */
class S3Service {
  /**
   * Инициализация S3 клиента
   */
  static getS3Client() {
    return new S3Client({
      region: process.env.S3_REGION || 'fra1',
      endpoint: process.env.S3_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
      }
    });
  }

  /**
   * Получение имени бакета
   * @returns {string} Имя бакета
   */
  static getBucketName() {
    return process.env.S3_BUCKET_NAME || process.env.S3_BUCKET;
  }

  /**
   * Получение URL для загрузок
   * @returns {string} URL для загрузок
   */
  static getUploadsEndpoint() {
    return process.env.S3_UPLOAD_URL || process.env.UPLOADS_ENDPOINT;
  }

  /**
   * Загрузка файла в S3
   * @param {Buffer} fileBuffer - Буфер с содержимым файла
   * @param {string} fileName - Имя файла
   * @param {string} contentType - MIME-тип файла
   * @param {string} folder - Папка для сохранения файла
   * @returns {Promise<Object>} Результат загрузки
   */
  static async uploadFile(fileBuffer, fileName, contentType, folder = '') {
    try {
      const s3Client = this.getS3Client();
      const key = folder ? `${folder}/${fileName}` : fileName;
      
      const command = new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read'
      });
      
      await s3Client.send(command);
      
      const fileUrl = `${this.getUploadsEndpoint()}/${key}`;
      
      logger.info('File uploaded to S3', { key, url: fileUrl });
      
      return {
        success: true,
        url: fileUrl,
        key
      };
    } catch (error) {
      logger.error('S3 upload failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Загрузка изображения в S3
   * @param {Buffer} imageBuffer - Буфер с изображением
   * @param {string} originalName - Оригинальное имя файла
   * @param {string} userId - ID пользователя
   * @param {string} type - Тип изображения
   * @returns {Promise<Object>} Результат загрузки
   */
  static async uploadImage(imageBuffer, originalName, userId, type = 'general') {
    const extension = originalName.split('.').pop().toLowerCase();
    const fileName = `${userId}_${Date.now()}.${extension}`;
    const folder = `images/${type}`;
    
    return this.uploadFile(imageBuffer, fileName, `image/${extension}`, folder);
  }

  /**
   * Загрузка видео в S3
   * @param {Buffer} videoBuffer - Буфер с видео
   * @param {string} originalName - Оригинальное имя файла
   * @param {string} userId - ID пользователя
   * @param {string} type - Тип видео
   * @returns {Promise<Object>} Результат загрузки
   */
  static async uploadVideo(videoBuffer, originalName, userId, type = 'general') {
    const extension = originalName.split('.').pop().toLowerCase();
    const fileName = `${userId}_${Date.now()}.${extension}`;
    const folder = `videos/${type}`;
    
    return this.uploadFile(videoBuffer, fileName, `video/${extension}`, folder);
  }

  /**
   * Загрузка Excel-файла в S3
   * @param {Buffer} excelBuffer - Буфер с Excel-файлом
   * @param {string} fileName - Имя файла
   * @returns {Promise<Object>} Результат загрузки
   */
  static async uploadExcel(excelBuffer, fileName) {
    const folder = 'reports/excel';
    
    return this.uploadFile(
      excelBuffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folder
    );
  }

  /**
   * Удаление файла из S3
   * @param {string} key - Ключ файла
   * @returns {Promise<Object>} Результат удаления
   */
  static async deleteFile(key) {
    try {
      const s3Client = this.getS3Client();
      
      const command = new DeleteObjectCommand({
        Bucket: this.getBucketName(),
        Key: key
      });
      
      await s3Client.send(command);
      
      logger.info('File deleted from S3', { key });
      
      return {
        success: true,
        key
      };
    } catch (error) {
      logger.error('S3 delete failed', { error: error.message, key });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Получение подписанного URL для доступа к файлу
   * @param {string} key - Ключ файла
   * @param {number} expiresIn - Время жизни URL в секундах
   * @returns {Promise<string>} Подписанный URL
   */
  static async getSignedUrl(key, expiresIn = 3600) {
    try {
      const s3Client = this.getS3Client();
      
      const command = new GetObjectCommand({
        Bucket: this.getBucketName(),
        Key: key
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn });
      
      logger.info('Generated signed URL', { key, expiresIn });
      
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { error: error.message, key });
      return null;
    }
  }

  /**
   * Проверка существования файла в S3
   * @param {string} key - Ключ файла
   * @returns {Promise<boolean>} Существует ли файл
   */
  static async fileExists(key) {
    try {
      const s3Client = this.getS3Client();
      
      const command = new HeadObjectCommand({
        Bucket: this.getBucketName(),
        Key: key
      });
      
      await s3Client.send(command);
      
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Получение списка файлов из S3
   * @param {string} prefix - Префикс для фильтрации файлов
   * @returns {Promise<Array>} Список файлов
   */
  static async listFiles(prefix = '') {
    try {
      const s3Client = this.getS3Client();
      
      const command = new ListObjectsV2Command({
        Bucket: this.getBucketName(),
        Prefix: prefix
      });
      
      const response = await s3Client.send(command);
      
      return response.Contents || [];
    } catch (error) {
      logger.error('Failed to list files', { error: error.message, prefix });
      return [];
    }
  }

  /**
   * Проверка подключения к S3
   * @returns {Promise<boolean>} Результат проверки
   */
  static async testConnection() {
    try {
      const s3Client = this.getS3Client();
      
      const command = new HeadBucketCommand({
        Bucket: this.getBucketName()
      });
      
      await s3Client.send(command);
      
      logger.info('S3 connection test successful', { bucket: this.getBucketName() });
      
      return true;
    } catch (error) {
      logger.error('S3 connection test failed', { error: error.message, bucket: this.getBucketName() });
      return false;
    }
  }
}

module.exports = S3Service;
