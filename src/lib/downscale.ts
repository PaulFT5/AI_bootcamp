// Browser only. Screenshots are shrunk to a 1600 px long edge before upload; smaller images go up unchanged.
export async function downscaleImage(file: Blob, maxEdge = 1600): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = maxEdge / Math.max(img.width, img.height);
  if (scale >= 1) {
    img.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("could not encode the image"))), "image/jpeg", 0.85),
  );
}
