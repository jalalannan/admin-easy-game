export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
 * API Route for deleting files from DigitalOcean Spaces
 * 
 * Receives DB storage path like: /storage/uploads/image.jpg
 * Converts to S3 key: test/storage/uploads/image.jpg (or live/ in production)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath } = body;

    console.log('Delete request received:', { storagePath });

    if (!storagePath || storagePath.trim() === '') {
      return NextResponse.json({
        success: true,
        message: 'No file to delete',
      });
    }

    // Don't delete base64 data URLs or external URLs
    if (storagePath.startsWith('data:') || storagePath.startsWith('http')) {
      return NextResponse.json({
        success: true,
        message: 'Skipped deletion of external URL or data URL',
      });
    }

    // Convert DB storage path to S3 object key
    // /storage/uploads/image.jpg -> test/storage/uploads/image.jpg
    const isProduction = process.env.NODE_ENV === 'production';
    const envPrefix = isProduction ? 'live' : 'test';
    
    const pathWithoutSlash = storagePath.startsWith('/') 
      ? storagePath.substring(1) 
      : storagePath;
    
    const s3ObjectKey = `${envPrefix}/${pathWithoutSlash}`;

    const command = new DeleteObjectCommand({
      Bucket: process.env.DO_BUCKET || 'oureasygamestoreage',
      Key: s3ObjectKey,
    });

    await s3Client.send(command);

    console.log('✅ File deleted successfully:', s3ObjectKey);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    
    // If file doesn't exist, that's OK
    if (error instanceof Error && (error.message.includes('NoSuchKey') || error.message.includes('NotFound'))) {
      return NextResponse.json({
        success: true,
        message: 'File already deleted or does not exist',
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    );
  }
}

