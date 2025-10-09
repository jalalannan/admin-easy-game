import json
from datetime import datetime
from firebase_admin import credentials, firestore, initialize_app
from google.cloud.firestore import SERVER_TIMESTAMP
import firebase_admin

cred = credentials.Certificate('C:/Users/abokh/Desktop/oeg customer support files/serviceAccountKey.json')
initialize_app(cred)
db = firestore.client()

def parse_date(date_str):
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        return dt
    except ValueError:
        return None

import os

script_dir = os.path.dirname(os.path.abspath(__file__))
requests_path = os.path.join(script_dir, 'requests.json')
tutor_path = os.path.join(script_dir, 'request_tutor.json')

with open(requests_path, 'r', encoding='utf-8') as f:
    request_data = json.load(f)[2]['data']

with open(tutor_path, 'r', encoding='utf-8') as f:
    tutor_data = json.load(f)[2]['data']

offers_by_request = {}
for tutor in tutor_data:
    request_id = str(tutor['request_id'])
    if request_id not in offers_by_request:
        offers_by_request[request_id] = []
    offers_by_request[request_id].append(tutor)

def migrate_data(batch_size=400):
    batch = db.batch()
    op_count = 0

    for request in request_data:
        request_id = str(request['id'])
        request_ref = db.collection('requests').document(request_id)

        request_doc = {
            'created_at': parse_date(request['created_at']),
            'updated_at': parse_date(request['updated_at']),
            'deleted_at': parse_date(request['deleted_at']),
            'locked': request['locked'],
            'cancelled': request['cancelled'],
            'cancel_reason': request['cancel_reason'],
            'version': request['version'],
            'label': request['label'],
            'description': request['description'],
            'description_type': request['description_type'],
            'field_id': request['field_id'],
            'subject_id': request['subject_id'],
            'duration': request['duration'],
            'assistance_type': request['assistance_type'],
            'exam_type': request['exam_type'],
            'deadline': parse_date(request['deadline'][:-5] if request['deadline'] else None),  # Remove .000Z
            'date': parse_date(request['date'][:-5] if request['date'] else None),
            'time': request['time'],
            'timezone': request['timezone'],
            'grade': request['grade'],
            'notes': request['notes'],
            'language': request['language'],
            'completed': request['completed'],
            'paid': request['paid'],
            'is_paid': request['is_paid'],
            'student_id': str(request['student_id']),
            'accepted': request['accepted'],
            'receipt_submitted': request['receipt_submitted'],
            'omt_info': request['omt_info'],
            'tutor_accepted': request['tutor_accepted'],
            'tutor_id': str(request['tutor_id']) if request['tutor_id'] else None,
            'answer_text': request['answer_text'],
            'answer_files': request['answer_files'],
            'student_price': request['student_price'],
            'tutor_price': request['tutor_price'],
            'min_price': request['min_price'],
            'discount': request['discount'],
            'feedback': request['feedback'],
            'rating': request['rating'],
            'comments': request['comments'],
            'file_links': request['file_links'],
            'file_names': request['file_names'],
            'syllabus_link': request['syllabus_link'],
            'field': request['field'],
            'subject': request['subject'],
            'student_nickname': request['student_nickname'],
            'tutor_nickname': request['tutor_nickname'],
            'country': request['country'],
            'state': request['state'],
            'cms_attributes': request['cms_attributes'],
            'saved_by': request['saved_by'],
            'zoom_information': request['zoom_information'],
            'request_status': request['request_status'],
            'meeting_id': request['meeting_id'],
            'meeting_password': request['meeting_password'],
            'student_meeting_url': request['student_meeting_url'],
            'tutor_meeting_url': request['tutor_meeting_url'],
            'meeting_record_url': request['meeting_record_url'],
            'zoom_user_id': request['zoom_user_id'],
            'sub_subject': request['sub_subject'],
            'promo_id': request['promo_id'],
            'issue_reported': request['issue_reported']
        }

        batch.set(request_ref, request_doc)
        op_count += 1

        if request_id in offers_by_request:
            for tutor in offers_by_request[request_id]:
                tutor_id = str(tutor['id'])
                tutor_ref = request_ref.collection('tutor_offers').document(tutor_id)

                tutor_doc = {
                    'request_id': str(tutor['request_id']),
                    'tutor_id': str(tutor['tutor_id']),
                    'status': tutor['status'],
                    'price': tutor['price'],
                    'created_at': parse_date(tutor['created_at']),
                    'updated_at': parse_date(tutor['updated_at']),
                    'cancel_reason': tutor['cancel_reason']
                }

                batch.set(tutor_ref, tutor_doc)
                op_count += 1

        if op_count >= batch_size:
            try:
                batch.commit()
                print(f"Committed batch of {op_count} operations.")
            except Exception as e:
                print(f"Batch commit failed: {e}")
            batch = db.batch()
            op_count = 0

    if op_count > 0:
        try:
            batch.commit()
            print(f"Committed final batch of {op_count} operations.")
        except Exception as e:
            print(f"Final batch commit failed: {e}")

migrate_data()