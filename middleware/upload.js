const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');  // Destination folder for image uploads
    },
    filename: (req, file, cb) => {
        // Save the file with its original extension and a timestamp to avoid name clashes
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
};

// Initialize multer with the defined storage and file filter
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // Max file size: 5MB
    fileFilter
});

module.exports = upload;
