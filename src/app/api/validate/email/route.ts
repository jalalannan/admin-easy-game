import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, excludeId, collection } = body;

    if (!email || !collection) {
      return NextResponse.json(
        { success: false, error: 'Email and collection are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking if email exists: ${email} in ${collection}`);

    // Check in the specified collection
    let query = adminDb.collection(collection).where('email', '==', email);
    const snapshot = await query.get();

    // Filter out the current record if excludeId is provided (for edit mode)
    const duplicates = snapshot.docs.filter(doc => doc.id !== excludeId);

    const exists = duplicates.length > 0;

    if (exists) {
      console.log(`❌ Email already exists: ${email}`);
      return NextResponse.json({
        success: true,
        exists: true,
        message: `This email is already registered in ${collection}`
      });
    }

    console.log(`✅ Email is available: ${email}`);
    return NextResponse.json({
      success: true,
      exists: false,
      message: 'Email is available'
    });

  } catch (error) {
    console.error('❌ Email validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate email' 
      },
      { status: 500 }
    );
  }
}

