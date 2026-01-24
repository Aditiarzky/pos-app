// services/uploadService.ts
import { axiosInstance } from "@/lib/axios";

export type UploadImageResponse = {
  success: boolean;
  publicId: string;
  secureUrl: string;
};

export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post("/upload/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
