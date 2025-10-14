import { NextRequest, NextResponse } from 'next/server';
import adminApp, { adminDb } from '@/config/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    
    const doc = await adminDb.collection('requests').doc(requestId).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestData = {
      id: doc.id,
      ...doc.data()
    };

    return NextResponse.json({ request: requestData });
  } catch (error: any) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    
    const updateData = {
      ...body,
      updated_at: new Date()
    };

    // Normalize request_status to lowercase
    if (body.request_status) {
      updateData.request_status = body.request_status.toLowerCase();
    }

    // Handle file arrays
    if (body.file_links) {
      updateData.file_links = JSON.stringify(body.file_links);
    }
    
    if (body.file_names) {
      updateData.file_names = JSON.stringify(body.file_names);
    }

    await adminDb.collection('requests').doc(requestId).update(updateData);
    
    return NextResponse.json({ message: 'Request updated successfully' });
  } catch (error: any) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    
    await adminDb.collection('requests').doc(requestId).delete();
    
    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
