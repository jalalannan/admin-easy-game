/**
 * File upload utility for DigitalOcean Spaces (S3-compatible)
 * This is a client-side implementation that should ideally be moved to a server-side API route
 * for security reasons (to keep credentials safe)
 */

import { fetchWithProgress } from './api-progress';

// Note: For production, move these to environment variables and use server-side upload
const DIGITALOCEAN_CONFIG = {
  accessKey: process.env.DO_ACCESS_KEY || 'DO00VGD7ETVFT6WLBMMV',
  secretKey: process.env.DO_SECRET_KEY || '6KN1QxgURxFCGR5f0m37k0XFldVlgtzhrVYASa8wLA8',
  bucket: process.env.DO_BUCKET || 'oureasygamestoreage',
  endpoint: process.env.DO_ENDPOINT || 'nyc3.digitaloceanspaces.com',
  region: process.env.DO_REGION || 'nyc3',
};

/**
 * Generate a unique filename using timestamp and random string
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop()?.toLowerCase() || '';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Upload file to DigitalOcean Spaces
 */
export async function uploadFileToDigitalOcean(
  file: File,
  isProduction: boolean = false
): Promise<string> {
  console.log('=== DIGITALOCEAN UPLOAD START ===');
  console.log('File name:', file.name);
  console.log('File size:', file.size, 'bytes');
  console.log('File type:', file.type);

  try {
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    console.log('Generated filename:', uniqueFilename);

    // Determine upload directory based on environment
    const destDir = isProduction ? 'live/storage/uploads' : 'test/storage/uploads';
    const objectPath = `${destDir}/${uniqueFilename}`;
    console.log('Object path:', objectPath);

    // Get content type
    const contentType = getContentType(file.name);
    console.log('Content type:', contentType);

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Create upload URL using AWS S3 signature v4
    const url = `https://${DIGITALOCEAN_CONFIG.bucket}.${DIGITALOCEAN_CONFIG.endpoint}/${objectPath}`;

    // For now, we'll use a simple PUT request with CORS
    // In production, this should be done server-side or use pre-signed URLs
    const response = await fetchWithProgress('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: uniqueFilename,
        contentType: contentType,
        fileSize: file.size,
        destDir: destDir,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const storagePath = `/${objectPath}`;

    console.log('=== DIGITALOCEAN UPLOAD SUCCESS ===');
    console.log('Storage path:', storagePath);
    console.log('Full URL:', `https://${DIGITALOCEAN_CONFIG.bucket}.${DIGITALOCEAN_CONFIG.endpoint}${storagePath}`);

    return storagePath;
  } catch (error) {
    console.error('=== DIGITALOCEAN UPLOAD ERROR ===');
    console.error('Error:', error);
    throw new Error(`Upload failed: ${error}`);
  }
}

/**
 * Delete file from DigitalOcean Spaces
 */
export async function deleteFileFromDigitalOcean(storagePath: string): Promise<boolean> {
  console.log('=== DIGITALOCEAN DELETE START ===');
  console.log('Storage path:', storagePath);

  if (!storagePath || storagePath.trim() === '') {
    console.log('=== DIGITALOCEAN DELETE SKIPPED - EMPTY PATH ===');
    return true;
  }

  try {
    const response = await fetchWithProgress('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    console.log('=== DIGITALOCEAN DELETE SUCCESS ===');
    return true;
  } catch (error) {
    console.error('=== DIGITALOCEAN DELETE ERROR ===');
    console.error('Error:', error);
    return false;
  }
}

/**
 * Get full URL from storage path
 */
export function getFullUrlFromStoragePath(storagePath: string): string {
  if (!storagePath) return '';
  
  // If it's already a data URL or full URL, return as is
  if (storagePath.startsWith('data:') || storagePath.startsWith('http')) {
    return storagePath;
  }
  
  // Add environment prefix (test/ or live/) to storage path
  let envPrefix = '';
  if (
    storagePath.startsWith('live/') ||
    storagePath.startsWith('/live/') ||
    storagePath.startsWith('test/') ||
    storagePath.startsWith('/test/')
  ) {
    console.log("start with")
    envPrefix = '';
  } else {
    const isProduction = process.env.NODE_ENV === 'production';
    envPrefix = isProduction ? 'live' : 'test';
  }
  
  // Storage path format: /storage/uploads/image.jpg
  // Full path becomes: test/storage/uploads/image.jpg or live/storage/uploads/image.jpg
  const cleanPath = storagePath.startsWith('/') ? storagePath.substring(1) : storagePath;
  const fullPath = envPrefix ? `${envPrefix}/${cleanPath}` : cleanPath;
  
  return `https://${DIGITALOCEAN_CONFIG.bucket}.${DIGITALOCEAN_CONFIG.endpoint}/${fullPath}`;
}

/**
 * Get image URL for display (handles base64, full URLs, and storage paths)
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Base64 data URL - return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Full HTTP/HTTPS URL - return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Storage path - convert to full CDN URL
  return getFullUrlFromStoragePath(imagePath);
}

/**
 * Simple client-side upload (less secure, for development only)
 * In production, always use server-side upload endpoints
 */
export async function uploadFileDirectly(file: File, isProduction: boolean = false): Promise<string> {
  console.log('=== DIRECT UPLOAD (DEVELOPMENT ONLY) ===');
  console.log('File:', file.name, file.size, 'bytes');

  // For now, we'll just simulate the upload and return a placeholder path
  // In a real implementation, you'd need to implement AWS S3 signature v4 authentication
  const uniqueFilename = generateUniqueFilename(file.name);
  const destDir = isProduction ? 'live/storage/uploads' : 'test/storage/uploads';
  const storagePath = `/${destDir}/${uniqueFilename}`;

  // This is a placeholder - actual upload would happen here
  console.warn('Direct upload not implemented for security reasons. Use API route instead.');
  
  return storagePath;
}

