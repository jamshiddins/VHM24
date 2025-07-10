const AWS = require('aws-sdk');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Конфигурация S3
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'https://fra1.digitaloceanspaces.com',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION || 'fra1',
  s3ForcePathStyle: true
};

// Имя бакета
const bucketName = process.env.S3_BUCKET || 'vhm24-uploads';

// Создаем S3 клиент
const s3 = new AWS.S3(s3Config);

/**
 * Загрузка файла в S3
 * @param {string} filePath - Путь к файлу
 * @param {string} key - Ключ файла в S3
 * @param {Object} options - Дополнительные опции
 * @returns {Promise<string>} - URL загруженного файла
 */
async function uploadFile(filePath, key, options = {}) {
  try {
    const fileContent = await fsPromises.readFile(filePath);
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: options.contentType || 'application/octet-stream',
      ...options
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Загрузка фото в S3
 * @param {string} filePath - Путь к файлу
 * @param {string} fileName - Имя файла
 * @returns {Promise<string>} - URL загруженного фото
 */
async function uploadPhoto(filePath, fileName) {
  const ext = path.extname(fileName);
  const key = `photos/${uuidv4()}${ext}`;
  
  return uploadFile(filePath, key, {
    ContentType: `image/${ext.substring(1)}` // .jpg -> image/jpg
  });
}

/**
 * Загрузка документа в S3
 * @param {string} filePath - Путь к файлу
 * @param {string} fileName - Имя файла
 * @returns {Promise<string>} - URL загруженного документа
 */
async function uploadDocument(filePath, fileName) {
  const ext = path.extname(fileName);
  const key = `documents/${uuidv4()}${ext}`;
  
  let contentType = 'application/octet-stream';
  
  // Определяем Content-Type на основе расширения
  switch (ext.toLowerCase()) {
    case '.pdf':
      contentType = 'application/pdf';
      break;
    case '.doc':
    case '.docx':
      contentType = 'application/msword';
      break;
    case '.xls':
    case '.xlsx':
      contentType = 'application/vnd.ms-excel';
      break;
    case '.txt':
      contentType = 'text/plain';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.csv':
      contentType = 'text/csv';
      break;
  }
  
  return uploadFile(filePath, key, { ContentType: contentType });
}

/**
 * Загрузка отчета в S3
 * @param {string} filePath - Путь к файлу
 * @param {string} fileName - Имя файла
 * @returns {Promise<string>} - URL загруженного отчета
 */
async function uploadReport(filePath, fileName) {
  const ext = path.extname(fileName);
  const key = `reports/${uuidv4()}${ext}`;
  
  return uploadFile(filePath, key);
}

/**
 * Удаление файла из S3
 * @param {string} fileUrl - URL файла
 * @returns {Promise<boolean>} - Результат удаления
 */
async function deleteFile(fileUrl) {
  try {
    // Извлекаем ключ из URL
    const key = fileUrl.split(`${bucketName}/`)[1];
    
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
}

/**
 * Получение информации о файле
 * @param {string} fileUrl - URL файла
 * @returns {Promise<Object>} - Информация о файле
 */
async function getFileInfo(fileUrl) {
  try {
    // Извлекаем ключ из URL
    const key = fileUrl.split(`${bucketName}/`)[1];
    
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    const result = await s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified
    };
  } catch (error) {
    console.error('Error getting file info from S3:', error);
    throw error;
  }
}

/**
 * Создание подписанного URL для временного доступа
 * @param {string} key - Ключ файла в S3
 * @param {number} expiresIn - Время жизни URL в секундах
 * @returns {string} - Подписанный URL
 */
function getSignedUrl(key, expiresIn = 3600) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn
  };
  
  return s3.getSignedUrl('getObject', params);
}

module.exports = {
  uploadFile,
  uploadPhoto,
  uploadDocument,
  uploadReport,
  deleteFile,
  getFileInfo,
  getSignedUrl
};
