// S3 Storage Adapter for Railway deployment
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class S3StorageAdapter {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    this.bucket = process.env.S3_BUCKET;
    
    if (!this.bucket) {
      console.warn('⚠️ S3_BUCKET not configured, using local storage fallback');
    }
  }

  async upload(key, buffer, contentType = 'application/octet-stream') {
    if (!this.bucket) {
      return this.localFallback('upload', key, buffer);
    }
    
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      };
      
      const result = await this.s3.upload(params).promise();
      return {
        success: true,
        url: result.Location,
        key: result.Key
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return this.localFallback('upload', key, buffer);
    }
  }
  
  async download(key) {
    if (!this.bucket) {
      return this.localFallback('download', key);
    }
    
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      const result = await this.s3.getObject(params).promise();
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType
      };
    } catch (error) {
      console.error('S3 download error:', error);
      return this.localFallback('download', key);
    }
  }
  
  getSignedUrl(key, expires = 3600) {
    if (!this.bucket) {
      return `/uploads/${key}`;
    }
    
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expires
      });
    } catch (error) {
      console.error('S3 signed URL error:', error);
      return `/uploads/${key}`;
    }
  }
  
  async delete(key) {
    if (!this.bucket) {
      return this.localFallback('delete', key);
    }
    
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }).promise();
      
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Локальный fallback для разработки
  localFallback(operation, key, data) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, key);
    
    switch (operation) {
      case 'upload':
        fs.writeFileSync(filePath, data);
        return {
          success: true,
          url: `/uploads/${key}`,
          key: key,
          fallback: true
        };
        
      case 'download':
        if (fs.existsSync(filePath)) {
          return {
            success: true,
            data: fs.readFileSync(filePath),
            fallback: true
          };
        }
        return { success: false, error: 'File not found' };
        
      case 'delete':
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return { success: true, fallback: true };
        
      default:
        return { success: false, error: 'Unknown operation' };
    }
  }
}

module.exports = S3StorageAdapter;