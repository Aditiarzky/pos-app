type CompressImageOptions = {
  quality?: number;
  maxWidth?: number;
  preserveTransparency?: boolean;
};

export async function compressImage(
  file: File,
  options: number | CompressImageOptions = 0.7,
): Promise<File> {
  const normalizedOptions =
    typeof options === "number"
      ? { quality: options, maxWidth: 1500, preserveTransparency: false }
      : {
        quality: options.quality ?? 0.7,
        maxWidth: options.maxWidth ?? 1500,
        preserveTransparency: options.preserveTransparency ?? false,
      };

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, normalizedOptions.maxWidth / img.width);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const outputType =
        normalizedOptions.preserveTransparency && file.type === "image/png"
          ? "image/png"
          : "image/jpeg";
      const outputName =
        outputType === "image/png"
          ? file.name.replace(/\.[^.]+$/, ".png")
          : file.name.replace(/\.[^.]+$/, ".jpg");

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }
          resolve(new File([blob], outputName, { type: outputType }));
          URL.revokeObjectURL(url);
        },
        outputType,
        normalizedOptions.quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
