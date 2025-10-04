import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

class CloudinaryService {
  async uploadReceipt(fileBuffer, fileName) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'expencify/receipts',
          public_id: `receipt_${Date.now()}_${fileName}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );

      const readableStream = Readable.from(fileBuffer);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteReceipt(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }
}

export default new CloudinaryService();
