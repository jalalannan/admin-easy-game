import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, phoneCountryCode, excludeId, collection: collectionName } = body;

    if (!phone || !collectionName) {
      return NextResponse.json(
        { success: false, error: 'Phone and collection are required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking if phone exists: ${phoneCountryCode || ''}${phone} in ${collectionName}`);

    // Check in the specified collection
    const phoneQuery = query(
      collection(db, collectionName),
      where('phone', '==', phone)
    );
    const snapshot = await getDocs(phoneQuery);

    // Filter out the current record if excludeId is provided (for edit mode)
    // Also check if country code matches (if provided)
    const duplicates = snapshot.docs.filter(doc => {
      if (doc.id === excludeId) return false;
      
      // If country code is provided, check if it matches
      if (phoneCountryCode) {
        const docData = doc.data();
        return docData.phone_country_code === phoneCountryCode;
      }
      
      return true;
    });

    const exists = duplicates.length > 0;

    if (exists) {
      console.log(`❌ Phone already exists: ${phoneCountryCode || ''}${phone}`);
      return NextResponse.json({
        success: true,
        exists: true,
        message: `This phone number is already registered in ${collectionName}`
      });
    }

    console.log(`✅ Phone is available: ${phoneCountryCode || ''}${phone}`);
    return NextResponse.json({
      success: true,
      exists: false,
      message: 'Phone number is available'
    });

  } catch (error) {
    console.error('❌ Phone validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate phone' 
      },
      { status: 500 }
    );
  }
}

