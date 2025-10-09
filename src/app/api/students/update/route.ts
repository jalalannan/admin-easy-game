export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';


/**
 * API Route for updating students with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/students/update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, password, ...studentData } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const studentRef = adminDb.collection('students').doc(studentId);

    // Check if email is being updated and if it already exists for another student
    if (studentData.email) {
      // Get the current student document
      const currentDoc = await studentRef.get();
      const currentData = currentDoc.exists ? currentDoc.data() : null;

      // If the email is being changed
      if (currentData && currentData.email !== studentData.email) {
        // Query for any other student with the same email
        const emailQuery = await adminDb
          .collection('students')
          .where('email', '==', studentData.email)
          .get();

        // If another student with this email exists (excluding this student)
        const emailExists = emailQuery.docs.some(doc => doc.id !== studentId);

        if (emailExists) {
          return NextResponse.json(
            { success: false, error: 'Email already exists for another student' },
            { status: 409 }
          );
        }
      }
    }
    // Prepare update data
    const updateData: any = {
      ...studentData,
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

    await studentRef.update(cleanedData);

    console.log('✅ Student updated:', studentId);

    return NextResponse.json({
      success: true,
      studentId,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error('❌ Update student error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update student' 
      },
      { status: 500 }
    );
  }
}

