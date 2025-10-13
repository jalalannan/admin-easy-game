import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const requestId = id;
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const body = await request.json();
    
    const { message, messageType = 'text' } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Validate message type
    const validMessageTypes = [
      'text', 'voice', 'image', 'file', 'requestcreated', 'bidinvite', 
      'bidinviterejected', 'tutorbid', 'tutoreditbid', 'studentreject',
      'requesttaken', 'studentchangemind', 'studentaccept', 'studentpaid',
      'studentongoing', 'tutorcomplete', 'studentacceptcomplete',
      'studentrejectcomplete', 'studentcancelrequest', 'tutordeclineaccepted',
      'zoomcreated', 'zoomready'
    ];
    
    if (!validMessageTypes.includes(messageType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }
    
    // Find the specific chat document
    let chatDoc = null;
    
    if (chatId) {
      // Use the provided chatId
      const chatDocSnapshot = await adminDb
        .collection('request_chats')
        .doc(chatId)
        .get();
      
      if (chatDocSnapshot.exists) {
        chatDoc = chatDocSnapshot;
      }
    } else {
      // If no chatId provided, get the first available chat for this request
      const chatQuerySnapshot = await adminDb
        .collection('request_chats')
        .where('request_id', '==', requestId)
        .limit(1)
        .get();
      
      chatDoc = chatQuerySnapshot.empty ? null : chatQuerySnapshot.docs[0];
    }
    
    if (!chatDoc || !chatDoc.exists) {
      return NextResponse.json(
        { error: 'Chat not found. Please select a valid chat.' },
        { status: 404 }
      );
    }
    
    // Get the message to edit
    const messageDoc = await adminDb
      .collection('request_chats')
      .doc(chatDoc.id)
      .collection('messages')
      .doc(messageId)
      .get();
    console.log('messageDoc: ', messageId);
    console.log('chatDoc.id: ', chatDoc.id);
    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Update the message
    const updatedMessage = {
      ...messageDoc.data(),
      message,
      message_type: messageType.toLowerCase(),
      updated_at: new Date(),
      edited: true,
      edited_by: 'admin'
    };
    
    // Update the message in the subcollection
    await adminDb
      .collection('request_chats')
      .doc(chatDoc.id)
      .collection('messages')
      .doc(messageId)
      .update(updatedMessage);
    
    // Update chat document
    await adminDb.collection('request_chats').doc(chatDoc.id).update({
      updated_at: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
    
  } catch (error: any) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const requestId = id;
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    // Find the specific chat document
    let chatDoc = null;
    
    if (chatId) {
      // Use the provided chatId
      const chatDocSnapshot = await adminDb
        .collection('request_chats')
        .doc(chatId)
        .get();
      
      if (chatDocSnapshot.exists) {
        chatDoc = chatDocSnapshot;
      }
    } else {
      // If no chatId provided, get the first available chat for this request
      const chatQuerySnapshot = await adminDb
        .collection('request_chats')
        .where('request_id', '==', requestId)
        .limit(1)
        .get();
      
      chatDoc = chatQuerySnapshot.empty ? null : chatQuerySnapshot.docs[0];
    }
    
    if (!chatDoc || !chatDoc.exists) {
      return NextResponse.json(
        { error: 'Chat not found. Please select a valid chat.' },
        { status: 404 }
      );
    }
    
    // Get the message to delete
    const messageDoc = await adminDb
      .collection('request_chats')
      .doc(chatDoc.id)
      .collection('messages')
      .doc(messageId)
      .get();
    
    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Delete the message from the subcollection
    await adminDb
      .collection('request_chats')
      .doc(chatDoc.id)
      .collection('messages')
      .doc(messageId)
      .delete();
    
    // Update chat document
    await adminDb.collection('request_chats').doc(chatDoc.id).update({
      updated_at: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
