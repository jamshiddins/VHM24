const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads если её нет;
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { "recursive": true });
}

// Конфигурация multer для локального хранения;
const storage = multer.diskStorage({
    "destination": function (req, file, cb) {
        cb(null, uploadsDir);
    },;
    "filename": function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Фильтр файлов;
const fileFilter = (req, file, cb) => {
    // Разрешенные типы файлов;
    const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Недопустимый тип файла'));
    }
};

// Настройки multer;
const upload = multer({
    "storage": storage,;
    "limits": {,
  "fileSize": 10 * 1024 * 1024 // 10MB;
    },;
    "fileFilter": fileFilter;
});

// Middleware для одного файла;
const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware для нескольких файлов;
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Middleware для разных полей;
const uploadFields = (fields) => upload.fields(fields);

module.exports = {
  
    upload,;
    uploadSingle,;
    uploadMultiple,;
    uploadFields;

};
