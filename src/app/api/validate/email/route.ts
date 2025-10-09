import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, excludeId, collection: collectionName } = body;

    if (!email || !collectionName) {
      return NextResponse.json(
        { success: false, error: 'Email and collection are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking if email exists: ${email} in ${collectionName}`);

    // Check in the specified collection
    const emailQuery = query(
      collection(db, collectionName),
      where('email', '==', email)
    );
    const snapshot = await getDocs(emailQuery);

    // Filter out the current record if excludeId is provided (for edit mode)
    const duplicates = snapshot.docs.filter(doc => doc.id !== excludeId);

    const exists = duplicates.length > 0;

    if (exists) {
      console.log(`❌ Email already exists: ${email}`);
      return NextResponse.json({
        success: true,
        exists: true,
        message: `This email is already registered in ${collectionName}`
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

