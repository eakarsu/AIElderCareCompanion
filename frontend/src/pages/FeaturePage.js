import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const featureConfigs = {
  'medications': {
    columns: ['patient_name', 'medication_name', 'dosage', 'frequency', 'time_of_day', 'status'],
    labels: { patient_name: 'Patient', medication_name: 'Medication', dosage: 'Dosage', frequency: 'Frequency', time_of_day: 'Time', prescribing_doctor: 'Doctor', start_date: 'Start Date', end_date: 'End Date', notes: 'Notes', status: 'Status' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'medication_name', type: 'text', required: true },
      { name: 'dosage', type: 'text' },
      { name: 'frequency', type: 'select', options: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed', 'Weekly'] },
      { name: 'time_of_day', type: 'text' },
      { name: 'prescribing_doctor', type: 'text' },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'notes', type: 'textarea' },
      { name: 'status', type: 'select', options: ['active', 'discontinued', 'paused'] },
    ],
  },
  'fall-alerts': {
    columns: ['patient_name', 'location', 'severity', 'alert_time', 'response_status'],
    labels: { patient_name: 'Patient', location: 'Location', severity: 'Severity', alert_time: 'Alert Time', sensor_type: 'Sensor', response_status: 'Response', responder_name: 'Responder', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'location', type: 'text' },
      { name: 'severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'alert_time', type: 'datetime-local' },
      { name: 'sensor_type', type: 'select', options: ['Motion Sensor', 'Wearable Device', 'Manual Report', 'Camera'] },
      { name: 'response_status', type: 'select', options: ['pending', 'responding', 'resolved'] },
      { name: 'responder_name', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'social-engagement': {
    columns: ['patient_name', 'activity_type', 'activity_name', 'event_date', 'mood_after'],
    labels: { patient_name: 'Patient', activity_type: 'Type', activity_name: 'Activity', event_date: 'Date', duration_minutes: 'Duration (min)', participants: 'Participants', location: 'Location', mood_before: 'Mood Before', mood_after: 'Mood After', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'activity_type', type: 'select', options: ['Group Activity', 'Family Visit', 'Arts & Crafts', 'Music', 'Book Club', 'Games', 'Religious', 'Technology', 'Exercise', 'Volunteer', 'Gardening', 'Pet Therapy', 'Dance', 'Education', 'Cooking'] },
      { name: 'activity_name', type: 'text' },
      { name: 'event_date', type: 'datetime-local' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'participants', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'mood_before', type: 'select', options: ['very happy', 'happy', 'neutral', 'sad', 'anxious', 'tired', 'lonely', 'withdrawn'] },
      { name: 'mood_after', type: 'select', options: ['very happy', 'happy', 'calm', 'engaged', 'cheerful', 'joyful', 'refreshed', 'energized', 'fulfilled', 'stimulated', 'peaceful', 'neutral'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'health-monitoring': {
    columns: ['patient_name', 'vital_type', 'value', 'unit', 'status'],
    labels: { patient_name: 'Patient', vital_type: 'Vital Type', value: 'Value', unit: 'Unit', recorded_at: 'Recorded At', normal_range_min: 'Min Normal', normal_range_max: 'Max Normal', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'vital_type', type: 'select', options: ['Blood Pressure Systolic', 'Blood Pressure Diastolic', 'Heart Rate', 'Blood Glucose', 'Temperature', 'Oxygen Saturation', 'Weight', 'Cholesterol Total', 'TSH', 'INR'] },
      { name: 'value', type: 'number', step: '0.01' },
      { name: 'unit', type: 'text' },
      { name: 'recorded_at', type: 'datetime-local' },
      { name: 'normal_range_min', type: 'number', step: '0.01' },
      { name: 'normal_range_max', type: 'number', step: '0.01' },
      { name: 'status', type: 'select', options: ['normal', 'elevated', 'high', 'low', 'critical'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'appointments': {
    columns: ['patient_name', 'doctor_name', 'specialty', 'appointment_date', 'status'],
    labels: { patient_name: 'Patient', doctor_name: 'Doctor', specialty: 'Specialty', appointment_date: 'Date', appointment_time: 'Time', location: 'Location', appointment_type: 'Type', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'doctor_name', type: 'text' },
      { name: 'specialty', type: 'text' },
      { name: 'appointment_date', type: 'date' },
      { name: 'appointment_time', type: 'time' },
      { name: 'location', type: 'text' },
      { name: 'appointment_type', type: 'select', options: ['Follow-up', 'Annual Exam', 'Consultation', 'Urgent', 'Therapy', 'Lab Work'] },
      { name: 'status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'rescheduled'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'emergency-contacts': {
    columns: ['patient_name', 'contact_name', 'relationship', 'phone', 'priority'],
    labels: { patient_name: 'Patient', contact_name: 'Contact', relationship: 'Relationship', phone: 'Phone', email: 'Email', address: 'Address', priority: 'Priority', is_medical_proxy: 'Medical Proxy', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'contact_name', type: 'text', required: true },
      { name: 'relationship', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'email', type: 'email' },
      { name: 'address', type: 'textarea' },
      { name: 'priority', type: 'number' },
      { name: 'is_medical_proxy', type: 'checkbox' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'daily-activities': {
    columns: ['patient_name', 'activity_name', 'activity_type', 'completion_status', 'assistance_needed'],
    labels: { patient_name: 'Patient', activity_name: 'Activity', activity_type: 'Type', activity_date: 'Date', duration_minutes: 'Duration (min)', completion_status: 'Status', assistance_needed: 'Assist Needed', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'activity_name', type: 'text' },
      { name: 'activity_type', type: 'select', options: ['Exercise', 'Personal Care', 'Medical', 'Daily Living', 'Cognitive', 'Hobby', 'Household', 'Rest', 'Nutrition', 'Leisure', 'Social'] },
      { name: 'activity_date', type: 'datetime-local' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'completion_status', type: 'select', options: ['completed', 'partial', 'skipped', 'in_progress'] },
      { name: 'assistance_needed', type: 'checkbox' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'meal-planning': {
    columns: ['patient_name', 'meal_type', 'meal_name', 'calories', 'status'],
    labels: { patient_name: 'Patient', meal_type: 'Meal', meal_name: 'Name', meal_date: 'Date', calories: 'Calories', dietary_restrictions: 'Restrictions', ingredients: 'Ingredients', preparation_notes: 'Prep Notes', status: 'Status' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'meal_type', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
      { name: 'meal_name', type: 'text' },
      { name: 'meal_date', type: 'date' },
      { name: 'calories', type: 'number' },
      { name: 'dietary_restrictions', type: 'text' },
      { name: 'ingredients', type: 'textarea' },
      { name: 'preparation_notes', type: 'textarea' },
      { name: 'status', type: 'select', options: ['planned', 'served', 'skipped'] },
    ],
  },
  'cognitive-exercises': {
    columns: ['patient_name', 'exercise_type', 'exercise_name', 'difficulty_level', 'score'],
    labels: { patient_name: 'Patient', exercise_type: 'Type', exercise_name: 'Exercise', difficulty_level: 'Difficulty', exercise_date: 'Date', duration_minutes: 'Duration (min)', score: 'Score', max_score: 'Max Score', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'exercise_type', type: 'select', options: ['Memory', 'Language', 'Logic', 'Problem Solving', 'Attention', 'Math'] },
      { name: 'exercise_name', type: 'text' },
      { name: 'difficulty_level', type: 'select', options: ['easy', 'medium', 'hard'] },
      { name: 'exercise_date', type: 'datetime-local' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'score', type: 'number' },
      { name: 'max_score', type: 'number' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'caregiver-notes': {
    columns: ['patient_name', 'caregiver_name', 'note_type', 'title', 'priority'],
    labels: { patient_name: 'Patient', caregiver_name: 'Caregiver', note_type: 'Type', title: 'Title', content: 'Content', priority: 'Priority', shift: 'Shift', tags: 'Tags' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'caregiver_name', type: 'text' },
      { name: 'note_type', type: 'select', options: ['observation', 'medical', 'behavioral', 'cognitive', 'progress', 'safety', 'daily', 'emotional'] },
      { name: 'title', type: 'text' },
      { name: 'content', type: 'textarea' },
      { name: 'priority', type: 'select', options: ['normal', 'high', 'urgent'] },
      { name: 'shift', type: 'select', options: ['morning', 'afternoon', 'evening', 'night'] },
      { name: 'tags', type: 'text' },
    ],
  },
  'sleep-tracking': {
    columns: ['patient_name', 'sleep_date', 'total_hours', 'sleep_quality', 'interruptions'],
    labels: { patient_name: 'Patient', sleep_date: 'Date', bedtime: 'Bedtime', wake_time: 'Wake Time', total_hours: 'Total Hours', sleep_quality: 'Quality', interruptions: 'Interruptions', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'sleep_date', type: 'date' },
      { name: 'bedtime', type: 'time' },
      { name: 'wake_time', type: 'time' },
      { name: 'total_hours', type: 'number', step: '0.25' },
      { name: 'sleep_quality', type: 'select', options: ['excellent', 'good', 'fair', 'poor'] },
      { name: 'interruptions', type: 'number' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'mood-tracking': {
    columns: ['patient_name', 'mood', 'energy_level', 'anxiety_level', 'social_interaction'],
    labels: { patient_name: 'Patient', mood: 'Mood', energy_level: 'Energy (1-10)', anxiety_level: 'Anxiety (1-10)', social_interaction: 'Social', recorded_at: 'Recorded At', triggers: 'Triggers', coping_strategies: 'Coping Strategies', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'mood', type: 'select', options: ['very happy', 'happy', 'content', 'neutral', 'tired', 'anxious', 'sad', 'frustrated', 'confused', 'lonely', 'peaceful', 'energized', 'grateful', 'cheerful'] },
      { name: 'energy_level', type: 'number' },
      { name: 'anxiety_level', type: 'number' },
      { name: 'social_interaction', type: 'checkbox' },
      { name: 'recorded_at', type: 'datetime-local' },
      { name: 'triggers', type: 'text' },
      { name: 'coping_strategies', type: 'textarea' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'transportation': {
    columns: ['patient_name', 'pickup_date', 'dropoff_location', 'transport_type', 'status'],
    labels: { patient_name: 'Patient', pickup_location: 'Pickup', dropoff_location: 'Dropoff', pickup_date: 'Date', pickup_time: 'Time', transport_type: 'Type', wheelchair_accessible: 'Wheelchair', companion_needed: 'Companion', driver_name: 'Driver', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'pickup_location', type: 'text' },
      { name: 'dropoff_location', type: 'text' },
      { name: 'pickup_date', type: 'date' },
      { name: 'pickup_time', type: 'time' },
      { name: 'transport_type', type: 'select', options: ['Sedan', 'Medical Van', 'Wheelchair Van', 'Ambulance'] },
      { name: 'wheelchair_accessible', type: 'checkbox' },
      { name: 'companion_needed', type: 'checkbox' },
      { name: 'driver_name', type: 'text' },
      { name: 'status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'home-safety': {
    columns: ['patient_name', 'area', 'hazard_type', 'risk_level', 'status'],
    labels: { patient_name: 'Patient', area: 'Area', hazard_type: 'Hazard', risk_level: 'Risk Level', inspection_date: 'Inspection Date', inspector_name: 'Inspector', recommendation: 'Recommendation', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'area', type: 'select', options: ['Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Stairs', 'Hallway', 'Entrance', 'Garden', 'Garage'] },
      { name: 'hazard_type', type: 'select', options: ['Slip Hazard', 'Fall Hazard', 'Fire Hazard', 'Trip Hazard', 'Burn Hazard', 'Lighting', 'Emergency Access', 'Medication Storage'] },
      { name: 'risk_level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'inspection_date', type: 'date' },
      { name: 'inspector_name', type: 'text' },
      { name: 'recommendation', type: 'textarea' },
      { name: 'status', type: 'select', options: ['identified', 'in_progress', 'resolved'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'telemedicine': {
    columns: ['patient_name', 'doctor_name', 'specialty', 'session_date', 'session_type'],
    labels: { patient_name: 'Patient', doctor_name: 'Doctor', specialty: 'Specialty', session_date: 'Date', session_time: 'Time', duration_minutes: 'Duration (min)', platform: 'Platform', session_type: 'Type', diagnosis: 'Diagnosis', prescription: 'Prescription', follow_up_date: 'Follow-up', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'doctor_name', type: 'text' },
      { name: 'specialty', type: 'text' },
      { name: 'session_date', type: 'date' },
      { name: 'session_time', type: 'time' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'platform', type: 'select', options: ['Zoom Health', 'Doxy.me', 'Teladoc', 'Amwell'] },
      { name: 'session_type', type: 'select', options: ['Follow-up', 'Consultation', 'Urgent', 'Therapy', 'Assessment'] },
      { name: 'diagnosis', type: 'textarea' },
      { name: 'prescription', type: 'textarea' },
      { name: 'follow_up_date', type: 'date' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'hydration': {
    columns: ['patient_name', 'drink_type', 'amount_ml', 'recorded_at', 'daily_goal_ml'],
    labels: { patient_name: 'Patient', drink_type: 'Drink Type', amount_ml: 'Amount (ml)', recorded_at: 'Time', daily_goal_ml: 'Daily Goal (ml)', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'drink_type', type: 'select', options: ['Water', 'Tea', 'Coffee', 'Juice', 'Milk', 'Broth', 'Smoothie', 'Electrolyte Drink', 'Other'] },
      { name: 'amount_ml', type: 'number' },
      { name: 'recorded_at', type: 'datetime-local' },
      { name: 'daily_goal_ml', type: 'number' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'physical-therapy': {
    columns: ['patient_name', 'therapist_name', 'exercise_name', 'exercise_type', 'status'],
    labels: { patient_name: 'Patient', therapist_name: 'Therapist', exercise_name: 'Exercise', exercise_type: 'Type', session_date: 'Date', duration_minutes: 'Duration (min)', sets: 'Sets', reps: 'Reps', pain_level: 'Pain (0-10)', progress_notes: 'Progress Notes', status: 'Status' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'therapist_name', type: 'text' },
      { name: 'exercise_name', type: 'text' },
      { name: 'exercise_type', type: 'select', options: ['Strength', 'Balance', 'Range of Motion', 'Cardiovascular', 'Circulation', 'Flexibility', 'Coordination', 'Gait Training'] },
      { name: 'session_date', type: 'datetime-local' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'sets', type: 'number' },
      { name: 'reps', type: 'number' },
      { name: 'pain_level', type: 'number' },
      { name: 'progress_notes', type: 'textarea' },
      { name: 'status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'in_progress'] },
    ],
  },
  'medical-records': {
    columns: ['patient_name', 'record_type', 'title', 'doctor_name', 'record_date'],
    labels: { patient_name: 'Patient', record_type: 'Type', title: 'Title', description: 'Description', doctor_name: 'Doctor', facility: 'Facility', record_date: 'Date', diagnosis_code: 'Diagnosis Code', attachments: 'Attachments', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'record_type', type: 'select', options: ['Diagnosis', 'Lab Result', 'Imaging', 'Procedure', 'Consultation', 'Discharge Summary', 'Progress Note', 'Referral'] },
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'doctor_name', type: 'text' },
      { name: 'facility', type: 'text' },
      { name: 'record_date', type: 'date' },
      { name: 'diagnosis_code', type: 'text' },
      { name: 'attachments', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'allergies': {
    columns: ['patient_name', 'allergen', 'allergy_type', 'severity', 'status'],
    labels: { patient_name: 'Patient', allergen: 'Allergen', allergy_type: 'Type', severity: 'Severity', reaction: 'Reaction', diagnosed_date: 'Diagnosed', diagnosed_by: 'Diagnosed By', treatment: 'Treatment', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'allergen', type: 'text', required: true },
      { name: 'allergy_type', type: 'select', options: ['Drug', 'Food', 'Environmental', 'Contact', 'Insect', 'Other'] },
      { name: 'severity', type: 'select', options: ['mild', 'moderate', 'severe', 'life-threatening'] },
      { name: 'reaction', type: 'textarea' },
      { name: 'diagnosed_date', type: 'date' },
      { name: 'diagnosed_by', type: 'text' },
      { name: 'treatment', type: 'textarea' },
      { name: 'status', type: 'select', options: ['active', 'inactive', 'resolved'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'immunizations': {
    columns: ['patient_name', 'vaccine_name', 'dose_number', 'administered_date', 'next_due_date'],
    labels: { patient_name: 'Patient', vaccine_name: 'Vaccine', vaccine_type: 'Type', dose_number: 'Dose #', administered_date: 'Date Given', administered_by: 'Given By', facility: 'Facility', lot_number: 'Lot #', next_due_date: 'Next Due', side_effects: 'Side Effects', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'vaccine_name', type: 'text' },
      { name: 'vaccine_type', type: 'select', options: ['Seasonal', 'mRNA', 'Conjugate', 'Recombinant', 'Toxoid', 'Live Attenuated', 'Inactivated'] },
      { name: 'dose_number', type: 'number' },
      { name: 'administered_date', type: 'date' },
      { name: 'administered_by', type: 'text' },
      { name: 'facility', type: 'text' },
      { name: 'lot_number', type: 'text' },
      { name: 'next_due_date', type: 'date' },
      { name: 'side_effects', type: 'textarea' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'visitor-log': {
    columns: ['patient_name', 'visitor_name', 'relationship', 'visit_date', 'mood_after_visit'],
    labels: { patient_name: 'Patient', visitor_name: 'Visitor', relationship: 'Relationship', visit_date: 'Date', visit_duration_minutes: 'Duration (min)', purpose: 'Purpose', mood_after_visit: 'Mood After', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'visitor_name', type: 'text' },
      { name: 'relationship', type: 'select', options: ['Spouse', 'Son', 'Daughter', 'Grandchild', 'Sibling', 'Friend', 'Pastor', 'Physician', 'Therapist', 'Social Worker', 'Volunteer', 'Other'] },
      { name: 'visit_date', type: 'datetime-local' },
      { name: 'visit_duration_minutes', type: 'number' },
      { name: 'purpose', type: 'select', options: ['Regular family visit', 'Social visit', 'Medical check-up', 'Spiritual support', 'Therapy session', 'Legal consultation', 'Other'] },
      { name: 'mood_after_visit', type: 'select', options: ['very happy', 'happy', 'content', 'peaceful', 'cheerful', 'energized', 'neutral', 'tired', 'sad', 'anxious'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'care-plans': {
    columns: ['patient_name', 'plan_title', 'plan_type', 'status', 'review_date'],
    labels: { patient_name: 'Patient', plan_title: 'Plan', plan_type: 'Type', start_date: 'Start', end_date: 'End', goals: 'Goals', interventions: 'Interventions', responsible_party: 'Responsible', frequency: 'Frequency', status: 'Status', review_date: 'Next Review', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'plan_title', type: 'text' },
      { name: 'plan_type', type: 'select', options: ['Medical', 'Safety', 'Cognitive', 'Rehabilitation', 'Wellness', 'Nutritional', 'Social', 'Palliative'] },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'goals', type: 'textarea' },
      { name: 'interventions', type: 'textarea' },
      { name: 'responsible_party', type: 'text' },
      { name: 'frequency', type: 'select', options: ['Daily', 'Twice daily', 'Three times weekly', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'As needed'] },
      { name: 'status', type: 'select', options: ['active', 'completed', 'on_hold', 'discontinued'] },
      { name: 'review_date', type: 'date' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'incident-reports': {
    columns: ['patient_name', 'incident_type', 'incident_date', 'severity', 'status'],
    labels: { patient_name: 'Patient', incident_type: 'Type', incident_date: 'Date', location: 'Location', description: 'Description', severity: 'Severity', witnesses: 'Witnesses', action_taken: 'Action Taken', reported_by: 'Reported By', follow_up_required: 'Follow-up Required', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'incident_type', type: 'select', options: ['Fall', 'Near Fall', 'Medication Error', 'Medical Emergency', 'Behavioral', 'Skin Integrity', 'Equipment Malfunction', 'Wandering', 'Elopement', 'Abuse/Neglect', 'Other'] },
      { name: 'incident_date', type: 'datetime-local' },
      { name: 'location', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { name: 'witnesses', type: 'text' },
      { name: 'action_taken', type: 'textarea' },
      { name: 'reported_by', type: 'text' },
      { name: 'follow_up_required', type: 'checkbox' },
      { name: 'status', type: 'select', options: ['open', 'investigating', 'resolved', 'closed'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'insurance': {
    columns: ['patient_name', 'provider_name', 'policy_number', 'plan_type', 'coverage_end'],
    labels: { patient_name: 'Patient', provider_name: 'Provider', policy_number: 'Policy #', group_number: 'Group #', plan_type: 'Plan Type', coverage_start: 'Coverage Start', coverage_end: 'Coverage End', copay: 'Copay ($)', deductible: 'Deductible ($)', contact_phone: 'Phone', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'provider_name', type: 'text' },
      { name: 'policy_number', type: 'text' },
      { name: 'group_number', type: 'text' },
      { name: 'plan_type', type: 'select', options: ['Hospital Insurance', 'Medical Insurance', 'Prescription Drug', 'Supplemental', 'HMO', 'PPO', 'Medicare Advantage', 'Medicaid', 'Long-Term Care', 'Dental', 'Vision'] },
      { name: 'coverage_start', type: 'date' },
      { name: 'coverage_end', type: 'date' },
      { name: 'copay', type: 'number', step: '0.01' },
      { name: 'deductible', type: 'number', step: '0.01' },
      { name: 'contact_phone', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'wound-care': {
    columns: ['patient_name', 'wound_type', 'wound_location', 'stage', 'healing_status'],
    labels: { patient_name: 'Patient', wound_type: 'Type', wound_location: 'Location', size_cm: 'Size (cm)', stage: 'Stage', treatment: 'Treatment', dressing_type: 'Dressing', last_changed: 'Last Changed', next_change_date: 'Next Change', healing_status: 'Healing Status', caregiver_name: 'Caregiver', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'wound_type', type: 'select', options: ['Pressure Ulcer', 'Skin Tear', 'Surgical Wound', 'Diabetic Ulcer', 'Venous Ulcer', 'Bruise', 'Laceration', 'Burn', 'Abrasion'] },
      { name: 'wound_location', type: 'text' },
      { name: 'size_cm', type: 'number', step: '0.01' },
      { name: 'stage', type: 'select', options: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Category 1', 'Category 2', 'Category 3', 'Closed', 'N/A'] },
      { name: 'treatment', type: 'textarea' },
      { name: 'dressing_type', type: 'select', options: ['Foam Dressing', 'Non-adherent Dressing', 'Alginate Dressing', 'Hydrocolloid', 'Waterproof Bandage', 'Gauze', 'Transparent Film', 'None'] },
      { name: 'last_changed', type: 'date' },
      { name: 'next_change_date', type: 'date' },
      { name: 'healing_status', type: 'select', options: ['healing', 'improving', 'stable', 'worsening', 'infected', 'resolved'] },
      { name: 'caregiver_name', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'billing': {
    columns: ['patient_name', 'service_type', 'amount', 'billing_date', 'payment_status'],
    labels: { patient_name: 'Patient', service_type: 'Service', description: 'Description', amount: 'Amount ($)', billing_date: 'Bill Date', due_date: 'Due Date', insurance_covered: 'Insurance ($)', out_of_pocket: 'Out of Pocket ($)', payment_status: 'Status', payment_method: 'Payment Method', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'service_type', type: 'select', options: ['Home Care', 'Physical Therapy', 'Pharmacy', 'Hospital', 'Lab Work', 'Medical Equipment', 'Doctor Visit', 'Specialist', 'Dental', 'Vision', 'Mental Health', 'Other'] },
      { name: 'description', type: 'textarea' },
      { name: 'amount', type: 'number', step: '0.01' },
      { name: 'billing_date', type: 'date' },
      { name: 'due_date', type: 'date' },
      { name: 'insurance_covered', type: 'number', step: '0.01' },
      { name: 'out_of_pocket', type: 'number', step: '0.01' },
      { name: 'payment_status', type: 'select', options: ['pending', 'paid', 'partial', 'overdue', 'denied', 'appealing'] },
      { name: 'payment_method', type: 'select', options: ['Credit Card', 'Check', 'Cash', 'Insurance', 'Bank Transfer', 'Auto-Pay'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'family-messages': {
    columns: ['patient_name', 'sender_name', 'recipient_name', 'subject', 'priority'],
    labels: { patient_name: 'Patient', sender_name: 'From', recipient_name: 'To', subject: 'Subject', message: 'Message', priority: 'Priority', read_status: 'Read', sent_at: 'Sent' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'sender_name', type: 'text' },
      { name: 'recipient_name', type: 'text' },
      { name: 'subject', type: 'text' },
      { name: 'message', type: 'textarea' },
      { name: 'priority', type: 'select', options: ['normal', 'high', 'urgent'] },
      { name: 'read_status', type: 'checkbox' },
      { name: 'sent_at', type: 'datetime-local' },
    ],
  },
  'legal-documents': {
    columns: ['patient_name', 'document_type', 'title', 'status', 'effective_date'],
    labels: { patient_name: 'Patient', document_type: 'Type', title: 'Title', description: 'Description', attorney_name: 'Attorney', effective_date: 'Effective', expiration_date: 'Expires', storage_location: 'Location', status: 'Status', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'document_type', type: 'select', options: ['Power of Attorney', 'Living Will', 'Advance Directive', 'POLST', 'Trust', 'Will', 'DNR Order', 'Guardianship', 'Insurance Policy', 'Other'] },
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'attorney_name', type: 'text' },
      { name: 'effective_date', type: 'date' },
      { name: 'expiration_date', type: 'date' },
      { name: 'storage_location', type: 'text' },
      { name: 'status', type: 'select', options: ['active', 'expired', 'revoked', 'pending', 'draft'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'grocery-shopping': {
    columns: ['patient_name', 'item_name', 'category', 'quantity', 'purchased'],
    labels: { patient_name: 'Patient', item_name: 'Item', category: 'Category', quantity: 'Qty', unit: 'Unit', needed_by: 'Needed By', dietary_note: 'Dietary Note', purchased: 'Purchased', store: 'Store', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'item_name', type: 'text' },
      { name: 'category', type: 'select', options: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Bakery', 'Breakfast', 'Snacks', 'Beverages', 'Soups', 'Frozen', 'Nutrition', 'Medical', 'Household', 'Other'] },
      { name: 'quantity', type: 'number' },
      { name: 'unit', type: 'select', options: ['pieces', 'lbs', 'oz', 'gallons', 'liters', 'cans', 'boxes', 'bags', 'bottles', 'cups', 'loaf', 'fillets', 'box (100)'] },
      { name: 'needed_by', type: 'date' },
      { name: 'dietary_note', type: 'text' },
      { name: 'purchased', type: 'checkbox' },
      { name: 'store', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'housekeeping': {
    columns: ['patient_name', 'task_name', 'area', 'status', 'priority'],
    labels: { patient_name: 'Patient', task_name: 'Task', area: 'Area', frequency: 'Frequency', assigned_to: 'Assigned To', scheduled_date: 'Scheduled', completed_date: 'Completed', status: 'Status', priority: 'Priority', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'task_name', type: 'text' },
      { name: 'area', type: 'select', options: ['Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Dining Room', 'Hallway', 'Laundry Room', 'Entrance', 'Garden', 'Garage', 'Entire Home'] },
      { name: 'frequency', type: 'select', options: ['Daily', 'Twice weekly', 'Three times weekly', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'As needed'] },
      { name: 'assigned_to', type: 'text' },
      { name: 'scheduled_date', type: 'date' },
      { name: 'completed_date', type: 'date' },
      { name: 'status', type: 'select', options: ['pending', 'in_progress', 'completed', 'skipped', 'overdue'] },
      { name: 'priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
      { name: 'notes', type: 'textarea' },
    ],
  },
  'medical-equipment': {
    columns: ['patient_name', 'equipment_name', 'equipment_type', 'condition', 'next_maintenance'],
    labels: { patient_name: 'Patient', equipment_name: 'Equipment', equipment_type: 'Type', manufacturer: 'Manufacturer', serial_number: 'Serial #', purchase_date: 'Purchased', warranty_expiry: 'Warranty Expires', last_maintenance: 'Last Maintenance', next_maintenance: 'Next Maintenance', condition: 'Condition', location: 'Location', notes: 'Notes' },
    fields: [
      { name: 'patient_name', type: 'text', required: true },
      { name: 'equipment_name', type: 'text' },
      { name: 'equipment_type', type: 'select', options: ['Monitoring', 'Mobility', 'Safety', 'Respiratory', 'Treatment', 'Orthopedic', 'Furniture', 'Communication', 'Other'] },
      { name: 'manufacturer', type: 'text' },
      { name: 'serial_number', type: 'text' },
      { name: 'purchase_date', type: 'date' },
      { name: 'warranty_expiry', type: 'date' },
      { name: 'last_maintenance', type: 'date' },
      { name: 'next_maintenance', type: 'date' },
      { name: 'condition', type: 'select', options: ['new', 'good', 'fair', 'poor', 'needs_repair', 'decommissioned'] },
      { name: 'location', type: 'text' },
      { name: 'notes', type: 'textarea' },
    ],
  },
};

const formatValue = (key, value) => {
  if (value === null || value === undefined) return '-';
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (key.includes('date') && value) {
    try { return new Date(value).toLocaleDateString(); } catch { return value; }
  }
  if (key === 'alert_time' || key === 'recorded_at' || key === 'event_date' || key === 'exercise_date' || key === 'activity_date' || key === 'visit_date' || key === 'incident_date' || key === 'session_date' || key === 'sent_at') {
    try { return new Date(value).toLocaleString(); } catch { return value; }
  }
  return String(value);
};

const getStatusClass = (status) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (['active', 'normal', 'completed', 'resolved', 'good', 'excellent', 'served', 'healing', 'improving', 'paid', 'new', 'closed'].includes(s)) return 'status-success';
  if (['pending', 'scheduled', 'in_progress', 'identified', 'planned', 'fair', 'medium', 'elevated', 'stable', 'partial', 'investigating', 'open', 'draft'].includes(s)) return 'status-warning';
  if (['high', 'urgent', 'critical', 'poor', 'discontinued', 'cancelled', 'worsening', 'infected', 'overdue', 'denied', 'expired', 'revoked', 'life-threatening', 'severe', 'needs_repair', 'decommissioned'].includes(s)) return 'status-danger';
  return 'status-info';
};

const FeaturePage = ({ feature, title, token }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const config = featureConfigs[feature];

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/${feature}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [feature]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetch(`${API}/${feature}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSelectedItem(null);
      fetchItems();
    } catch (err) { console.error('Delete error:', err); }
  };

  const handleSave = async (formData) => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API}/${feature}/${editItem.id}` : `${API}/${feature}`;
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setEditItem(null);
      fetchItems();
    } catch (err) { console.error('Save error:', err); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
    setSelectedItem(null);
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some((v) =>
      String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>&#x2190; Dashboard</button>
          <h1>{title}</h1>
          <span className="item-count">{items.length} records</span>
        </div>
        <div className="feature-header-right">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="add-btn" onClick={() => { setEditItem(null); setShowForm(true); }}>
            + New Item
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {config.columns.map((col) => (
                <th key={col}>{config.labels[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} onClick={() => setSelectedItem(item)} className="clickable-row">
                {config.columns.map((col) => (
                  <td key={col}>
                    {['status', 'severity', 'risk_level', 'priority', 'response_status', 'completion_status', 'sleep_quality', 'healing_status', 'payment_status', 'condition'].includes(col) ? (
                      <span className={`status-badge ${getStatusClass(item[col])}`}>
                        {formatValue(col, item[col])}
                      </span>
                    ) : (
                      formatValue(col, item[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr><td colSpan={config.columns.length} className="no-data">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          labels={config.labels}
          onClose={() => setSelectedItem(null)}
          onEdit={() => handleEdit(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
          formatValue={formatValue}
          getStatusClass={getStatusClass}
        />
      )}

      {showForm && (
        <FormModal
          fields={config.fields}
          labels={config.labels}
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          title={editItem ? 'Edit Record' : 'New Record'}
        />
      )}
    </div>
  );
};

export default FeaturePage;
