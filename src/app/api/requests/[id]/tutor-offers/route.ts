import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    
    const snapshot = await adminDb
      .collection('requests')
      .doc(requestId)
      .collection('tutor_offers')
      .orderBy('created_at', 'desc')
      .get();
    
    const offers = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error('Error fetching tutor offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tutor offers' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    const { tutorId, price } = body;
    
    if (!tutorId || !price) {
      return NextResponse.json(
        { error: 'Tutor ID and price are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    
    const newOffer = {
      tutor_id: tutorId,
      price: price,
      request_id: requestId,
      status: 'PENDING',
      cancel_reason: null,
      created_at: now,
      updated_at: now
    };
    
    const docRef = await adminDb
      .collection('requests')
      .doc(requestId)
      .collection('tutor_offers')
      .add(newOffer);
    
    return NextResponse.json({ 
      id: docRef.id,
      message: 'Tutor offer created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating tutor offer:', error);
    return NextResponse.json(
      { error: 'Failed to create tutor offer' },
      { status: 500 }
    );
  }
}
