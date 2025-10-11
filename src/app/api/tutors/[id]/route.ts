export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

/**
 * API Route for fetching a tutor by ID
 * GET /api/tutors/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tutorId = id;

    if (!tutorId) {
      return NextResponse.json(
        { success: false, error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // Fetch tutor by ID
    const tutorDoc = await adminDb.collection('tutors').doc(tutorId).get();

    if (!tutorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Tutor not found' },
        { status: 404 }
      );
    }

    const tutor = {
      id: tutorDoc.id,
      ...tutorDoc.data()
    };

    return NextResponse.json({
      success: true,
      tutor
    });

  } catch (error) {
    console.error('❌ Tutor fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tutor' 
      },
      { status: 500 }
    );
  }
}
