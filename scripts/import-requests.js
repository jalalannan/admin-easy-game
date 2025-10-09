/* eslint-disable no-console */
'use strict';

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
  connectFirestoreEmulator
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔗 Connected to local Firestore emulator on port 8080');
} catch (error) {
  console.log('⚠️  Already connected to emulator or using production');
  return;
}

function readJsonTable(filePath, tableName) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entry = Array.isArray(raw)
    ? raw.find((x) => x && x.type === 'table' && x.name === tableName)
    : null;
  return entry && Array.isArray(entry.data) ? entry.data : [];
}

function parseDate(value) {
  if (!value || value === 'null') return null;
  try {
    if (typeof value === 'number') return new Date(value);
    // If includes timezone Z, use as-is; otherwise, convert 'YYYY-MM-DD HH:mm:ss' to ISO-like
    if (typeof value === 'string') {
      const trimmed = value.endsWith('.000Z') ? value.slice(0, -5) + 'Z' : value;
      if (/[zZ]$/.test(trimmed)) return new Date(trimmed);
      // replace space with 'T' to better parse
      return new Date(trimmed.replace(' ', 'T'));
    }
    return null;
  } catch (_) {
    return null;
  }
}

async function importRequests() {
  const requestsPath = path.join(__dirname, 'requests.json');
  const requestTutorPath = path.join(__dirname, 'request_tutor.json');

  const requests = readJsonTable(requestsPath, 'requests');
  const tutorOffers = readJsonTable(requestTutorPath, 'request_tutor');

  // Group offers by request_id
  const offersByRequest = new Map();
  for (const offer of tutorOffers) {
    const rid = String(offer.request_id);
    if (!offersByRequest.has(rid)) offersByRequest.set(rid, []);
    offersByRequest.get(rid).push(offer);
  }

  console.log(`Found ${requests.length} requests and ${tutorOffers.length} tutor offers.`);

  const requestsRef = collection(db, 'requests');
  let processed = 0;
  let errors = 0;

  // Use batched writes (commit per ~400 ops)
  let batch = writeBatch(db);
  let ops = 0;

  async function commitIfNeeded(force = false) {
    if (ops >= 400 || force) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
      console.log('✅ Committed batch');
    }
  }

  for (const r of requests) {
    try {
      const requestId = String(r.id);
      const requestRef = doc(requestsRef, requestId);

      const requestDoc = {
        created_at: parseDate(r.created_at),
        updated_at: parseDate(r.updated_at),
        deleted_at: parseDate(r.deleted_at),
        locked: r.locked,
        cancelled: r.cancelled,
        cancel_reason: r.cancel_reason,
        version: r.version,
        label: r.label,
        description: r.description,
        description_type: r.description_type,
        field_id: r.field_id,
        subject_id: r.subject_id,
        duration: r.duration,
        assistance_type: r.assistance_type,
        exam_type: r.exam_type,
        deadline: parseDate(r.deadline),
        date: parseDate(r.date),
        time: r.time,
        timezone: r.timezone,
        grade: r.grade,
        notes: r.notes,
        language: r.language,
        completed: r.completed,
        paid: r.paid,
        is_paid: r.is_paid,
        student_id: String(r.student_id),
        accepted: r.accepted,
        receipt_submitted: r.receipt_submitted,
        omt_info: r.omt_info,
        tutor_accepted: r.tutor_accepted,
        tutor_id: r.tutor_id ? String(r.tutor_id) : null,
        answer_text: r.answer_text,
        answer_files: r.answer_files,
        student_price: r.student_price,
        tutor_price: r.tutor_price,
        min_price: r.min_price,
        discount: r.discount,
        feedback: r.feedback,
        rating: r.rating,
        comments: r.comments,
        file_links: r.file_links,
        file_names: r.file_names,
        syllabus_link: r.syllabus_link,
        field: r.field,
        subject: r.subject,
        student_nickname: r.student_nickname,
        tutor_nickname: r.tutor_nickname,
        country: r.country,
        state: r.state,
        cms_attributes: r.cms_attributes,
        saved_by: r.saved_by,
        zoom_information: r.zoom_information,
        request_status: r.request_status,
        meeting_id: r.meeting_id,
        meeting_password: r.meeting_password,
        student_meeting_url: r.student_meeting_url,
        tutor_meeting_url: r.tutor_meeting_url,
        meeting_record_url: r.meeting_record_url,
        zoom_user_id: r.zoom_user_id,
        sub_subject: r.sub_subject,
        promo_id: r.promo_id,
        issue_reported: r.issue_reported,
      };

      batch.set(requestRef, requestDoc);
      ops += 1;

      const offers = offersByRequest.get(requestId) || [];
      for (const o of offers) {
        const offerRef = doc(collection(requestRef, 'tutor_offers'), String(o.id));
        const offerDoc = {
          request_id: String(o.request_id),
          tutor_id: String(o.tutor_id),
          status: o.status,
          price: o.price,
          created_at: parseDate(o.created_at),
          updated_at: parseDate(o.updated_at),
          cancel_reason: o.cancel_reason,
        };
        batch.set(offerRef, offerDoc);
        ops += 1;
      }

      processed += 1;
      if (processed % 50 === 0) {
        console.log(`Progress: ${processed}/${requests.length} requests...`);
      }

      await commitIfNeeded(false);
    } catch (err) {
      console.error('Error processing request', r && r.id, err);
      errors += 1;
    }
  }

  await commitIfNeeded(true);

  console.log('✔ Migration completed');
  console.log(`Requests migrated: ${processed}`);
  console.log(`Errors: ${errors}`);
}

importRequests()
  .then(() => {
    console.log('All done.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  });


