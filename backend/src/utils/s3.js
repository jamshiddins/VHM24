const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('./logger');

// Настройка S3 клиента для DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: true // Необходимо для DigitalOcean Spaces
});

const BUCKET_NAME = process.env.S3_BUCKET;

class S3Service {
  /**
   * Загрузить файл в S3
   * @param {Buffer} fileBuffer - Буфер файла
   * @param {string} fileName - Имя файла
   * @param {string} contentType - MIME тип файла
   * @param {string} folder - Папка для загрузки (опционально)
   * @returns {Promise<string>} URL загруженного файла
   */
  static async uploadFile(fileBuffer, fileName, contentType, folder = '') {
    try {
      const key = folder ? `${folder}/${fileName}` : fileName;
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read' // Делаем файл публично доступным
      });
      
      const result = await s3Client.send(command);
      
      // Формируем URL файла
      const fileUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
      
      logger.info('File uploaded to S3', {
        bucket: BUCKET_NAME,
        key: key,
        location: fileUrl
      });
      
      return fileUrl;
    } catch (error) {
      logger.error('S3 upload failed', {
        error: error.message,
        fileName,
        folder
      });
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Загрузить изображение
   * @param {Buffer} imageBuffer - Буфер изображения
   * @param {string} originalName - Оригинальное имя файла
   * @param {string} userId - ID пользователя
   * @param {string} type - Тип изображения (warehouse, machine, task, etc.)
   * @returns {Promise<string>} URL загруженного изображения
   */
  static async uploadImage(imageBuffer, originalName, userId, type = 'general') {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}_${userId}.${extension}`;
    const folder = `images/${type}`;
    
    return await this.uploadFile(imageBuffer, fileName, `image/${extension}`, folder);
  }
  
  /**
   * Загрузить видео
   * @param {Buffer} videoBuffer - Буфер видео
   * @param {string} originalName - Оригинальное имя файла
   * @param {string} userId - ID пользователя
   * @param {string} type - Тип видео
   * @returns {Promise<string>} URL загруженного видео
   */
  static async uploadVideo(videoBuffer, originalName, userId, type = 'general') {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}_${userId}.${extension}`;
    const folder = `videos/${type}`;
    
    return await this.uploadFile(videoBuffer, fileName, `video/${extension}`, folder);
  }
  
  /**
   * Загрузить Excel файл
   * @param {Buffer} excelBuffer - Буфер Excel файла
   * @param {string} originalName - Оригинальное имя файла
   * @param {string} userId - ID пользователя
   * @returns {Promise<string>} URL загруженного файла
   */
  static async uploadExcel(excelBuffer, originalName, userId) {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${userId}_${originalName}`;
    const folder = 'reports/excel';
    
    return await this.uploadFile(
      excelBuffer, 
      fileName, 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folder
    );
  }
  
  /**
   * Удалить файл из S3
   * @param {string} fileUrl - URL файла для удаления
   * @returns {Promise<boolean>} Успешность удаления
   */
  static async deleteFile(fileUrl) {
    try {
      // Извлекаем ключ из URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Убираем первый слеш
      
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      await s3Client.send(command);
      
      logger.info('File deleted from S3', {
        bucket: BUCKET_NAME,
        key: key
      });
      
      return true;
    } catch (error) {
      logger.error('S3 delete failed', {
        error: error.message,
        fileUrl
      });
      return false;
    }
  }
  
  /**
   * Получить подписанный URL для временного доступа
   * @param {string} key - Ключ файла в S3
   * @param {number} expiresIn - Время жизни URL в секундах (по умолчанию 1 час)
   * @returns {Promise<string>} Подписанный URL
   */
  static async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn });
      
      logger.info('Generated signed URL', {
        bucket: BUCKET_NAME,
        key: key,
        expiresIn
      });
      
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        error: error.message,
        key
      });
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }
  
  /**
   * Проверить существование файла
   * @param {string} key - Ключ файла в S3
   * @returns {Promise<boolean>} Существует ли файл
   */
  static async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Получить список файлов в папке
   * @param {string} prefix - Префикс (папка)
   * @param {number} maxKeys - Максимальное количество файлов
   * @returns {Promise<Array>} Список файлов
   */
  static async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys
      });
      
      const result = await s3Client.send(command);
      
      return result.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${item.Key}`
      })) || [];
    } catch (error) {
      logger.error('Failed to list files', {
        error: error.message,
        prefix
      });
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
  
  /**
   * Проверить подключение к S3
   * @returns {Promise<boolean>} Статус подключения
   */
  static async testConnection() {
    try {
      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await s3Client.send(command);
      logger.info('S3 connection test successful', { bucket: BUCKET_NAME });
      return true;
    } catch (error) {
      logger.error('S3 connection test failed', {
        error: error.message,
        bucket: BUCKET_NAME
      });
      return false;
    }
  }
}

module.exports = {
  s3Client,
  S3Service,
  BUCKET_NAME
};
