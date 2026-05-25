import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
}

export async function uploadImage(
  file: string | Buffer,
  folder: string = 'linkmedicalspaces/listings'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, height: 800, crop: 'limit' },
      ],
    }
  )

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
  }
}

export async function deleteImage(publicId: string, resourceType: string = 'image'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export async function uploadVideo(
  file: string | Buffer,
  folder: string = 'linkmedicalspaces/listings'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:video/mp4;base64,${file.toString('base64')}`,
    {
      folder,
      resource_type: 'video',
      eager: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }
  )

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    width: result.width || 0,
    height: result.height || 0,
  }
}

export function getOptimizedUrl(publicId: string, width?: number, height?: number): string {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...(width && { width }),
    ...(height && { height }),
    crop: 'fill',
    secure: true,
  })
}
