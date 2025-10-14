import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'change_status':
        await changeRequestStatus(requestId, data.status, data.reason);
        break;
      case 'assign_tutor':
        await assignTutor(requestId, data.tutorId, data.tutorPrice);
        break;
      case 'assign_student':
        await assignStudent(requestId, data.studentId, data.studentPrice);
        break;
      case 'set_tutor_price':
        await setTutorPrice(requestId, data.tutorPrice);
        break;
      case 'set_student_price':
        await setStudentPrice(requestId, data.studentPrice);
        break;
      case 'cancel':
        await cancelRequest(requestId, data.reason);
        break;
      case 'complete':
        await completeRequest(requestId, data.feedback);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message: 'Action completed successfully' });
  } catch (error: any) {
    console.error('Error performing request action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

async function changeRequestStatus(requestId: string, status: string, reason?: string) {
  const normalizedStatus = status.toLowerCase();
  const updateData: any = {
    request_status: normalizedStatus,
    updated_at: new Date()
  };
  
  if (reason) {
    updateData.cancel_reason = reason;
  }
  
  // Handle specific status changes
  if (normalizedStatus === 'cancelled') {
    updateData.cancelled = '1';
    updateData.cancel_reason = reason || 'Cancelled by admin';
  } else if (normalizedStatus === 'completed') {
    updateData.completed = '1';
    updateData.accepted = '1';
  } else if (normalizedStatus === 'ongoing') {
    updateData.accepted = '1';
  }
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function assignTutor(requestId: string, tutorId: string, tutorPrice: string) {
  const updateData = {
    tutor_id: tutorId,
    tutor_price: tutorPrice,
    tutor_accepted: '1',
    request_status: 'ongoing',
    updated_at: new Date()
  };
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function assignStudent(requestId: string, studentId: string, studentPrice: string) {
  const updateData = {
    student_id: studentId,
    student_price: studentPrice,
    updated_at: new Date()
  };
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function setTutorPrice(requestId: string, tutorPrice: string) {
  const updateData = {
    tutor_price: tutorPrice,
    updated_at: new Date()
  };
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function setStudentPrice(requestId: string, studentPrice: string) {
  const updateData = {
    student_price: studentPrice,
    updated_at: new Date()
  };
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function cancelRequest(requestId: string, reason: string) {
  const updateData = {
    request_status: 'cancelled',
    cancelled: '1',
    cancel_reason: reason,
    updated_at: new Date()
  };
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}

async function completeRequest(requestId: string, feedback?: string) {
  const updateData: any = {
    request_status: 'completed',
    completed: '1',
    accepted: '1',
    updated_at: new Date()
  };
  
  if (feedback) {
    updateData.feedback = feedback;
  }
  
  await adminDb.collection('requests').doc(requestId).update(updateData);
}
