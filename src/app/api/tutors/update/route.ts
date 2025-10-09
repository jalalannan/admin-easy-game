import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

/**
 * API Route for updating tutors with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/tutors/update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tutorId, password, ...tutorData } = body;

    if (!tutorId) {
      return NextResponse.json(
        { success: false, error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    const tutorRef = adminDb.collection('tutors').doc(tutorId);

    // Check if email is being updated and if it already exists for another tutor
    // If email is being updated, check if it already exists for another tutor
    if (tutorData.email) {
      // Get the current tutor document
      const currentDoc = await tutorRef.get();
      const currentData = currentDoc.exists ? currentDoc.data() : null;

      // If the email is being changed
      if (currentData && currentData.email !== tutorData.email) {
        // Query for any other tutor with the same email
        const emailQuery = await adminDb
          .collection('tutors')
          .where('email', '==', tutorData.email)
          .get();

        // If another tutor with this email exists (excluding this tutor)
        const emailExists = emailQuery.docs.some(doc => doc.id !== tutorId);

        if (emailExists) {
          return NextResponse.json(
            { success: false, error: 'Email already exists for another tutor' },
            { status: 409 }
          );
        }
      }
    }

    // Check if phone is being updated and if it already exists for another tutor
    if (tutorData.phone) {
      // Get the current tutor document
      const currentDoc = await tutorRef.get();
      const currentData = currentDoc.exists ? currentDoc.data() : null;

      // If the phone is being changed
      if (currentData && currentData.phone !== tutorData.phone) {
        // Query for any other tutor with the same phone
        const phoneQuery = await adminDb
          .collection('tutors')
          .where('phone', '==', tutorData.phone)
          .get();

        // If another tutor with this phone exists (excluding this tutor)
        const phoneExists = phoneQuery.docs.some(doc => doc.id !== tutorId);

        if (phoneExists) {
          return NextResponse.json(
            { success: false, error: 'Phone already exists for another tutor' },
            { status: 409 }
          );
        }
      }
    }

    // Check if phone is being updated and if it already exists for another tuto
    // Prepare update data
    const updateData: any = {
      ...tutorData,
      updated_at: FieldValue.serverTimestamp(),
    };

    // Only hash and update password if a new password is provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      console.log('🔐 Password updated with bcrypt hash');
    }

    // Remove undefined/null values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await tutorRef.update(cleanedData);

    console.log('✅ Tutor updated:', tutorId);

    return NextResponse.json({
      success: true,
      tutorId,
      message: 'Tutor updated successfully',
    });
  } catch (error) {
    console.error('❌ Update tutor error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update tutor' 
      },
      { status: 500 }
    );
  }
}

