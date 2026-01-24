import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Fungsi pembantu (helper) untuk upload menggunakan Buffer
 * karena API Route Next.js bekerja dengan data stream/buffer
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "products",
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder,
          format: "webp", // Mengubah semua upload menjadi webp
          transformation: [
            { quality: "auto" }, // Optimasi kualitas otomatis
            { fetch_format: "webp" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      )
      .end(fileBuffer);
  });
};
