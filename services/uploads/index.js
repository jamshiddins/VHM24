
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;

// S3 Client для DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: 'https://vhm24-uploads.fra1.digitaloceanspaces.com',
  region: 'fra1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

// Multer для обработки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Uploads Service',
    timestamp: new Date().toISOString(),
    spaces_endpoint: 'https://vhm24-uploads.fra1.digitaloceanspaces.com'
  });
});

// Загрузка файла
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const key = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: 'vhm24-uploads',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    });

    await s3Client.send(command);

    const fileUrl = `https://vhm24-uploads.fra1.digitaloceanspaces.com/${key}`;

    res.json({
      success: true,
      fileName,
      fileUrl,
      size: req.file.size,
      contentType: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Получение подписанного URL
app.get('/signed-url/:key', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'vhm24-uploads',
      Key: req.params.key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Удаление файла
app.delete('/delete/:key', async (req, res) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: 'vhm24-uploads',
      Key: req.params.key
    });

    await s3Client.send(command);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => {
  console.log(`VHM24 Uploads Service running on port ${PORT}`);
});
