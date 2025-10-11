export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

/**
 * API Route for updating tutor payment status
 * PUT /api/requests/[id]/tutor-paid
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    const { tutor_paid } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    if (typeof tutor_paid !== 'string' || !['0', '1'].includes(tutor_paid)) {
      return NextResponse.json(
        { success: false, error: 'tutor_paid must be "0" or "1"' },
        { status: 400 }
      );
    }

    // Update the tutor_paid field
    await adminDb.collection('requests').doc(requestId).update({
      tutor_paid: tutor_paid,
      updated_at: new Date().toISOString()
    });

    console.log('✅ Tutor payment status updated:', {
      requestId,
      tutor_paid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Tutor payment status updated to ${tutor_paid === '1' ? 'paid' : 'pending'}`,
      tutor_paid
    });

  } catch (error) {
    console.error('❌ Tutor payment update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update tutor payment status' 
      },
      { status: 500 }
    );
  }
}
