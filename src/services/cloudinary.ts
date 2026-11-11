import { ENV } from '../config/env';

/** Sube imagen a Cloudinary (unsigned preset). En mock retorna la URI local. */
export async function uploadImage(uri: string, folder = 'drivers'): Promise<string> {
  if (ENV.USE_MOCK || !ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_UPLOAD_PRESET) {
    return uri;
  }
  const form = new FormData();
  form.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as unknown as Blob);
  form.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) throw new Error('Error subiendo imagen');
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}
