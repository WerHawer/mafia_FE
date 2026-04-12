import { Area } from "react-easy-crop";

/**
 * Generates a cropped image Blob from a source image URL and crop area.
 * Uses HTML5 Canvas to perform the crop, scale and rotation.
 */
export const getCroppedImage = async (
  imageSrc: string,
  cropArea: Area,
  rotation = 0
): Promise<Blob> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const { width: imageWidth, height: imageHeight } = getRotatedImageSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to the rotated image bounding box
  const safeArea = Math.max(imageWidth, imageHeight) * 2;
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Translate and rotate around canvas center
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  // Extract cropped area
  const data = ctx.getImageData(
    cropArea.x + safeArea / 2 - image.width / 2,
    cropArea.y + safeArea / 2 - image.height / 2,
    cropArea.width,
    cropArea.height
  );

  // Resize canvas to the crop area
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  ctx.putImageData(data, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getRotatedImageSize = (
  width: number,
  height: number,
  rotation: number
) => {
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: Math.round(height * sin + width * cos),
    height: Math.round(height * cos + width * sin),
  };
};

