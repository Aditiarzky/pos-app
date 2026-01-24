// hooks/use-upload-image.ts
import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "@/services/uploadService";
import { MutationConfig } from "@/lib/react-query";

type UseUploadImageOptions = {
  mutationConfig?: MutationConfig<typeof uploadImage>;
};

export const useUploadImage = ({
  mutationConfig,
}: UseUploadImageOptions = {}) => {
  return useMutation({
    mutationFn: uploadImage,
    ...mutationConfig,
  });
};
