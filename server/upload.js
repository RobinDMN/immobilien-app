/**
 * Simple Express server for image uploads
 * Handles uploading and deleting images per object
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, '../uploads');
await fs.mkdir(UPLOADS_DIR, { recursive: true });

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const objectId = req.params.objectId;
    const objectDir = path.join(UPLOADS_DIR, objectId);
    await fs.mkdir(objectDir, { recursive: true });
    cb(null, objectDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
  }
});

// Upload image for an object
app.post('/api/objects/:objectId/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.params.objectId}/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all images for an object
app.get('/api/objects/:objectId/images', async (req, res) => {
  try {
    const objectDir = path.join(UPLOADS_DIR, req.params.objectId);
    
    try {
      const files = await fs.readdir(objectDir);
      const images = files
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/uploads/${req.params.objectId}/${file}`
        }));
      
      res.json({ images });
    } catch (err) {
      // Directory doesn't exist yet
      res.json({ images: [] });
    }
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific image
app.delete('/api/objects/:objectId/images/:filename', async (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.objectId, req.params.filename);
    
    await fs.unlink(filePath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Upload server running on port ${PORT}`);
});
