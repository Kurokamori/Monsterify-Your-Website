import { Router, Request, Response } from 'express';
import { upload } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import cloudinary from '../../utils/cloudinary';
import fs from 'fs';

const router = Router();

// General-purpose Cloudinary upload endpoint
router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    const folder = (req.body.folder as string) || 'uploads';

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      use_filename: true,
    });

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

export default router;
