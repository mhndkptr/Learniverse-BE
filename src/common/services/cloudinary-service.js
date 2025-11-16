import { v2 as cloudinary } from "cloudinary";
import BaseError from "../../base-classes/base-error.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  async uploadToCloudinary(filePath, folderName = "uploads") {
    if (!filePath) {
      throw BaseError.badGateway(
        "Cloudinary",
        "File path is required for upload."
      );
    }

    try {
      const result = await this.cloudinary.uploader.upload(filePath, {
        folder: folderName,
        resource_type: "auto",
      });
      return result;
    } catch (error) {
      throw BaseError.badGateway("Cloudinary", "Failed to upload file.");
    }
  }

  async uploadFromBufferToCloudinary(buffer, folder) {
    if (!buffer) {
      throw BaseError.badGateway(
        "Cloudinary",
        "Buffer is required for upload."
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "uploads",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  }

  async deleteFromUrlsCloudinary(urls = []) {
    try {
      if (!Array.isArray(urls) || urls.length === 0) return;

      const publicIds = urls.map(this.getPublicIdFromUrl).filter(Boolean);

      if (publicIds.length !== urls.length) {
        throw BaseError.badGateway(
          "Cloudinary",
          "Some URLs are invalid or do not contain valid public IDs."
        );
      }

      await Promise.all(
        publicIds.map((id) =>
          this.cloudinary.uploader.destroy(id, { invalidate: true })
        )
      );

      const result = await this.cloudinary.uploader.destroy(publicIds);
      return result;
    } catch (error) {
      throw BaseError.badGateway("Cloudinary", "Failed to delete file.");
    }
  }

  getPublicIdFromUrl(url) {
    const decodedUrl = decodeURIComponent(url);
    const regex = /\/(?:[^/]+\/)*v\d+\/(.+?)\.[a-z0-9]+$/i;
    const match = decodedUrl.match(regex);
    return match ? match[1] : null;
  }
}
