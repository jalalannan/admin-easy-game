export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

/**
 * API Route for searching tutors by email
 * GET /api/tutors/search?email=example@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Search for tutors by email
    const tutorsQuery = await adminDb
      .collection('tutors')
      .where('email', '>=', email)
      .where('email', '<=', email + '\uf8ff')
      .where('deleted_at', '==', null)
      .limit(10)
      .get();

    const tutors = tutorsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      tutors
    });

  } catch (error) {
    console.error('❌ Tutor search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search tutors' 
      },
      { status: 500 }
    );
  }
}
