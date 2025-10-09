import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_ENDPOINT || 'nyc3.digitaloceanspaces.com'}`,
  region: process.env.DO_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SECRET_KEY || '',
  },
});

/**
 * API Route for uploading files to DigitalOcean Spaces
 * 
 * Flow:
 * 1. Upload to: test/storage/uploads/image.jpg (or live/storage/uploads/ in production)
 * 2. Store in DB: /storage/uploads/image.jpg (without test/ or live/)
 * 3. Display as: https://bucket.endpoint/test/storage/uploads/image.jpg
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `image${randomString}-${timestamp}.${extension}`;

    // Determine environment prefix for S3 upload
    const isProduction = process.env.NODE_ENV === 'production';
    const envPrefix = isProduction ? 'live' : 'test';
    
    // S3 object key includes environment: test/storage/uploads/image.jpg
    const s3ObjectKey = `${envPrefix}/storage/uploads/${filename}`;
    
    // DB storage path excludes environment: /storage/uploads/image.jpg
    const dbStoragePath = `/storage/uploads/${filename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to DigitalOcean Spaces
    const command = new PutObjectCommand({
      Bucket: process.env.DO_BUCKET || 'oureasygamestoreage',
      Key: s3ObjectKey,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // Cache for 1 year
    });

    await s3Client.send(command);

    // Build full CDN URL for preview
    const cdnUrl = process.env.NEXT_PUBLIC_DO_CDN_URL || 
      `https://${process.env.DO_BUCKET || 'oureasygamestoreage'}.${process.env.DO_ENDPOINT || 'nyc3.digitaloceanspaces.com'}`;
    const fullUrl = `${cdnUrl}/${s3ObjectKey}`;

    console.log('✅ Upload successful:', {
      s3ObjectKey,
      dbStoragePath,
      fullUrl,
    });

    return NextResponse.json({
      success: true,
      storagePath: dbStoragePath, // Store this in database
      url: fullUrl, // Use this for preview
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

