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
 * Flow:
 * 1. Receives storage path: /storage/uploads/image.jpg
 * 2. Determines environment prefix: test/ or live/
 * 3. Constructs S3 object key: test/storage/uploads/image.jpg
 * 4. Deletes from DigitalOcean Spaces bucket
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath } = body;
    
    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // Validate storage path format
    const hasValidFormat = storagePath.startsWith('/storage/uploads/') || 
                          storagePath.startsWith('/test/storage/uploads/') || 
                          storagePath.startsWith('/live/storage/uploads/');
    
    if (!hasValidFormat) {
      return NextResponse.json(
        { success: false, error: 'Invalid storage path format' },
        { status: 400 }
      );
    }

    // Determine environment prefix for S3 deletion
    const isProduction = process.env.NODE_ENV === 'production';
    const envPrefix = isProduction ? 'live' : 'test';
    
    // Check if storage path already has environment prefix
    let s3ObjectKey: string;
    if (storagePath.startsWith('/test/') || storagePath.startsWith('/live/')) {
      // Path already has environment prefix, use as is
      s3ObjectKey = storagePath.substring(1); // Remove leading slash
    } else {
      // Path doesn't have prefix, add environment prefix
      s3ObjectKey = `${envPrefix}${storagePath}`;
    }

    console.log('🗑️ Attempting to delete file:', {
      storagePath,
      s3ObjectKey,
      environment: envPrefix
    });

    // Delete from DigitalOcean Spaces
    const command = new DeleteObjectCommand({
      Bucket: process.env.DO_BUCKET || 'oureasygamestoreage',
      Key: s3ObjectKey,
    });

    await s3Client.send(command);

    console.log('✅ File deleted successfully:', {
      s3ObjectKey,
      storagePath
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deletedPath: storagePath
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}