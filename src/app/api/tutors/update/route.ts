import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { hashPassword } from '@/lib/crypto-edge';

export const runtime = 'edge';

/**
 * API Route for updating tutors with Web Crypto password hashing
 * Compatible with Edge Runtime for Cloudflare Pages
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

    const tutorRef = doc(db, 'tutors', tutorId);

    // Check if email is being updated and if it already exists for another tutor
    if (tutorData.email) {
      // Get the current tutor document
      const currentDoc = await getDoc(tutorRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : null;

      // If the email is being changed
      if (currentData && currentData.email !== tutorData.email) {
        // Query for any other tutor with the same email
        const emailQuery = query(
          collection(db, 'tutors'),
          where('email', '==', tutorData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        // If another tutor with this email exists (excluding this tutor)
        const emailExists = emailSnapshot.docs.some(doc => doc.id !== tutorId);

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
      const currentDoc = await getDoc(tutorRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : null;

      // If the phone is being changed
      if (currentData && currentData.phone !== tutorData.phone) {
        // Query for any other tutor with the same phone
        const phoneQuery = query(
          collection(db, 'tutors'),
          where('phone', '==', tutorData.phone)
        );
        const phoneSnapshot = await getDocs(phoneQuery);

        // If another tutor with this phone exists (excluding this tutor)
        const phoneExists = phoneSnapshot.docs.some(doc => doc.id !== tutorId);

        if (phoneExists) {
          return NextResponse.json(
            { success: false, error: 'Phone already exists for another tutor' },
            { status: 409 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      ...tutorData,
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

    await updateDoc(tutorRef, cleanedData);

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

