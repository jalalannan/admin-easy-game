import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { hashPassword } from '@/lib/crypto-edge';

export const runtime = 'edge';

/**
 * API Route for updating students with Web Crypto password hashing
 * Compatible with Edge Runtime for Cloudflare Pages
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

    const studentRef = doc(db, 'students', studentId);

    // Check if email is being updated and if it already exists for another student
    if (studentData.email) {
      // Get the current student document
      const currentDoc = await getDoc(studentRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : null;

      // If the email is being changed
      if (currentData && currentData.email !== studentData.email) {
        // Query for any other student with the same email
        const emailQuery = query(
          collection(db, 'students'),
          where('email', '==', studentData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        // If another student with this email exists (excluding this student)
        const emailExists = emailSnapshot.docs.some(doc => doc.id !== studentId);

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
      updated_at: serverTimestamp(),
    };

    // Only hash and update password if a new password is provided
    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
      console.log('🔐 Password updated with Web Crypto hash');
    }

    // Remove undefined/null values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await updateDoc(studentRef, cleanedData);

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

