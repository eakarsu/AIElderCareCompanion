const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eldercare',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Drop and recreate tables
    await client.query(`
      DROP TABLE IF EXISTS users, medications, fall_alerts, social_engagement, health_monitoring,
        appointments, emergency_contacts, daily_activities, meal_planning, cognitive_exercises,
        caregiver_notes, sleep_tracking, mood_tracking, transportation, home_safety, telemedicine,
        hydration_tracking, physical_therapy, medical_records, allergies, immunizations,
        visitor_log, care_plans, incident_reports, insurance, wound_care, billing,
        family_messages, legal_documents, grocery_shopping, housekeeping, medical_equipment CASCADE;

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'caregiver',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE medications (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        time_of_day VARCHAR(100),
        prescribing_doctor VARCHAR(255),
        start_date DATE,
        end_date DATE,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE fall_alerts (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        severity VARCHAR(50),
        alert_time TIMESTAMP DEFAULT NOW(),
        sensor_type VARCHAR(100),
        response_status VARCHAR(50) DEFAULT 'pending',
        responder_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE social_engagement (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        activity_type VARCHAR(100),
        activity_name VARCHAR(255),
        event_date TIMESTAMP,
        duration_minutes INTEGER,
        participants VARCHAR(255),
        location VARCHAR(255),
        mood_before VARCHAR(50),
        mood_after VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE health_monitoring (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        vital_type VARCHAR(100),
        value DECIMAL(10,2),
        unit VARCHAR(50),
        recorded_at TIMESTAMP DEFAULT NOW(),
        normal_range_min DECIMAL(10,2),
        normal_range_max DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'normal',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255),
        specialty VARCHAR(100),
        appointment_date DATE,
        appointment_time TIME,
        location VARCHAR(255),
        appointment_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency_contacts (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        priority INTEGER DEFAULT 1,
        is_medical_proxy BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE daily_activities (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        activity_name VARCHAR(255),
        activity_type VARCHAR(100),
        activity_date TIMESTAMP DEFAULT NOW(),
        duration_minutes INTEGER,
        completion_status VARCHAR(50) DEFAULT 'completed',
        assistance_needed BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE meal_planning (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(50),
        meal_name VARCHAR(255),
        meal_date DATE,
        calories INTEGER,
        dietary_restrictions VARCHAR(255),
        ingredients TEXT,
        preparation_notes TEXT,
        status VARCHAR(50) DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE cognitive_exercises (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        exercise_type VARCHAR(100),
        exercise_name VARCHAR(255),
        difficulty_level VARCHAR(50),
        exercise_date TIMESTAMP DEFAULT NOW(),
        duration_minutes INTEGER,
        score INTEGER,
        max_score INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE caregiver_notes (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        caregiver_name VARCHAR(255),
        note_type VARCHAR(100),
        title VARCHAR(255),
        content TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        shift VARCHAR(50),
        tags VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE sleep_tracking (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        sleep_date DATE,
        bedtime TIME,
        wake_time TIME,
        total_hours DECIMAL(4,2),
        sleep_quality VARCHAR(50),
        interruptions INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE mood_tracking (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        mood VARCHAR(50),
        energy_level INTEGER,
        anxiety_level INTEGER,
        social_interaction BOOLEAN DEFAULT false,
        recorded_at TIMESTAMP DEFAULT NOW(),
        triggers VARCHAR(255),
        coping_strategies TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE transportation (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        pickup_location VARCHAR(255),
        dropoff_location VARCHAR(255),
        pickup_date DATE,
        pickup_time TIME,
        transport_type VARCHAR(100),
        wheelchair_accessible BOOLEAN DEFAULT false,
        companion_needed BOOLEAN DEFAULT false,
        driver_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE home_safety (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        area VARCHAR(100),
        hazard_type VARCHAR(100),
        risk_level VARCHAR(50),
        inspection_date DATE,
        inspector_name VARCHAR(255),
        recommendation TEXT,
        status VARCHAR(50) DEFAULT 'identified',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE telemedicine (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255),
        specialty VARCHAR(100),
        session_date DATE,
        session_time TIME,
        duration_minutes INTEGER,
        platform VARCHAR(100),
        session_type VARCHAR(100),
        diagnosis TEXT,
        prescription TEXT,
        follow_up_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE hydration_tracking (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        drink_type VARCHAR(100),
        amount_ml INTEGER,
        recorded_at TIMESTAMP DEFAULT NOW(),
        daily_goal_ml INTEGER DEFAULT 2000,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE physical_therapy (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        therapist_name VARCHAR(255),
        exercise_name VARCHAR(255),
        exercise_type VARCHAR(100),
        session_date TIMESTAMP DEFAULT NOW(),
        duration_minutes INTEGER,
        sets INTEGER,
        reps INTEGER,
        pain_level INTEGER,
        progress_notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE medical_records (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        record_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        doctor_name VARCHAR(255),
        facility VARCHAR(255),
        record_date DATE,
        diagnosis_code VARCHAR(50),
        attachments TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE allergies (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        allergen VARCHAR(255) NOT NULL,
        allergy_type VARCHAR(100),
        severity VARCHAR(50),
        reaction TEXT,
        diagnosed_date DATE,
        diagnosed_by VARCHAR(255),
        treatment TEXT,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE immunizations (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        vaccine_name VARCHAR(255),
        vaccine_type VARCHAR(100),
        dose_number INTEGER,
        administered_date DATE,
        administered_by VARCHAR(255),
        facility VARCHAR(255),
        lot_number VARCHAR(100),
        next_due_date DATE,
        side_effects TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE visitor_log (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        visitor_name VARCHAR(255),
        relationship VARCHAR(100),
        visit_date TIMESTAMP DEFAULT NOW(),
        visit_duration_minutes INTEGER,
        purpose VARCHAR(255),
        mood_after_visit VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE care_plans (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        plan_title VARCHAR(255),
        plan_type VARCHAR(100),
        start_date DATE,
        end_date DATE,
        goals TEXT,
        interventions TEXT,
        responsible_party VARCHAR(255),
        frequency VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        review_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE incident_reports (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        incident_type VARCHAR(100),
        incident_date TIMESTAMP DEFAULT NOW(),
        location VARCHAR(255),
        description TEXT,
        severity VARCHAR(50),
        witnesses VARCHAR(255),
        action_taken TEXT,
        reported_by VARCHAR(255),
        follow_up_required BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE insurance (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        provider_name VARCHAR(255),
        policy_number VARCHAR(100),
        group_number VARCHAR(100),
        plan_type VARCHAR(100),
        coverage_start DATE,
        coverage_end DATE,
        copay DECIMAL(10,2),
        deductible DECIMAL(10,2),
        contact_phone VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE wound_care (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        wound_type VARCHAR(100),
        wound_location VARCHAR(100),
        size_cm DECIMAL(5,2),
        stage VARCHAR(50),
        treatment TEXT,
        dressing_type VARCHAR(100),
        last_changed DATE,
        next_change_date DATE,
        healing_status VARCHAR(50) DEFAULT 'healing',
        caregiver_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE billing (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100),
        description TEXT,
        amount DECIMAL(10,2),
        billing_date DATE,
        due_date DATE,
        insurance_covered DECIMAL(10,2),
        out_of_pocket DECIMAL(10,2),
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE family_messages (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255),
        recipient_name VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        read_status BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE legal_documents (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        document_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        attorney_name VARCHAR(255),
        effective_date DATE,
        expiration_date DATE,
        storage_location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE grocery_shopping (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        item_name VARCHAR(255),
        category VARCHAR(100),
        quantity INTEGER,
        unit VARCHAR(50),
        needed_by DATE,
        dietary_note VARCHAR(255),
        purchased BOOLEAN DEFAULT false,
        store VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE housekeeping (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        task_name VARCHAR(255),
        area VARCHAR(100),
        frequency VARCHAR(100),
        assigned_to VARCHAR(255),
        scheduled_date DATE,
        completed_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'normal',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE medical_equipment (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        equipment_name VARCHAR(255),
        equipment_type VARCHAR(100),
        manufacturer VARCHAR(255),
        serial_number VARCHAR(100),
        purchase_date DATE,
        warranty_expiry DATE,
        last_maintenance DATE,
        next_maintenance DATE,
        condition VARCHAR(50) DEFAULT 'good',
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- AI results persistence (JSONB) for caching/auditing AI calls
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        endpoint VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        request_payload JSONB,
        ai_results JSONB,
        model VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint);
      CREATE INDEX IF NOT EXISTS idx_ai_results_entity ON ai_results(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
    `);

    console.log('Tables created successfully');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Dr. Sarah Johnson', 'admin@eldercare.com', '${hashedPassword}', 'admin'),
      ('Nurse Mary Smith', 'nurse@eldercare.com', '${hashedPassword}', 'nurse'),
      ('John Caregiver', 'caregiver@eldercare.com', '${hashedPassword}', 'caregiver');
    `);
    console.log('Users seeded');

    // Seed Medications (15 items)
    await client.query(`
      INSERT INTO medications (patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status) VALUES
      ('Eleanor Williams', 'Lisinopril', '10mg', 'Once daily', 'Morning', 'Dr. Sarah Johnson', '2024-01-15', '2025-01-15', 'For blood pressure management', 'active'),
      ('Eleanor Williams', 'Metformin', '500mg', 'Twice daily', 'Morning and Evening', 'Dr. Robert Chen', '2024-02-01', '2025-02-01', 'Type 2 diabetes management', 'active'),
      ('Robert Thompson', 'Atorvastatin', '20mg', 'Once daily', 'Evening', 'Dr. Sarah Johnson', '2024-01-20', '2025-01-20', 'Cholesterol management', 'active'),
      ('Robert Thompson', 'Aspirin', '81mg', 'Once daily', 'Morning', 'Dr. Sarah Johnson', '2024-03-01', '2025-03-01', 'Heart attack prevention', 'active'),
      ('Margaret Davis', 'Donepezil', '5mg', 'Once daily', 'Evening', 'Dr. Lisa Park', '2024-04-01', '2025-04-01', 'Alzheimer disease treatment', 'active'),
      ('Margaret Davis', 'Sertraline', '50mg', 'Once daily', 'Morning', 'Dr. Lisa Park', '2024-05-15', '2025-05-15', 'Depression and anxiety', 'active'),
      ('James Wilson', 'Warfarin', '5mg', 'Once daily', 'Evening', 'Dr. Michael Brown', '2024-02-15', '2025-02-15', 'Blood thinner for AFib', 'active'),
      ('James Wilson', 'Amlodipine', '5mg', 'Once daily', 'Morning', 'Dr. Michael Brown', '2024-03-10', '2025-03-10', 'Hypertension', 'active'),
      ('Dorothy Clark', 'Levothyroxine', '75mcg', 'Once daily', 'Morning (empty stomach)', 'Dr. Sarah Johnson', '2024-01-01', '2025-01-01', 'Hypothyroidism', 'active'),
      ('Dorothy Clark', 'Omeprazole', '20mg', 'Once daily', 'Before breakfast', 'Dr. Robert Chen', '2024-06-01', '2024-12-01', 'GERD treatment', 'active'),
      ('Harold Martinez', 'Gabapentin', '300mg', 'Three times daily', 'Morning, Afternoon, Evening', 'Dr. Lisa Park', '2024-04-15', '2025-04-15', 'Neuropathic pain', 'active'),
      ('Harold Martinez', 'Memantine', '10mg', 'Twice daily', 'Morning and Evening', 'Dr. Lisa Park', '2024-05-01', '2025-05-01', 'Moderate dementia', 'active'),
      ('Betty Anderson', 'Furosemide', '40mg', 'Once daily', 'Morning', 'Dr. Michael Brown', '2024-03-20', '2025-03-20', 'Fluid retention / CHF', 'active'),
      ('Betty Anderson', 'Potassium Chloride', '20mEq', 'Once daily', 'With lunch', 'Dr. Michael Brown', '2024-03-20', '2025-03-20', 'Potassium supplement with diuretic', 'active'),
      ('George Taylor', 'Insulin Glargine', '20 units', 'Once daily', 'Bedtime', 'Dr. Robert Chen', '2024-02-01', '2025-02-01', 'Basal insulin for Type 2 diabetes', 'active');
    `);
    console.log('Medications seeded');

    // Seed Fall Alerts (15 items)
    await client.query(`
      INSERT INTO fall_alerts (patient_name, location, severity, alert_time, sensor_type, response_status, responder_name, notes) VALUES
      ('Eleanor Williams', 'Bathroom', 'high', '2024-11-15 03:22:00', 'Motion Sensor', 'resolved', 'Nurse Mary Smith', 'Patient slipped on wet floor. No injuries. Grab bars recommended.'),
      ('Robert Thompson', 'Bedroom', 'medium', '2024-11-14 22:45:00', 'Wearable Device', 'resolved', 'John Caregiver', 'Lost balance getting out of bed. Minor bruise on knee.'),
      ('Margaret Davis', 'Kitchen', 'high', '2024-11-13 11:30:00', 'Motion Sensor', 'resolved', 'Nurse Mary Smith', 'Tripped on rug. Right wrist sprain. ER visit required.'),
      ('James Wilson', 'Living Room', 'low', '2024-11-12 15:00:00', 'Wearable Device', 'resolved', 'John Caregiver', 'Stumbled but caught self on furniture. No injury.'),
      ('Dorothy Clark', 'Hallway', 'medium', '2024-11-11 08:15:00', 'Motion Sensor', 'resolved', 'Nurse Mary Smith', 'Fell due to dizziness. Blood pressure checked - low.'),
      ('Harold Martinez', 'Garden', 'high', '2024-11-10 14:30:00', 'Wearable Device', 'resolved', 'EMT Response', 'Fell on uneven ground. Hip pain. X-ray ordered.'),
      ('Betty Anderson', 'Stairs', 'critical', '2024-11-09 09:00:00', 'Motion Sensor', 'resolved', 'EMT Response', 'Fell down 3 steps. Head laceration. Hospitalized.'),
      ('George Taylor', 'Bathroom', 'medium', '2024-11-08 06:30:00', 'Wearable Device', 'resolved', 'Nurse Mary Smith', 'Slipped getting out of shower. Bruised hip.'),
      ('Eleanor Williams', 'Porch', 'low', '2024-11-07 16:45:00', 'Wearable Device', 'resolved', 'John Caregiver', 'Tripped on step. No injuries. Handrail check needed.'),
      ('Robert Thompson', 'Dining Room', 'medium', '2024-11-06 12:15:00', 'Motion Sensor', 'resolved', 'Nurse Mary Smith', 'Chair slipped. Fell backward. Back pain reported.'),
      ('Margaret Davis', 'Bedroom', 'low', '2024-11-05 23:30:00', 'Wearable Device', 'resolved', 'Night Caregiver', 'Rolled out of bed. Bed rails adjusted.'),
      ('James Wilson', 'Garage', 'high', '2024-11-04 10:00:00', 'Manual Report', 'resolved', 'Nurse Mary Smith', 'Fell over toolbox. Left ankle swollen. Ice applied.'),
      ('Dorothy Clark', 'Living Room', 'low', '2024-11-03 13:20:00', 'Wearable Device', 'resolved', 'John Caregiver', 'Stood up too quickly. Dizzy spell. Seated safely.'),
      ('Harold Martinez', 'Bathroom', 'medium', '2024-11-02 07:45:00', 'Motion Sensor', 'resolved', 'Nurse Mary Smith', 'Fell reaching for towel. Non-slip mat installed.'),
      ('Betty Anderson', 'Kitchen', 'high', '2024-11-01 17:00:00', 'Wearable Device', 'pending', 'Awaiting Response', 'Recent alert - patient found on floor. Assessment ongoing.');
    `);
    console.log('Fall alerts seeded');

    // Seed Social Engagement (15 items)
    await client.query(`
      INSERT INTO social_engagement (patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes) VALUES
      ('Eleanor Williams', 'Group Activity', 'Morning Yoga Class', '2024-11-15 09:00:00', 60, 'Group of 8', 'Community Center', 'neutral', 'happy', 'Enjoyed gentle stretching. Made new friend.'),
      ('Robert Thompson', 'Family Visit', 'Grandchildren Visit', '2024-11-14 14:00:00', 120, 'Family - 4 people', 'Home', 'sad', 'very happy', 'Great spirits after seeing grandkids. Read stories together.'),
      ('Margaret Davis', 'Arts & Crafts', 'Watercolor Painting', '2024-11-13 10:00:00', 90, 'Group of 5', 'Activity Room', 'anxious', 'calm', 'Very therapeutic. Painted a sunset. Wants to continue.'),
      ('James Wilson', 'Music', 'Piano Recital Attendance', '2024-11-12 19:00:00', 90, 'Group of 20', 'Concert Hall', 'neutral', 'happy', 'Former pianist. Emotional but positive experience.'),
      ('Dorothy Clark', 'Book Club', 'Weekly Book Discussion', '2024-11-11 15:00:00', 60, 'Group of 6', 'Library', 'neutral', 'engaged', 'Discussed latest mystery novel. Very animated.'),
      ('Harold Martinez', 'Games', 'Chess Tournament', '2024-11-10 13:00:00', 120, 'Group of 12', 'Recreation Room', 'tired', 'energized', 'Won 2 out of 3 games. Competitive spirit lifted mood.'),
      ('Betty Anderson', 'Religious', 'Sunday Church Service', '2024-11-09 10:00:00', 75, 'Congregation', 'Local Church', 'lonely', 'peaceful', 'Felt part of community. Stayed for coffee social.'),
      ('George Taylor', 'Technology', 'Video Call with Family', '2024-11-08 18:00:00', 45, 'Family - 6 people', 'Home', 'lonely', 'happy', 'First time using video call. Saw great-grandchild.'),
      ('Eleanor Williams', 'Exercise', 'Group Walking Club', '2024-11-07 08:00:00', 45, 'Group of 10', 'Park', 'tired', 'refreshed', 'Walked 1.5 miles. Socialized throughout.'),
      ('Robert Thompson', 'Volunteer', 'Reading to Children', '2024-11-06 10:00:00', 60, 'Group of 8 children', 'Elementary School', 'neutral', 'fulfilled', 'Read 3 stories. Children loved it. Wants to do weekly.'),
      ('Margaret Davis', 'Gardening', 'Community Garden', '2024-11-05 09:00:00', 90, 'Group of 4', 'Community Garden', 'withdrawn', 'happy', 'Planted winter herbs. Enjoyed being outdoors.'),
      ('James Wilson', 'Pet Therapy', 'Dog Visit', '2024-11-04 14:00:00', 30, 'Therapy dog team', 'Home', 'sad', 'cheerful', 'Golden retriever visit. Blood pressure improved after.'),
      ('Dorothy Clark', 'Dance', 'Ballroom Dance Social', '2024-11-03 16:00:00', 60, 'Group of 16', 'Community Center', 'anxious', 'joyful', 'Danced waltz and foxtrot. Relived fond memories.'),
      ('Harold Martinez', 'Education', 'History Lecture', '2024-11-02 11:00:00', 60, 'Group of 25', 'University', 'neutral', 'stimulated', 'WWII history lecture. Shared personal stories.'),
      ('Betty Anderson', 'Cooking', 'Baking Class', '2024-11-01 13:00:00', 90, 'Group of 6', 'Kitchen', 'lonely', 'happy', 'Made apple pie from scratch. Shared with neighbors.');
    `);
    console.log('Social engagement seeded');

    // Seed Health Monitoring (15 items)
    await client.query(`
      INSERT INTO health_monitoring (patient_name, vital_type, value, unit, recorded_at, normal_range_min, normal_range_max, status, notes) VALUES
      ('Eleanor Williams', 'Blood Pressure Systolic', 142, 'mmHg', '2024-11-15 08:00:00', 90, 140, 'elevated', 'Slightly elevated. Monitor closely.'),
      ('Eleanor Williams', 'Blood Glucose', 145, 'mg/dL', '2024-11-15 07:00:00', 70, 130, 'elevated', 'Fasting glucose higher than target.'),
      ('Robert Thompson', 'Heart Rate', 72, 'bpm', '2024-11-15 09:00:00', 60, 100, 'normal', 'Resting heart rate within normal range.'),
      ('Robert Thompson', 'Cholesterol Total', 210, 'mg/dL', '2024-11-14 10:00:00', 0, 200, 'elevated', 'Slightly above target. Diet adjustment needed.'),
      ('Margaret Davis', 'Temperature', 98.6, '°F', '2024-11-15 06:00:00', 97.0, 99.0, 'normal', 'Normal body temperature.'),
      ('Margaret Davis', 'Oxygen Saturation', 96, '%', '2024-11-15 06:00:00', 95, 100, 'normal', 'Good oxygen levels.'),
      ('James Wilson', 'Blood Pressure Systolic', 155, 'mmHg', '2024-11-15 07:30:00', 90, 140, 'high', 'Needs medication adjustment. Doctor notified.'),
      ('James Wilson', 'INR', 2.5, 'ratio', '2024-11-14 09:00:00', 2.0, 3.0, 'normal', 'Warfarin therapeutic range - good.'),
      ('Dorothy Clark', 'TSH', 4.2, 'mIU/L', '2024-11-13 08:00:00', 0.4, 4.0, 'elevated', 'Slightly elevated. Levothyroxine dose review.'),
      ('Dorothy Clark', 'Weight', 145, 'lbs', '2024-11-15 07:00:00', 130, 160, 'normal', 'Stable weight. Within healthy range.'),
      ('Harold Martinez', 'Blood Glucose', 180, 'mg/dL', '2024-11-15 12:00:00', 70, 140, 'high', 'Post-meal spike. Insulin timing discussed.'),
      ('Harold Martinez', 'Blood Pressure Systolic', 128, 'mmHg', '2024-11-15 08:00:00', 90, 140, 'normal', 'Well controlled blood pressure.'),
      ('Betty Anderson', 'Heart Rate', 88, 'bpm', '2024-11-15 10:00:00', 60, 100, 'normal', 'Slightly elevated but within range.'),
      ('Betty Anderson', 'Oxygen Saturation', 93, '%', '2024-11-15 10:00:00', 95, 100, 'low', 'Below target. Supplemental oxygen may be needed.'),
      ('George Taylor', 'Blood Glucose', 110, 'mg/dL', '2024-11-15 07:00:00', 70, 130, 'normal', 'Well controlled with current insulin regimen.');
    `);
    console.log('Health monitoring seeded');

    // Seed Appointments (15 items)
    await client.query(`
      INSERT INTO appointments (patient_name, doctor_name, specialty, appointment_date, appointment_time, location, appointment_type, status, notes) VALUES
      ('Eleanor Williams', 'Dr. Sarah Johnson', 'Internal Medicine', '2024-12-01', '09:00', 'City Medical Center', 'Follow-up', 'scheduled', 'Blood pressure and diabetes review'),
      ('Eleanor Williams', 'Dr. Emily Wong', 'Ophthalmology', '2024-12-05', '14:00', 'Eye Care Clinic', 'Annual Exam', 'scheduled', 'Annual diabetic eye exam'),
      ('Robert Thompson', 'Dr. Sarah Johnson', 'Internal Medicine', '2024-12-02', '10:00', 'City Medical Center', 'Follow-up', 'scheduled', 'Cholesterol recheck after diet changes'),
      ('Robert Thompson', 'Dr. James Lee', 'Cardiology', '2024-12-10', '11:00', 'Heart Health Center', 'Consultation', 'scheduled', 'Annual cardiac evaluation'),
      ('Margaret Davis', 'Dr. Lisa Park', 'Neurology', '2024-12-03', '13:00', 'Brain Health Institute', 'Follow-up', 'scheduled', 'Cognitive assessment and medication review'),
      ('Margaret Davis', 'Dr. Karen White', 'Psychiatry', '2024-12-08', '15:00', 'Mental Health Clinic', 'Therapy', 'scheduled', 'Monthly therapy session'),
      ('James Wilson', 'Dr. Michael Brown', 'Cardiology', '2024-12-04', '09:30', 'Heart Health Center', 'Follow-up', 'scheduled', 'INR check and AFib management'),
      ('James Wilson', 'Dr. Patricia Gray', 'Pulmonology', '2024-12-12', '10:30', 'Lung Care Center', 'Annual Exam', 'scheduled', 'Annual lung function test'),
      ('Dorothy Clark', 'Dr. Sarah Johnson', 'Endocrinology', '2024-12-05', '11:00', 'City Medical Center', 'Follow-up', 'scheduled', 'Thyroid levels recheck'),
      ('Dorothy Clark', 'Dr. Robert Chen', 'Gastroenterology', '2024-12-15', '14:00', 'GI Health Center', 'Follow-up', 'scheduled', 'GERD medication effectiveness review'),
      ('Harold Martinez', 'Dr. Lisa Park', 'Neurology', '2024-12-06', '09:00', 'Brain Health Institute', 'Follow-up', 'scheduled', 'Dementia progression check'),
      ('Harold Martinez', 'Dr. Robert Chen', 'Endocrinology', '2024-12-18', '10:00', 'City Medical Center', 'Follow-up', 'scheduled', 'Diabetes and neuropathy management'),
      ('Betty Anderson', 'Dr. Michael Brown', 'Cardiology', '2024-12-07', '14:00', 'Heart Health Center', 'Urgent', 'scheduled', 'CHF monitoring and diuretic adjustment'),
      ('Betty Anderson', 'Dr. Susan Miller', 'Physical Therapy', '2024-12-09', '11:00', 'Rehab Center', 'Therapy', 'scheduled', 'Post-fall rehabilitation'),
      ('George Taylor', 'Dr. Robert Chen', 'Endocrinology', '2024-12-08', '09:00', 'City Medical Center', 'Follow-up', 'scheduled', 'Insulin dose adjustment and A1C check');
    `);
    console.log('Appointments seeded');

    // Seed Emergency Contacts (15 items)
    await client.query(`
      INSERT INTO emergency_contacts (patient_name, contact_name, relationship, phone, email, address, priority, is_medical_proxy, notes) VALUES
      ('Eleanor Williams', 'Michael Williams', 'Son', '(555) 123-4567', 'michael.w@email.com', '123 Oak Street, Springfield', 1, true, 'Primary decision maker. Available 24/7.'),
      ('Eleanor Williams', 'Susan Williams', 'Daughter-in-law', '(555) 123-4568', 'susan.w@email.com', '123 Oak Street, Springfield', 2, false, 'Backup contact when Michael unavailable.'),
      ('Robert Thompson', 'Jennifer Thompson', 'Daughter', '(555) 234-5678', 'jennifer.t@email.com', '456 Maple Ave, Springfield', 1, true, 'Lives 10 minutes away. Has house key.'),
      ('Robert Thompson', 'David Thompson', 'Son', '(555) 234-5679', 'david.t@email.com', '789 Pine Road, Lincoln', 2, false, 'Lives out of state. Call for major decisions.'),
      ('Margaret Davis', 'Karen Davis', 'Daughter', '(555) 345-6789', 'karen.d@email.com', '321 Elm Street, Springfield', 1, true, 'Primary caregiver. Visits daily.'),
      ('Margaret Davis', 'Dr. Lisa Park', 'Neurologist', '(555) 345-0000', 'lpark@hospital.com', 'Brain Health Institute', 2, false, 'Specialist managing dementia care.'),
      ('James Wilson', 'Patricia Wilson', 'Wife', '(555) 456-7890', 'patricia.w@email.com', '654 Birch Lane, Springfield', 1, true, 'Lives with patient. Home 24/7.'),
      ('James Wilson', 'Thomas Wilson', 'Son', '(555) 456-7891', 'thomas.w@email.com', '987 Cedar Court, Springfield', 2, false, 'Available evenings and weekends.'),
      ('Dorothy Clark', 'Richard Clark', 'Husband', '(555) 567-8901', 'richard.c@email.com', '147 Walnut Drive, Springfield', 1, true, 'Lives with patient. Also elderly - may need assistance.'),
      ('Dorothy Clark', 'Laura Clark', 'Daughter', '(555) 567-8902', 'laura.c@email.com', '258 Ash Street, Springfield', 2, true, 'Secondary medical proxy. Nurse by profession.'),
      ('Harold Martinez', 'Maria Martinez', 'Wife', '(555) 678-9012', 'maria.m@email.com', '369 Spruce Ave, Springfield', 1, true, 'Primary caregiver. Speaks Spanish and English.'),
      ('Harold Martinez', 'Carlos Martinez', 'Son', '(555) 678-9013', 'carlos.m@email.com', '741 Poplar Lane, Springfield', 2, false, 'Available for transportation.'),
      ('Betty Anderson', 'Robert Anderson', 'Son', '(555) 789-0123', 'robert.a@email.com', '852 Hickory Blvd, Springfield', 1, true, 'Manages finances and medical decisions.'),
      ('Betty Anderson', 'Emergency Services', 'EMS', '911', '', '', 3, false, 'Call for any fall or cardiac emergency.'),
      ('George Taylor', 'Linda Taylor', 'Daughter', '(555) 890-1234', 'linda.t@email.com', '963 Chestnut Way, Springfield', 1, true, 'Lives nearby. Available within 15 minutes.');
    `);
    console.log('Emergency contacts seeded');

    // Seed Daily Activities (15 items)
    await client.query(`
      INSERT INTO daily_activities (patient_name, activity_name, activity_type, activity_date, duration_minutes, completion_status, assistance_needed, notes) VALUES
      ('Eleanor Williams', 'Morning Walk', 'Exercise', '2024-11-15 07:30:00', 30, 'completed', false, 'Walked around the block independently.'),
      ('Eleanor Williams', 'Medication Taken', 'Medical', '2024-11-15 08:00:00', 5, 'completed', false, 'All morning medications taken with breakfast.'),
      ('Robert Thompson', 'Shower and Grooming', 'Personal Care', '2024-11-15 07:00:00', 45, 'completed', true, 'Needed help with shower. Dressed independently.'),
      ('Robert Thompson', 'Physical Therapy Exercises', 'Exercise', '2024-11-15 10:00:00', 30, 'completed', false, 'Completed all prescribed exercises.'),
      ('Margaret Davis', 'Breakfast Preparation', 'Daily Living', '2024-11-15 08:00:00', 30, 'completed', true, 'Caregiver prepared. Patient ate 75% of meal.'),
      ('Margaret Davis', 'Memory Games', 'Cognitive', '2024-11-15 10:00:00', 20, 'completed', false, 'Completed word puzzles with moderate difficulty.'),
      ('James Wilson', 'Blood Pressure Check', 'Medical', '2024-11-15 07:30:00', 5, 'completed', false, 'Self-monitored. Reading: 145/85.'),
      ('James Wilson', 'Garden Maintenance', 'Hobby', '2024-11-15 09:00:00', 60, 'partial', false, 'Watered plants. Too tired for pruning.'),
      ('Dorothy Clark', 'Laundry', 'Household', '2024-11-15 09:00:00', 40, 'completed', true, 'Help needed with carrying basket.'),
      ('Dorothy Clark', 'Afternoon Nap', 'Rest', '2024-11-15 13:00:00', 60, 'completed', false, 'Rested well. No interruptions.'),
      ('Harold Martinez', 'Breakfast', 'Nutrition', '2024-11-15 08:00:00', 30, 'completed', true, 'Ate oatmeal and fruit. Good appetite today.'),
      ('Harold Martinez', 'TV Time - News', 'Leisure', '2024-11-15 12:00:00', 60, 'completed', false, 'Watched news and discussed current events.'),
      ('Betty Anderson', 'Chair Exercises', 'Exercise', '2024-11-15 10:00:00', 20, 'completed', true, 'Guided seated exercises. Good participation.'),
      ('Betty Anderson', 'Phone Call with Son', 'Social', '2024-11-15 15:00:00', 30, 'completed', false, 'Good conversation. Mood improved after call.'),
      ('George Taylor', 'Insulin Injection', 'Medical', '2024-11-15 21:00:00', 5, 'completed', false, 'Self-administered bedtime insulin dose.');
    `);
    console.log('Daily activities seeded');

    // Seed Meal Planning (15 items)
    await client.query(`
      INSERT INTO meal_planning (patient_name, meal_type, meal_name, meal_date, calories, dietary_restrictions, ingredients, preparation_notes, status) VALUES
      ('Eleanor Williams', 'Breakfast', 'Oatmeal with Berries', '2024-11-15', 320, 'Low sugar, Low sodium', 'Steel-cut oats, blueberries, walnuts, cinnamon', 'Use unsweetened almond milk. Add cinnamon for flavor.', 'served'),
      ('Eleanor Williams', 'Lunch', 'Grilled Chicken Salad', '2024-11-15', 450, 'Low sugar, Low sodium', 'Grilled chicken, mixed greens, tomatoes, cucumber, olive oil', 'Light olive oil dressing. No added salt.', 'served'),
      ('Eleanor Williams', 'Dinner', 'Baked Salmon with Vegetables', '2024-11-15', 520, 'Low sugar, Low sodium', 'Atlantic salmon, asparagus, sweet potato, lemon', 'Bake at 400°F for 20 min. Season with herbs only.', 'planned'),
      ('Robert Thompson', 'Breakfast', 'Egg White Omelet', '2024-11-15', 280, 'Low cholesterol', 'Egg whites, spinach, mushrooms, whole wheat toast', 'No cheese. Use cooking spray instead of butter.', 'served'),
      ('Robert Thompson', 'Lunch', 'Turkey Wrap', '2024-11-15', 380, 'Low cholesterol', 'Turkey breast, whole wheat wrap, lettuce, avocado', 'Use lean turkey. Add avocado for healthy fats.', 'served'),
      ('Margaret Davis', 'Breakfast', 'Banana Smoothie', '2024-11-15', 300, 'Soft foods preferred', 'Banana, yogurt, honey, protein powder', 'Blend smooth. Easy to swallow consistency.', 'served'),
      ('Margaret Davis', 'Lunch', 'Pureed Vegetable Soup', '2024-11-15', 280, 'Soft foods preferred', 'Butternut squash, carrots, onion, cream', 'Puree until very smooth. Serve warm, not hot.', 'served'),
      ('James Wilson', 'Breakfast', 'Whole Grain Cereal', '2024-11-15', 340, 'Low sodium, No grapefruit (Warfarin)', 'Whole grain cereal, low-fat milk, strawberries', 'Avoid vitamin K rich foods. Check cereal sodium.', 'served'),
      ('James Wilson', 'Dinner', 'Lean Beef Stir Fry', '2024-11-15', 480, 'Low sodium, Consistent Vitamin K', 'Lean beef, bell peppers, brown rice, low-sodium soy', 'Limit dark greens. Use low-sodium soy sauce.', 'planned'),
      ('Dorothy Clark', 'Lunch', 'Chicken Noodle Soup', '2024-11-15', 350, 'Thyroid-friendly', 'Chicken, egg noodles, carrots, celery', 'Homemade low-sodium broth. Take thyroid med 1hr before.', 'served'),
      ('Harold Martinez', 'Breakfast', 'Greek Yogurt Parfait', '2024-11-15', 290, 'Diabetic-friendly', 'Greek yogurt, granola, mixed nuts, sugar-free jam', 'No added sugar yogurt. Small portion of granola.', 'served'),
      ('Harold Martinez', 'Dinner', 'Grilled Fish Tacos', '2024-11-15', 420, 'Diabetic-friendly', 'Tilapia, corn tortillas, cabbage slaw, lime', 'Use corn tortillas (lower carb). Fresh salsa only.', 'planned'),
      ('Betty Anderson', 'Lunch', 'Minestrone Soup', '2024-11-15', 310, 'Low sodium, Heart-healthy', 'Beans, pasta, vegetables, tomato base', 'No salt added. Use herbs for seasoning.', 'served'),
      ('Betty Anderson', 'Snack', 'Apple Slices with Almond Butter', '2024-11-15', 180, 'Heart-healthy', 'Apple, natural almond butter', 'Cut apple thin for easy eating. 1 tbsp almond butter.', 'served'),
      ('George Taylor', 'Dinner', 'Herb Roasted Chicken', '2024-11-15', 490, 'Diabetic-friendly', 'Chicken thigh, rosemary, garlic, green beans, quinoa', 'Remove skin before serving. Monitor carb intake.', 'planned');
    `);
    console.log('Meal planning seeded');

    // Seed Cognitive Exercises (15 items)
    await client.query(`
      INSERT INTO cognitive_exercises (patient_name, exercise_type, exercise_name, difficulty_level, exercise_date, duration_minutes, score, max_score, notes) VALUES
      ('Eleanor Williams', 'Memory', 'Card Matching Game', 'medium', '2024-11-15 10:00:00', 15, 8, 10, 'Good recall. Matched 8 of 10 pairs.'),
      ('Eleanor Williams', 'Language', 'Crossword Puzzle', 'medium', '2024-11-14 14:00:00', 30, 18, 25, 'Completed 18 of 25 clues. Strong vocabulary.'),
      ('Robert Thompson', 'Logic', 'Sudoku', 'hard', '2024-11-15 09:00:00', 25, 1, 1, 'Completed full puzzle. Excellent logical thinking.'),
      ('Robert Thompson', 'Memory', 'Story Recall', 'medium', '2024-11-14 11:00:00', 20, 7, 10, 'Recalled 7 of 10 key details from short story.'),
      ('Margaret Davis', 'Memory', 'Picture Recognition', 'easy', '2024-11-15 10:00:00', 10, 6, 10, 'Recognized 6 of 10 previously shown images.'),
      ('Margaret Davis', 'Language', 'Word Association', 'easy', '2024-11-14 15:00:00', 15, 12, 20, 'Generated 12 associated words. Improvement noted.'),
      ('James Wilson', 'Problem Solving', 'Jigsaw Puzzle', 'medium', '2024-11-15 13:00:00', 45, 1, 1, 'Completed 100-piece puzzle with minimal help.'),
      ('James Wilson', 'Attention', 'Spot the Difference', 'medium', '2024-11-14 10:00:00', 15, 7, 10, 'Found 7 of 10 differences. Good attention to detail.'),
      ('Dorothy Clark', 'Memory', 'Grocery List Recall', 'medium', '2024-11-15 11:00:00', 10, 8, 12, 'Remembered 8 of 12 items. Uses visualization technique.'),
      ('Dorothy Clark', 'Logic', 'Pattern Recognition', 'easy', '2024-11-14 09:00:00', 15, 9, 12, 'Identified 9 of 12 patterns correctly.'),
      ('Harold Martinez', 'Memory', 'Name-Face Association', 'easy', '2024-11-15 10:00:00', 15, 5, 10, 'Matched 5 of 10 names to faces. Moderate difficulty.'),
      ('Harold Martinez', 'Language', 'Category Naming', 'easy', '2024-11-14 14:00:00', 10, 8, 15, 'Named 8 items in category Animals. Below average.'),
      ('Betty Anderson', 'Attention', 'Number Sequencing', 'easy', '2024-11-15 10:00:00', 10, 7, 10, 'Correctly sequenced 7 of 10 number sets.'),
      ('Betty Anderson', 'Problem Solving', 'Simple Math Problems', 'easy', '2024-11-14 11:00:00', 15, 12, 15, 'Solved 12 of 15 basic arithmetic problems.'),
      ('George Taylor', 'Memory', 'Daily Diary Review', 'medium', '2024-11-15 16:00:00', 20, 8, 10, 'Recalled 8 of 10 events from yesterday accurately.');
    `);
    console.log('Cognitive exercises seeded');

    // Seed Caregiver Notes (15 items)
    await client.query(`
      INSERT INTO caregiver_notes (patient_name, caregiver_name, note_type, title, content, priority, shift, tags) VALUES
      ('Eleanor Williams', 'Nurse Mary Smith', 'observation', 'Morning Vitals Concern', 'Blood pressure reading elevated at 142/88. Patient reports slight headache. Will recheck in 2 hours.', 'high', 'morning', 'vitals,blood-pressure'),
      ('Eleanor Williams', 'John Caregiver', 'progress', 'Improved Mobility', 'Patient walked independently to dining room today. No assistance needed. Great improvement from last week.', 'normal', 'morning', 'mobility,progress'),
      ('Robert Thompson', 'Nurse Mary Smith', 'medical', 'Medication Side Effect', 'Patient reports muscle pain possibly related to statin. Dr. Johnson notified. May need dose adjustment.', 'high', 'morning', 'medication,side-effect'),
      ('Robert Thompson', 'John Caregiver', 'behavioral', 'Mood Improvement', 'Much better spirits after grandchildren visit. Engaged in conversation and laughed frequently.', 'normal', 'afternoon', 'mood,family'),
      ('Margaret Davis', 'Nurse Mary Smith', 'cognitive', 'Memory Episode', 'Patient did not recognize daughter briefly this morning. Episode lasted 5 minutes. Daughter distressed.', 'high', 'morning', 'cognitive,memory,family'),
      ('Margaret Davis', 'John Caregiver', 'daily', 'Good Eating Day', 'Ate 90% of all meals today. Especially enjoyed the watercolor painting activity. Calm afternoon.', 'normal', 'evening', 'nutrition,activities'),
      ('James Wilson', 'Nurse Mary Smith', 'medical', 'INR Within Range', 'Weekly INR check: 2.5 - within therapeutic range. Continue current Warfarin dose.', 'normal', 'morning', 'medication,lab-results'),
      ('James Wilson', 'John Caregiver', 'safety', 'Garage Safety Concern', 'Patient went to garage unsupervised. Found moving heavy boxes. Discussed fall risk. Needs supervision.', 'high', 'afternoon', 'safety,fall-risk'),
      ('Dorothy Clark', 'Nurse Mary Smith', 'medical', 'Thyroid Levels Update', 'Latest TSH slightly elevated at 4.2. Dr. Johnson reviewing. May increase Levothyroxine dose.', 'normal', 'morning', 'medication,thyroid'),
      ('Dorothy Clark', 'John Caregiver', 'observation', 'Afternoon Fatigue', 'Patient very tired after lunch. Napped for 2 hours instead of usual 1. May need iron levels checked.', 'normal', 'afternoon', 'fatigue,observation'),
      ('Harold Martinez', 'Nurse Mary Smith', 'medical', 'Blood Sugar Spike', 'Post-lunch glucose at 180. Reviewed meal - had extra portion of rice. Dietary counseling reinforced.', 'high', 'afternoon', 'diabetes,blood-sugar'),
      ('Harold Martinez', 'John Caregiver', 'progress', 'Enjoyed Chess', 'Won 2 chess games today. Very engaged and sharp strategically. Cognitive exercises seem beneficial.', 'normal', 'afternoon', 'cognitive,social'),
      ('Betty Anderson', 'Nurse Mary Smith', 'medical', 'Oxygen Levels Low', 'SpO2 at 93% during afternoon check. Supplemental oxygen applied. Will monitor hourly.', 'urgent', 'afternoon', 'oxygen,respiratory'),
      ('Betty Anderson', 'John Caregiver', 'emotional', 'Missing Independence', 'Patient expressed frustration about needing help with daily tasks. Encouraged and validated feelings.', 'normal', 'morning', 'emotional,independence'),
      ('George Taylor', 'Nurse Mary Smith', 'medical', 'Insulin Adjustment Needed', 'Morning fasting glucose consistently around 110. Current regimen effective. Continue monitoring.', 'normal', 'morning', 'diabetes,insulin');
    `);
    console.log('Caregiver notes seeded');

    // Seed Sleep Tracking (15 items)
    await client.query(`
      INSERT INTO sleep_tracking (patient_name, sleep_date, bedtime, wake_time, total_hours, sleep_quality, interruptions, notes) VALUES
      ('Eleanor Williams', '2024-11-15', '22:00', '06:30', 8.5, 'good', 1, 'Woke once for bathroom. Fell back asleep quickly.'),
      ('Eleanor Williams', '2024-11-14', '22:30', '05:45', 7.25, 'fair', 2, 'Two bathroom trips. Difficulty falling back asleep after second.'),
      ('Robert Thompson', '2024-11-15', '21:30', '06:00', 8.5, 'good', 0, 'Uninterrupted sleep. Feels refreshed.'),
      ('Robert Thompson', '2024-11-14', '23:00', '07:00', 8.0, 'fair', 1, 'Woke due to leg cramp. Massage helped.'),
      ('Margaret Davis', '2024-11-15', '20:00', '04:30', 8.5, 'poor', 3, 'Restless night. Woke confused twice. Sundowning episode.'),
      ('Margaret Davis', '2024-11-14', '20:30', '06:00', 9.5, 'fair', 2, 'Needed reassurance twice. Calming music helped.'),
      ('James Wilson', '2024-11-15', '22:30', '06:00', 7.5, 'good', 1, 'Woke once. Good overall sleep quality.'),
      ('James Wilson', '2024-11-14', '23:00', '05:30', 6.5, 'poor', 3, 'Breathing difficulty. Pillows adjusted for elevation.'),
      ('Dorothy Clark', '2024-11-15', '21:00', '07:00', 10.0, 'good', 0, 'Excellent sleep. Long duration may indicate fatigue.'),
      ('Dorothy Clark', '2024-11-14', '21:30', '06:30', 9.0, 'good', 1, 'One brief awakening. Overall restful night.'),
      ('Harold Martinez', '2024-11-15', '22:00', '05:00', 7.0, 'fair', 2, 'Woke for bathroom and then could not sleep for 30 min.'),
      ('Harold Martinez', '2024-11-14', '21:00', '05:30', 8.5, 'good', 1, 'Slept well after evening walk. One bathroom break.'),
      ('Betty Anderson', '2024-11-15', '20:30', '03:00', 6.5, 'poor', 4, 'Frequent awakenings. Shortness of breath. O2 adjusted.'),
      ('Betty Anderson', '2024-11-14', '21:00', '05:00', 8.0, 'fair', 2, 'Better with elevated pillows. Two brief awakenings.'),
      ('George Taylor', '2024-11-15', '22:30', '06:30', 8.0, 'good', 1, 'Good sleep. Woke once for water. No hypoglycemia signs.');
    `);
    console.log('Sleep tracking seeded');

    // Seed Mood Tracking (15 items)
    await client.query(`
      INSERT INTO mood_tracking (patient_name, mood, energy_level, anxiety_level, social_interaction, recorded_at, triggers, coping_strategies, notes) VALUES
      ('Eleanor Williams', 'happy', 7, 2, true, '2024-11-15 09:00:00', 'Good sleep, morning walk', 'Exercise, social interaction', 'Positive start to the day after yoga class.'),
      ('Eleanor Williams', 'content', 6, 3, true, '2024-11-14 15:00:00', 'Family phone call', 'Talking with family', 'Felt reassured after speaking with son.'),
      ('Robert Thompson', 'very happy', 9, 1, true, '2024-11-14 16:00:00', 'Grandchildren visit', 'Family time', 'Best mood in weeks. Laughing and playing.'),
      ('Robert Thompson', 'neutral', 5, 4, false, '2024-11-13 10:00:00', 'Muscle pain', 'Rest, warm compress', 'Statin side effects affecting mood. Quiet day.'),
      ('Margaret Davis', 'confused', 3, 7, false, '2024-11-15 08:00:00', 'Morning disorientation', 'Familiar music, photos', 'Brief episode of not recognizing surroundings.'),
      ('Margaret Davis', 'calm', 5, 3, true, '2024-11-14 14:00:00', 'Art therapy', 'Creative expression', 'Painting session very soothing. Engaged for 90 min.'),
      ('James Wilson', 'frustrated', 4, 5, false, '2024-11-15 11:00:00', 'Mobility limitations', 'Deep breathing, music', 'Wanted to work in garden but too tired.'),
      ('James Wilson', 'peaceful', 6, 2, true, '2024-11-14 19:00:00', 'Music concert', 'Music therapy', 'Piano recital brought back wonderful memories.'),
      ('Dorothy Clark', 'tired', 3, 3, false, '2024-11-15 14:00:00', 'Poor sleep, fatigue', 'Rest, light reading', 'Excessive tiredness. Thyroid levels may be cause.'),
      ('Dorothy Clark', 'cheerful', 7, 2, true, '2024-11-14 16:00:00', 'Dance social', 'Dancing, socializing', 'Loved the ballroom dancing. Great exercise.'),
      ('Harold Martinez', 'anxious', 4, 6, false, '2024-11-15 07:00:00', 'Memory concerns', 'Journaling, talking', 'Worried about forgetting things. Reassurance given.'),
      ('Harold Martinez', 'energized', 7, 2, true, '2024-11-14 15:00:00', 'Chess win', 'Mental challenges, competition', 'Thrilled about chess tournament. Very engaged.'),
      ('Betty Anderson', 'sad', 3, 5, false, '2024-11-15 09:00:00', 'Missing independence', 'Talking, reminiscing', 'Expressed frustration about needing help.'),
      ('Betty Anderson', 'grateful', 6, 3, true, '2024-11-14 16:00:00', 'Son phone call', 'Family connection', 'Appreciated son checking in. Mood improved.'),
      ('George Taylor', 'content', 6, 2, true, '2024-11-15 10:00:00', 'Stable blood sugar', 'Routine, gardening', 'Feels good about managing diabetes well today.');
    `);
    console.log('Mood tracking seeded');

    // Seed Transportation (15 items)
    await client.query(`
      INSERT INTO transportation (patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible, companion_needed, driver_name, status, notes) VALUES
      ('Eleanor Williams', '456 Elm Street', 'City Medical Center', '2024-12-01', '08:30', 'Medical Van', false, false, 'Tom Driver', 'scheduled', 'Regular checkup. 30 min early for paperwork.'),
      ('Eleanor Williams', '456 Elm Street', 'Eye Care Clinic', '2024-12-05', '13:30', 'Medical Van', false, true, 'Tom Driver', 'scheduled', 'Eye exam. Companion needed - pupils will be dilated.'),
      ('Robert Thompson', '789 Oak Ave', 'City Medical Center', '2024-12-02', '09:30', 'Sedan', false, false, 'Sarah Driver', 'scheduled', 'Cholesterol follow-up. Return trip at 11:00.'),
      ('Robert Thompson', '789 Oak Ave', 'Heart Health Center', '2024-12-10', '10:30', 'Sedan', false, false, 'Sarah Driver', 'scheduled', 'Cardiac evaluation. May take 2 hours.'),
      ('Margaret Davis', '321 Pine Road', 'Brain Health Institute', '2024-12-03', '12:30', 'Medical Van', true, true, 'James Driver', 'scheduled', 'Neurology appointment. Caregiver Karen accompanying.'),
      ('Margaret Davis', '321 Pine Road', 'Mental Health Clinic', '2024-12-08', '14:30', 'Medical Van', true, true, 'James Driver', 'scheduled', 'Therapy session. Patient may be anxious.'),
      ('James Wilson', '654 Birch Lane', 'Heart Health Center', '2024-12-04', '09:00', 'Sedan', false, true, 'Tom Driver', 'scheduled', 'AFib checkup. Wife Patricia accompanying.'),
      ('James Wilson', '654 Birch Lane', 'Lung Care Center', '2024-12-12', '10:00', 'Medical Van', false, false, 'Sarah Driver', 'scheduled', 'Annual lung function test. Allow 90 min.'),
      ('Dorothy Clark', '147 Walnut Drive', 'City Medical Center', '2024-12-05', '10:30', 'Sedan', false, true, 'Tom Driver', 'scheduled', 'Thyroid checkup. Husband Richard accompanying.'),
      ('Dorothy Clark', '147 Walnut Drive', 'GI Health Center', '2024-12-15', '13:30', 'Sedan', false, false, 'James Driver', 'scheduled', 'GERD follow-up. Short appointment expected.'),
      ('Harold Martinez', '369 Spruce Ave', 'Brain Health Institute', '2024-12-06', '08:30', 'Medical Van', true, true, 'Sarah Driver', 'scheduled', 'Dementia check. Wife Maria accompanying.'),
      ('Harold Martinez', '369 Spruce Ave', 'City Medical Center', '2024-12-18', '09:30', 'Medical Van', true, false, 'Tom Driver', 'scheduled', 'Diabetes management. Spanish interpreter arranged.'),
      ('Betty Anderson', '852 Hickory Blvd', 'Heart Health Center', '2024-12-07', '13:30', 'Wheelchair Van', true, true, 'James Driver', 'scheduled', 'CHF monitoring. Wheelchair required.'),
      ('Betty Anderson', '852 Hickory Blvd', 'Rehab Center', '2024-12-09', '10:30', 'Wheelchair Van', true, true, 'James Driver', 'scheduled', 'Physical therapy session. Post-fall rehab.'),
      ('George Taylor', '963 Chestnut Way', 'City Medical Center', '2024-12-08', '08:30', 'Sedan', false, false, 'Sarah Driver', 'scheduled', 'A1C check and insulin review. Fasting required.');
    `);
    console.log('Transportation seeded');

    // Seed Home Safety (15 items)
    await client.query(`
      INSERT INTO home_safety (patient_name, area, hazard_type, risk_level, inspection_date, inspector_name, recommendation, status, notes) VALUES
      ('Eleanor Williams', 'Bathroom', 'Slip Hazard', 'high', '2024-11-01', 'Safety Inspector Mike', 'Install grab bars and non-slip mats in shower and near toilet', 'in_progress', 'Patient has history of bathroom falls.'),
      ('Eleanor Williams', 'Stairs', 'Fall Hazard', 'medium', '2024-11-01', 'Safety Inspector Mike', 'Add handrails on both sides. Improve stair lighting.', 'resolved', 'Handrails installed. LED strip lights added.'),
      ('Robert Thompson', 'Kitchen', 'Fire Hazard', 'medium', '2024-11-02', 'Safety Inspector Jane', 'Install auto-shutoff stove. Remove flammable items near range.', 'in_progress', 'Patient sometimes forgets stove is on.'),
      ('Robert Thompson', 'Garage', 'Trip Hazard', 'high', '2024-11-02', 'Safety Inspector Jane', 'Clear walkway. Store tools properly. Add lighting.', 'identified', 'Patient fell over toolbox recently.'),
      ('Margaret Davis', 'Bedroom', 'Fall Hazard', 'high', '2024-11-03', 'Safety Inspector Mike', 'Install bed rails. Add motion-sensor nightlight. Remove rugs.', 'resolved', 'Bed rails and nightlights installed.'),
      ('Margaret Davis', 'Kitchen', 'Burn Hazard', 'high', '2024-11-03', 'Safety Inspector Mike', 'Lock stove knobs. Supervise all kitchen use. Lower water heater temp.', 'in_progress', 'Patient has dementia - unsupervised cooking dangerous.'),
      ('James Wilson', 'Living Room', 'Trip Hazard', 'medium', '2024-11-04', 'Safety Inspector Jane', 'Secure area rugs with non-slip backing. Rearrange furniture for clear path.', 'resolved', 'Rugs secured. Clear 3-foot walkway established.'),
      ('James Wilson', 'Entrance', 'Fall Hazard', 'medium', '2024-11-04', 'Safety Inspector Jane', 'Fix uneven porch step. Add outdoor lighting. Install doorbell camera.', 'in_progress', 'Step repair scheduled for next week.'),
      ('Dorothy Clark', 'Bathroom', 'Slip Hazard', 'high', '2024-11-05', 'Safety Inspector Mike', 'Install walk-in shower. Add raised toilet seat. Non-slip flooring.', 'identified', 'Current tub is dangerous for patient with fatigue issues.'),
      ('Dorothy Clark', 'Hallway', 'Lighting', 'medium', '2024-11-05', 'Safety Inspector Mike', 'Install motion-sensor lights. Remove hallway clutter.', 'resolved', 'Motion sensors installed throughout hallway.'),
      ('Harold Martinez', 'Garden', 'Fall Hazard', 'high', '2024-11-06', 'Safety Inspector Jane', 'Level garden path. Add handrails to garden steps. Clear debris.', 'in_progress', 'Patient fell in garden recently on uneven ground.'),
      ('Harold Martinez', 'Bathroom', 'Slip Hazard', 'medium', '2024-11-06', 'Safety Inspector Jane', 'Add non-slip mat in shower. Install grab bars.', 'resolved', 'Non-slip mat and grab bars installed.'),
      ('Betty Anderson', 'Stairs', 'Fall Hazard', 'critical', '2024-11-07', 'Safety Inspector Mike', 'Install stairlift or move bedroom to ground floor. Stairs are too dangerous.', 'in_progress', 'Patient fell down stairs. Stairlift being quoted.'),
      ('Betty Anderson', 'Bedroom', 'Emergency Access', 'high', '2024-11-07', 'Safety Inspector Mike', 'Install medical alert system. Emergency phone by bed. Clear path to door.', 'resolved', 'Medical alert pendant provided. Speed dial set up.'),
      ('George Taylor', 'Kitchen', 'Medication Storage', 'medium', '2024-11-08', 'Safety Inspector Jane', 'Proper insulin storage verification. Sharps disposal container needed.', 'resolved', 'Sharps container provided. Fridge temp verified for insulin.');
    `);
    console.log('Home safety seeded');

    // Seed Telemedicine (15 items)
    await client.query(`
      INSERT INTO telemedicine (patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes) VALUES
      ('Eleanor Williams', 'Dr. Sarah Johnson', 'Internal Medicine', '2024-11-10', '09:00', 20, 'Zoom Health', 'Follow-up', 'Hypertension - controlled', 'Continue Lisinopril 10mg', '2024-12-10', 'BP slightly elevated. Dietary sodium review needed.'),
      ('Eleanor Williams', 'Dr. Robert Chen', 'Endocrinology', '2024-11-08', '14:00', 25, 'Zoom Health', 'Follow-up', 'Type 2 Diabetes - monitoring', 'Continue Metformin 500mg bid', '2024-12-08', 'A1C improved to 7.1%. Continue current regimen.'),
      ('Robert Thompson', 'Dr. Sarah Johnson', 'Internal Medicine', '2024-11-09', '10:00', 15, 'Zoom Health', 'Follow-up', 'Hyperlipidemia', 'Review Atorvastatin - muscle pain reported', '2024-12-02', 'May switch to Rosuvastatin if side effects continue.'),
      ('Robert Thompson', 'Dr. James Lee', 'Cardiology', '2024-11-05', '11:00', 30, 'Doxy.me', 'Consultation', 'Stable cardiac function', 'No changes', '2024-12-10', 'ECG reviewed. No arrhythmias detected. Annual echo recommended.'),
      ('Margaret Davis', 'Dr. Lisa Park', 'Neurology', '2024-11-07', '13:00', 30, 'Zoom Health', 'Follow-up', 'Alzheimer Disease - mild/moderate', 'Continue Donepezil 5mg', '2024-12-03', 'Some cognitive decline noted. Caregiver support discussed.'),
      ('Margaret Davis', 'Dr. Karen White', 'Psychiatry', '2024-11-06', '15:00', 45, 'Doxy.me', 'Therapy', 'Adjustment disorder with depressed mood', 'Continue Sertraline 50mg', '2024-12-08', 'Coping well with art therapy. Maintain current approach.'),
      ('James Wilson', 'Dr. Michael Brown', 'Cardiology', '2024-11-04', '09:30', 20, 'Zoom Health', 'Follow-up', 'Atrial Fibrillation - stable', 'Continue Warfarin 5mg', '2024-12-04', 'INR in range. Continue weekly monitoring.'),
      ('James Wilson', 'Dr. Patricia Gray', 'Pulmonology', '2024-11-01', '10:30', 25, 'Doxy.me', 'Follow-up', 'Mild COPD', 'Albuterol inhaler PRN', '2024-12-12', 'Breathing exercises reviewed. SpO2 adequate.'),
      ('Dorothy Clark', 'Dr. Sarah Johnson', 'Endocrinology', '2024-11-03', '11:00', 20, 'Zoom Health', 'Follow-up', 'Hypothyroidism', 'May increase Levothyroxine to 88mcg', '2024-12-05', 'TSH slightly elevated. Recheck in 4 weeks.'),
      ('Dorothy Clark', 'Dr. Robert Chen', 'Gastroenterology', '2024-10-28', '14:00', 15, 'Zoom Health', 'Follow-up', 'GERD - improving', 'Continue Omeprazole 20mg', '2024-12-15', 'Symptoms much better. May try tapering after next visit.'),
      ('Harold Martinez', 'Dr. Lisa Park', 'Neurology', '2024-11-02', '09:00', 30, 'Zoom Health', 'Follow-up', 'Vascular Dementia - moderate', 'Continue Memantine 10mg bid', '2024-12-06', 'Cognitive exercises helping. Family education session planned.'),
      ('Harold Martinez', 'Dr. Robert Chen', 'Endocrinology', '2024-10-30', '10:00', 20, 'Doxy.me', 'Follow-up', 'Type 2 Diabetes with neuropathy', 'Continue Gabapentin 300mg tid, adjust insulin', '2024-12-18', 'Blood sugar spikes after meals. Dietary counseling reinforced.'),
      ('Betty Anderson', 'Dr. Michael Brown', 'Cardiology', '2024-11-01', '14:00', 25, 'Zoom Health', 'Urgent', 'CHF - decompensating', 'Increase Furosemide to 60mg if needed', '2024-12-07', 'Weight gain and edema noted. Close monitoring required.'),
      ('Betty Anderson', 'Dr. Susan Miller', 'Physical Therapy', '2024-10-29', '11:00', 30, 'Doxy.me', 'Assessment', 'Post-fall deconditioning', 'Home PT program 3x/week', '2024-12-09', 'Seated exercise program prescribed. Balance training needed.'),
      ('George Taylor', 'Dr. Robert Chen', 'Endocrinology', '2024-11-05', '09:00', 20, 'Zoom Health', 'Follow-up', 'Type 2 Diabetes - well controlled', 'Continue Insulin Glargine 20 units', '2024-12-08', 'Fasting glucose target met. Continue current management.');
    `);
    console.log('Telemedicine seeded');

    // Seed Hydration Tracking
    await client.query(`
      INSERT INTO hydration_tracking (patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes) VALUES
      ('Eleanor Williams', 'Water', 250, '2024-11-01 08:00', 2000, 'Morning glass with medication'),
      ('Eleanor Williams', 'Tea', 200, '2024-11-01 10:30', 2000, 'Green tea, no sugar'),
      ('Eleanor Williams', 'Water', 300, '2024-11-01 12:00', 2000, 'With lunch'),
      ('Eleanor Williams', 'Juice', 150, '2024-11-01 15:00', 2000, 'Apple juice diluted'),
      ('Harold Martinez', 'Water', 200, '2024-11-01 07:30', 1800, 'First thing in the morning'),
      ('Harold Martinez', 'Coffee', 180, '2024-11-01 09:00', 1800, 'Decaf with breakfast'),
      ('Harold Martinez', 'Water', 250, '2024-11-01 13:00', 1800, 'Afternoon hydration'),
      ('Betty Anderson', 'Water', 200, '2024-11-01 08:30', 1500, 'Small sips due to CHF fluid restriction'),
      ('Betty Anderson', 'Broth', 150, '2024-11-01 12:00', 1500, 'Low sodium chicken broth'),
      ('George Taylor', 'Water', 300, '2024-11-01 07:00', 2000, 'Morning hydration');
    `);
    console.log('Hydration tracking seeded');

    // Seed Physical Therapy
    await client.query(`
      INSERT INTO physical_therapy (patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status) VALUES
      ('Eleanor Williams', 'Dr. Lisa Park', 'Chair Squats', 'Strength', '2024-11-01 10:00', 30, 3, 10, 2, 'Good form maintained throughout', 'completed'),
      ('Eleanor Williams', 'Dr. Lisa Park', 'Arm Raises', 'Range of Motion', '2024-11-01 10:30', 15, 2, 12, 1, 'Full range achieved', 'completed'),
      ('Harold Martinez', 'Dr. James Lee', 'Balance Board', 'Balance', '2024-11-02 14:00', 20, 1, 1, 3, 'Slight wobble on left side', 'completed'),
      ('Harold Martinez', 'Dr. James Lee', 'Resistance Band Pull', 'Strength', '2024-11-02 14:30', 25, 3, 8, 2, 'Increased resistance from last session', 'completed'),
      ('Betty Anderson', 'Dr. Lisa Park', 'Seated Marching', 'Cardiovascular', '2024-11-03 09:00', 15, 2, 20, 1, 'Tolerated well, no shortness of breath', 'completed'),
      ('Betty Anderson', 'Dr. Lisa Park', 'Ankle Pumps', 'Circulation', '2024-11-03 09:20', 10, 3, 15, 0, 'Reducing edema effectively', 'completed'),
      ('George Taylor', 'Dr. James Lee', 'Walking Program', 'Cardiovascular', '2024-11-04 11:00', 20, 1, 1, 2, '200m walk with walker', 'completed'),
      ('George Taylor', 'Dr. James Lee', 'Hip Abduction', 'Strength', '2024-11-04 11:30', 15, 2, 10, 3, 'Mild discomfort, adjusted angle', 'completed');
    `);
    console.log('Physical therapy seeded');

    // Seed Medical Records
    await client.query(`
      INSERT INTO medical_records (patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes) VALUES
      ('Eleanor Williams', 'Diagnosis', 'Hypertension', 'Stage 2 hypertension diagnosed', 'Dr. Michael Brown', 'City General Hospital', '2020-03-15', 'I10', NULL, 'Well controlled with current medication'),
      ('Eleanor Williams', 'Lab Result', 'Annual Blood Work', 'Complete metabolic panel and CBC', 'Dr. Susan Miller', 'City General Hospital', '2024-09-20', NULL, NULL, 'All values within normal limits'),
      ('Harold Martinez', 'Diagnosis', 'Type 2 Diabetes', 'Diabetes mellitus type 2 with neuropathy', 'Dr. Robert Chen', 'Valley Medical Center', '2018-06-10', 'E11.40', NULL, 'Managed with insulin and oral medications'),
      ('Harold Martinez', 'Procedure', 'Cataract Surgery', 'Left eye cataract removal', 'Dr. Amy Wong', 'Valley Medical Center', '2024-02-14', NULL, NULL, 'Successful, vision improved significantly'),
      ('Betty Anderson', 'Diagnosis', 'Congestive Heart Failure', 'CHF NYHA Class II', 'Dr. Michael Brown', 'City General Hospital', '2021-11-03', 'I50.9', NULL, 'Requires ongoing monitoring and fluid restriction'),
      ('Betty Anderson', 'Imaging', 'Chest X-Ray', 'Routine chest imaging', 'Dr. Michael Brown', 'City General Hospital', '2024-10-01', NULL, NULL, 'Mild cardiomegaly, no acute findings'),
      ('George Taylor', 'Diagnosis', 'Osteoarthritis', 'Bilateral knee osteoarthritis', 'Dr. James Lee', 'Sunrise Medical', '2019-08-22', 'M17.0', NULL, 'Physical therapy and pain management'),
      ('George Taylor', 'Lab Result', 'HbA1c Test', 'Glycated hemoglobin test', 'Dr. Robert Chen', 'Sunrise Medical', '2024-10-15', NULL, NULL, 'HbA1c 6.8% - well controlled');
    `);
    console.log('Medical records seeded');

    // Seed Allergies
    await client.query(`
      INSERT INTO allergies (patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status, notes) VALUES
      ('Eleanor Williams', 'Penicillin', 'Drug', 'severe', 'Anaphylaxis, hives, difficulty breathing', '2005-04-12', 'Dr. Susan Miller', 'Epinephrine auto-injector, avoid all penicillin derivatives', 'active', 'Wears medical alert bracelet'),
      ('Eleanor Williams', 'Shellfish', 'Food', 'moderate', 'Hives and stomach upset', '2010-08-20', 'Dr. Susan Miller', 'Antihistamines as needed', 'active', 'Can tolerate fish, only shellfish affected'),
      ('Harold Martinez', 'Sulfa Drugs', 'Drug', 'moderate', 'Skin rash and itching', '2015-03-05', 'Dr. Robert Chen', 'Avoid sulfonamide antibiotics', 'active', 'Alternative antibiotics prescribed'),
      ('Harold Martinez', 'Latex', 'Contact', 'mild', 'Skin irritation at contact site', '2019-01-15', 'Dr. Robert Chen', 'Use non-latex gloves', 'active', 'Facility notified for all procedures'),
      ('Betty Anderson', 'Aspirin', 'Drug', 'moderate', 'GI bleeding risk', '2021-12-01', 'Dr. Michael Brown', 'Use acetaminophen instead', 'active', 'Due to CHF and blood thinners'),
      ('Betty Anderson', 'Peanuts', 'Food', 'severe', 'Throat swelling, anaphylaxis risk', '1998-06-15', 'Dr. Susan Miller', 'Epinephrine auto-injector', 'active', 'Strict avoidance of all peanut products'),
      ('George Taylor', 'Iodine Contrast', 'Drug', 'mild', 'Mild nausea and flushing', '2022-05-10', 'Dr. Amy Wong', 'Premedicate with steroids before contrast scans', 'active', 'Can still have contrast with premedication'),
      ('George Taylor', 'Dust Mites', 'Environmental', 'mild', 'Sneezing and nasal congestion', '2010-11-20', 'Dr. Susan Miller', 'Antihistamines, HEPA filters', 'active', 'Bedroom has air purifier');
    `);
    console.log('Allergies seeded');

    // Seed Immunizations
    await client.query(`
      INSERT INTO immunizations (patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes) VALUES
      ('Eleanor Williams', 'Influenza (Flu)', 'Seasonal', 1, '2024-10-01', 'Nurse Mary Smith', 'City General Hospital', 'FL2024-A1', '2025-10-01', 'Mild arm soreness', 'High-dose formulation for 65+'),
      ('Eleanor Williams', 'COVID-19 Booster', 'mRNA', 5, '2024-09-15', 'Nurse Mary Smith', 'City General Hospital', 'CV2024-B3', '2025-09-15', 'None', 'Updated 2024-2025 formulation'),
      ('Eleanor Williams', 'Pneumococcal (PCV20)', 'Conjugate', 1, '2023-03-10', 'Dr. Susan Miller', 'City General Hospital', 'PN2023-C1', NULL, 'None', 'One-time dose, no booster needed'),
      ('Harold Martinez', 'Influenza (Flu)', 'Seasonal', 1, '2024-10-05', 'Nurse Mary Smith', 'Valley Medical Center', 'FL2024-A2', '2025-10-05', 'Mild fatigue', 'High-dose formulation'),
      ('Harold Martinez', 'Shingles (Shingrix)', 'Recombinant', 2, '2024-04-15', 'Dr. Robert Chen', 'Valley Medical Center', 'SH2024-D1', NULL, 'Arm soreness, mild fever', 'Second dose completed'),
      ('Harold Martinez', 'Tdap', 'Toxoid', 1, '2022-06-20', 'Dr. Robert Chen', 'Valley Medical Center', 'TD2022-E1', '2032-06-20', 'None', 'Tetanus booster every 10 years'),
      ('Betty Anderson', 'Influenza (Flu)', 'Seasonal', 1, '2024-10-10', 'Nurse Mary Smith', 'City General Hospital', 'FL2024-A3', '2025-10-10', 'None', 'Monitored 30min post-injection due to CHF'),
      ('George Taylor', 'Influenza (Flu)', 'Seasonal', 1, '2024-10-08', 'Nurse Mary Smith', 'Sunrise Medical', 'FL2024-A4', '2025-10-08', 'Arm soreness', 'No adverse reactions');
    `);
    console.log('Immunizations seeded');

    // Seed Visitor Log
    await client.query(`
      INSERT INTO visitor_log (patient_name, visitor_name, relationship, visit_date, visit_duration_minutes, purpose, mood_after_visit, notes) VALUES
      ('Eleanor Williams', 'Sarah Williams', 'Daughter', '2024-11-01 14:00', 90, 'Regular family visit', 'very happy', 'Brought grandchildren, played cards together'),
      ('Eleanor Williams', 'Rev. Thomas Clark', 'Pastor', '2024-10-28 10:00', 45, 'Spiritual support', 'peaceful', 'Weekly pastoral visit, prayer and conversation'),
      ('Harold Martinez', 'Carlos Martinez', 'Son', '2024-11-02 11:00', 120, 'Family visit', 'happy', 'Watched football game together, had lunch'),
      ('Harold Martinez', 'Maria Lopez', 'Friend', '2024-10-30 15:00', 60, 'Social visit', 'cheerful', 'Old friend from church, reminisced about old times'),
      ('Betty Anderson', 'James Anderson', 'Husband', '2024-11-01 09:00', 180, 'Daily visit', 'content', 'Visits every morning, reads newspaper together'),
      ('Betty Anderson', 'Dr. Michael Brown', 'Physician', '2024-10-29 14:00', 30, 'Medical check-up', 'neutral', 'Routine home visit to assess CHF symptoms'),
      ('George Taylor', 'Linda Taylor', 'Wife', '2024-11-01 10:00', 240, 'Daily visit', 'happy', 'Stays most of the day, helps with meals'),
      ('George Taylor', 'Mark Taylor', 'Son', '2024-10-27 13:00', 90, 'Family visit', 'energized', 'Helped set up new tablet for video calls');
    `);
    console.log('Visitor log seeded');

    // Seed Care Plans
    await client.query(`
      INSERT INTO care_plans (patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status, review_date, notes) VALUES
      ('Eleanor Williams', 'Hypertension Management', 'Medical', '2024-01-01', '2024-12-31', 'Maintain BP below 140/90', 'Daily BP monitoring, medication compliance, low sodium diet', 'Dr. Michael Brown', 'Daily', 'active', '2024-12-01', 'Patient is compliant with medication regimen'),
      ('Eleanor Williams', 'Fall Prevention', 'Safety', '2024-06-01', '2025-06-01', 'Zero falls, improve balance', 'PT 3x/week, home safety modifications, assistive devices', 'Dr. Lisa Park', 'Weekly', 'active', '2025-01-15', 'Grab bars installed in bathroom'),
      ('Harold Martinez', 'Diabetes Management', 'Medical', '2024-01-01', '2024-12-31', 'HbA1c below 7.0%, prevent complications', 'Insulin management, glucose monitoring 4x/day, diabetic diet', 'Dr. Robert Chen', 'Daily', 'active', '2024-12-15', 'Good glucose control this quarter'),
      ('Harold Martinez', 'Cognitive Stimulation', 'Cognitive', '2024-03-01', '2025-03-01', 'Maintain cognitive function, prevent decline', 'Daily puzzles, reading, social activities, memory exercises', 'Nurse Mary Smith', 'Daily', 'active', '2025-01-01', 'Enjoying crossword puzzles and card games'),
      ('Betty Anderson', 'CHF Management', 'Medical', '2024-01-01', '2024-12-31', 'Prevent decompensation, maintain fluid balance', 'Daily weight, fluid restriction 1.5L, medication compliance, low sodium diet', 'Dr. Michael Brown', 'Daily', 'active', '2024-12-01', 'Weight stable this month'),
      ('Betty Anderson', 'Mobility Improvement', 'Rehabilitation', '2024-09-01', '2025-03-01', 'Independent transfers, walk 50m with walker', 'Seated PT, progressive walking program, strength training', 'Dr. Lisa Park', 'Three times weekly', 'active', '2025-01-15', 'Making slow but steady progress'),
      ('George Taylor', 'Pain Management', 'Medical', '2024-01-01', '2024-12-31', 'Pain level below 4/10, maintain function', 'Scheduled pain medication, PT, hot/cold therapy, gentle exercise', 'Dr. James Lee', 'Daily', 'active', '2024-12-01', 'Pain well controlled with current regimen'),
      ('George Taylor', 'Social Engagement', 'Wellness', '2024-06-01', '2025-06-01', 'Reduce isolation, participate in 3+ activities/week', 'Group activities, family video calls, volunteer visits', 'John Caregiver', 'Weekly', 'active', '2025-01-01', 'Participating regularly in group activities');
    `);
    console.log('Care plans seeded');

    // Seed Incident Reports
    await client.query(`
      INSERT INTO incident_reports (patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status, notes) VALUES
      ('Eleanor Williams', 'Near Fall', '2024-10-15 14:30', 'Bathroom', 'Patient slipped on wet floor but grabbed grab bar in time', 'low', 'Nurse Mary Smith', 'Non-slip mats added, reminded to use call bell', 'Nurse Mary Smith', true, 'resolved', 'Additional safety measures implemented'),
      ('Eleanor Williams', 'Medication Error', '2024-09-20 08:00', 'Dining Room', 'Morning medication given 30 minutes late due to staff changeover', 'low', 'John Caregiver', 'Shift handoff protocol reviewed with staff', 'John Caregiver', false, 'resolved', 'No adverse effects observed'),
      ('Harold Martinez', 'Behavioral', '2024-10-22 16:00', 'Common Area', 'Patient became agitated and confused during sundowning episode', 'medium', 'John Caregiver, Nurse Mary Smith', 'Redirected to quiet room, calming music played, PRN medication offered', 'Nurse Mary Smith', true, 'resolved', 'Sundowning protocol reviewed'),
      ('Harold Martinez', 'Equipment Malfunction', '2024-10-28 10:00', 'Bedroom', 'Blood glucose monitor gave error reading twice', 'low', 'John Caregiver', 'Replaced monitor, rechecked glucose manually', 'John Caregiver', false, 'resolved', 'New monitor ordered'),
      ('Betty Anderson', 'Medical Emergency', '2024-10-05 02:30', 'Bedroom', 'Patient experienced shortness of breath and rapid heart rate', 'high', 'Night Nurse', 'Oxygen administered, Dr. Brown notified, vitals monitored q15min', 'Night Nurse', true, 'resolved', 'CHF medication adjusted by cardiologist'),
      ('Betty Anderson', 'Skin Integrity', '2024-10-18 09:00', 'Bedroom', 'Stage 1 pressure area noted on left heel', 'medium', 'Nurse Mary Smith', 'Heel protectors applied, repositioning schedule increased to q2h', 'Nurse Mary Smith', true, 'open', 'Wound care team consulted'),
      ('George Taylor', 'Fall', '2024-10-10 07:45', 'Bedroom', 'Patient fell while attempting to get out of bed unassisted', 'medium', 'None - found by John Caregiver', 'Assessed for injury, vitals checked, X-ray ordered', 'John Caregiver', true, 'resolved', 'No fractures, bruising on right hip'),
      ('George Taylor', 'Wandering', '2024-10-25 19:00', 'Hallway', 'Patient found in hallway confused about location', 'low', 'John Caregiver', 'Gently redirected to room, evening routine initiated', 'John Caregiver', false, 'resolved', 'May need door alarm at night');
    `);
    console.log('Incident reports seeded');

    // Seed Insurance
    await client.query(`
      INSERT INTO insurance (patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes) VALUES
      ('Eleanor Williams', 'Medicare Part A', 'MCA-2024-EW001', NULL, 'Hospital Insurance', '2024-01-01', '2024-12-31', 0.00, 1632.00, '1-800-633-4227', 'Covers inpatient hospital stays'),
      ('Eleanor Williams', 'Medicare Part B', 'MCB-2024-EW001', NULL, 'Medical Insurance', '2024-01-01', '2024-12-31', 20.00, 240.00, '1-800-633-4227', 'Covers outpatient care, preventive services'),
      ('Eleanor Williams', 'AARP Medigap Plan F', 'MG-2024-EW001', 'GRP-445', 'Supplemental', '2024-01-01', '2024-12-31', 0.00, 0.00, '1-800-523-5800', 'Covers Medicare gaps'),
      ('Harold Martinez', 'Medicare Part A', 'MCA-2024-HM001', NULL, 'Hospital Insurance', '2024-01-01', '2024-12-31', 0.00, 1632.00, '1-800-633-4227', 'Covers inpatient hospital stays'),
      ('Harold Martinez', 'Medicare Part D', 'MCD-2024-HM001', 'GRP-889', 'Prescription Drug', '2024-01-01', '2024-12-31', 15.00, 545.00, '1-800-633-4227', 'Covers insulin and diabetes medications'),
      ('Betty Anderson', 'Medicare Part A', 'MCA-2024-BA001', NULL, 'Hospital Insurance', '2024-01-01', '2024-12-31', 0.00, 1632.00, '1-800-633-4227', 'Multiple hospitalizations this year'),
      ('Betty Anderson', 'Blue Cross Blue Shield', 'BCBS-2024-BA001', 'GRP-221', 'Supplemental', '2024-01-01', '2024-12-31', 25.00, 500.00, '1-800-262-2583', 'Employer retiree benefit through husband'),
      ('George Taylor', 'Medicare Advantage', 'MA-2024-GT001', 'GRP-667', 'HMO', '2024-01-01', '2024-12-31', 10.00, 0.00, '1-800-633-4227', 'Includes PT and vision coverage');
    `);
    console.log('Insurance seeded');

    // Seed Wound Care
    await client.query(`
      INSERT INTO wound_care (patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes) VALUES
      ('Betty Anderson', 'Pressure Ulcer', 'Left Heel', 2.50, 'Stage 1', 'Offloading, moisture barrier cream, repositioning q2h', 'Foam Dressing', '2024-10-30', '2024-11-02', 'improving', 'Nurse Mary Smith', 'Redness reducing, no skin breakdown'),
      ('Betty Anderson', 'Skin Tear', 'Right Forearm', 3.00, 'Category 1', 'Wound cleansing, steri-strips, protective covering', 'Non-adherent Dressing', '2024-10-28', '2024-10-31', 'healing', 'Nurse Mary Smith', 'Caused by wheelchair transfer, edges approximated'),
      ('Eleanor Williams', 'Surgical Wound', 'Right Knee', 8.00, 'Closed', 'Keep clean and dry, monitor for infection signs', 'Waterproof Bandage', '2024-10-25', '2024-11-01', 'healing', 'Nurse Mary Smith', 'Post-arthroscopy, sutures to be removed next week'),
      ('George Taylor', 'Bruise', 'Right Hip', 5.00, 'N/A', 'Ice first 48h, then warm compress, monitor size', 'None', '2024-10-10', '2024-10-14', 'resolved', 'John Caregiver', 'From fall incident, resolved within 2 weeks'),
      ('Harold Martinez', 'Diabetic Ulcer', 'Left Foot', 1.50, 'Stage 2', 'Wound debridement, antimicrobial dressing, offloading shoe', 'Alginate Dressing', '2024-10-29', '2024-11-01', 'stable', 'Nurse Mary Smith', 'Podiatrist following weekly, no signs of infection');
    `);
    console.log('Wound care seeded');

    // Seed Billing
    await client.query(`
      INSERT INTO billing (patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes) VALUES
      ('Eleanor Williams', 'Home Care', 'Monthly home care aide services - October', 2400.00, '2024-11-01', '2024-11-30', 1800.00, 600.00, 'pending', NULL, '8 hours/day, 5 days/week'),
      ('Eleanor Williams', 'Physical Therapy', 'PT sessions - October (8 sessions)', 960.00, '2024-11-01', '2024-11-30', 768.00, 192.00, 'pending', NULL, 'Medicare Part B covers 80%'),
      ('Eleanor Williams', 'Pharmacy', 'Monthly prescription medications', 145.00, '2024-10-15', '2024-10-30', 95.00, 50.00, 'paid', 'Credit Card', 'Medigap covered remaining copay'),
      ('Harold Martinez', 'Home Care', 'Monthly home care aide services - October', 2400.00, '2024-11-01', '2024-11-30', 2000.00, 400.00, 'pending', NULL, 'Full-time care with diabetes management'),
      ('Harold Martinez', 'Lab Work', 'Quarterly blood panel and HbA1c', 350.00, '2024-10-15', '2024-11-15', 315.00, 35.00, 'paid', 'Check', 'Medicare Part B with supplement'),
      ('Betty Anderson', 'Hospital', 'ER visit - CHF decompensation', 4500.00, '2024-10-05', '2024-11-05', 4200.00, 300.00, 'partial', 'Insurance', 'BCBS supplemental covering remaining'),
      ('Betty Anderson', 'Medical Equipment', 'Wheelchair rental - October', 200.00, '2024-11-01', '2024-11-30', 180.00, 20.00, 'pending', NULL, 'Medicare Advantage covers 90%'),
      ('George Taylor', 'Physical Therapy', 'PT sessions - October (6 sessions)', 720.00, '2024-11-01', '2024-11-30', 720.00, 0.00, 'paid', 'Insurance', 'Medicare Advantage covers 100% PT');
    `);
    console.log('Billing seeded');

    // Seed Family Messages
    await client.query(`
      INSERT INTO family_messages (patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at) VALUES
      ('Eleanor Williams', 'Sarah Williams', 'Nurse Mary Smith', 'Mom''s medication question', 'Hi, Mom mentioned her new blood pressure medication makes her dizzy. Is this normal? Should we be concerned?', 'high', true, '2024-10-28 09:15'),
      ('Eleanor Williams', 'Nurse Mary Smith', 'Sarah Williams', 'Re: Mom''s medication question', 'Hi Sarah, mild dizziness can occur with Amlodipine. We''re monitoring her BP. If it persists, Dr. Brown may adjust the dose. No cause for alarm currently.', 'normal', true, '2024-10-28 11:30'),
      ('Harold Martinez', 'Carlos Martinez', 'John Caregiver', 'Dad''s birthday plans', 'We''d like to bring a small cake for Dad''s birthday on the 15th. Is there a diabetic-friendly option you recommend?', 'normal', true, '2024-10-25 14:00'),
      ('Harold Martinez', 'John Caregiver', 'Carlos Martinez', 'Re: Dad''s birthday plans', 'Great idea! I recommend a sugar-free carrot cake from the local bakery. We''ll adjust his insulin timing. Bring the family!', 'normal', true, '2024-10-25 16:30'),
      ('Betty Anderson', 'James Anderson', 'Nurse Mary Smith', 'Concerned about Betty''s breathing', 'Betty seemed more short of breath than usual yesterday. Has anything changed with her medications?', 'high', true, '2024-10-30 07:00'),
      ('Betty Anderson', 'Nurse Mary Smith', 'James Anderson', 'Re: Concerned about Betty''s breathing', 'Thank you for letting us know. We''ve increased her monitoring. Her weight is stable and oxygen levels are good. Dr. Brown will review tomorrow.', 'high', true, '2024-10-30 08:45'),
      ('George Taylor', 'Mark Taylor', 'John Caregiver', 'Video call setup', 'Can you help Dad set up the tablet for our Sunday video calls? He said he''s having trouble with the app.', 'normal', false, '2024-10-31 18:00'),
      ('George Taylor', 'Linda Taylor', 'Nurse Mary Smith', 'George''s knee pain', 'George mentioned his knee has been worse this week. Can we discuss options at the next appointment?', 'normal', true, '2024-10-29 10:00');
    `);
    console.log('Family messages seeded');

    // Seed Legal Documents
    await client.query(`
      INSERT INTO legal_documents (patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes) VALUES
      ('Eleanor Williams', 'Power of Attorney', 'Healthcare Power of Attorney', 'Sarah Williams designated as healthcare POA for all medical decisions', 'Atty. Robert Black', '2020-05-15', NULL, 'Family safe, copy in medical chart', 'active', 'Daughter has legal authority for medical decisions'),
      ('Eleanor Williams', 'Living Will', 'Advance Directive', 'DNR order, no artificial life support, comfort care preferred', 'Atty. Robert Black', '2020-05-15', NULL, 'Family safe, copy in medical chart', 'active', 'Reviewed and confirmed October 2024'),
      ('Harold Martinez', 'Power of Attorney', 'Durable Power of Attorney', 'Carlos Martinez designated for financial and healthcare decisions', 'Atty. Maria Santos', '2019-08-20', NULL, 'Attorney office, copy in chart', 'active', 'Son manages all financial and medical decisions'),
      ('Harold Martinez', 'POLST', 'Physician Orders for Life-Sustaining Treatment', 'Full treatment requested, includes CPR and hospitalization', 'Dr. Robert Chen', '2024-01-10', '2025-01-10', 'Medical chart, bedside', 'active', 'Annual renewal required'),
      ('Betty Anderson', 'Power of Attorney', 'Healthcare Power of Attorney', 'James Anderson (husband) designated as primary, daughter as alternate', 'Atty. Thomas Wright', '2021-03-01', NULL, 'Home safe, copy in chart', 'active', 'Husband is primary decision maker'),
      ('Betty Anderson', 'Living Will', 'Advance Directive', 'Full code status, wants all life-sustaining measures', 'Atty. Thomas Wright', '2021-03-01', NULL, 'Home safe, copy in chart', 'active', 'Patient and family discussed, clear wishes documented'),
      ('George Taylor', 'Power of Attorney', 'Financial Power of Attorney', 'Linda Taylor (wife) manages all financial affairs', 'Atty. Robert Black', '2022-11-10', NULL, 'Home safe, copy with attorney', 'active', 'Wife handles all financial matters'),
      ('George Taylor', 'Trust', 'Family Living Trust', 'Revocable living trust for estate planning', 'Atty. Robert Black', '2022-11-10', NULL, 'Attorney office', 'active', 'Includes all property and investments');
    `);
    console.log('Legal documents seeded');

    // Seed Grocery Shopping
    await client.query(`
      INSERT INTO grocery_shopping (patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes) VALUES
      ('Eleanor Williams', 'Low Sodium Chicken Broth', 'Soups', 4, 'cans', '2024-11-05', 'Low sodium required', false, 'Whole Foods', 'For daily soup'),
      ('Eleanor Williams', 'Bananas', 'Fruits', 6, 'pieces', '2024-11-03', 'Potassium-rich for BP management', false, 'Trader Joes', 'Prefers slightly green'),
      ('Eleanor Williams', 'Oatmeal', 'Breakfast', 1, 'box', '2024-11-05', 'Heart healthy', true, 'Whole Foods', 'Steel cut preferred'),
      ('Harold Martinez', 'Sugar-Free Yogurt', 'Dairy', 6, 'cups', '2024-11-03', 'Diabetic friendly', false, 'Costco', 'Greek yogurt, plain'),
      ('Harold Martinez', 'Whole Wheat Bread', 'Bakery', 1, 'loaf', '2024-11-04', 'Low glycemic index', false, 'Whole Foods', 'No added sugar'),
      ('Harold Martinez', 'Blood Glucose Test Strips', 'Medical', 1, 'box (100)', '2024-11-02', NULL, false, 'CVS Pharmacy', 'OneTouch brand'),
      ('Betty Anderson', 'Low Sodium Crackers', 'Snacks', 2, 'boxes', '2024-11-05', 'Low sodium, low fluid', false, 'Trader Joes', 'For snacking between meals'),
      ('Betty Anderson', 'Ensure Nutrition Shake', 'Nutrition', 12, 'bottles', '2024-11-03', 'Heart healthy formula', false, 'CVS Pharmacy', 'Vanilla flavor preferred'),
      ('George Taylor', 'Prune Juice', 'Beverages', 2, 'bottles', '2024-11-04', NULL, false, 'Whole Foods', 'For digestive health'),
      ('George Taylor', 'Fresh Salmon', 'Seafood', 2, 'fillets', '2024-11-03', 'Omega-3 for joint health', false, 'Whole Foods', 'Wild caught preferred');
    `);
    console.log('Grocery shopping seeded');

    // Seed Housekeeping
    await client.query(`
      INSERT INTO housekeeping (patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes) VALUES
      ('Eleanor Williams', 'Vacuum Carpets', 'Living Room', 'Weekly', 'Cleaning Service', '2024-11-04', NULL, 'pending', 'normal', 'Use HEPA filter vacuum'),
      ('Eleanor Williams', 'Bathroom Deep Clean', 'Bathroom', 'Weekly', 'Cleaning Service', '2024-11-04', NULL, 'pending', 'high', 'Ensure grab bars are secure during cleaning'),
      ('Eleanor Williams', 'Change Bed Linens', 'Bedroom', 'Twice weekly', 'John Caregiver', '2024-11-01', '2024-11-01', 'completed', 'normal', 'Hypoallergenic sheets only'),
      ('Harold Martinez', 'Kitchen Sanitization', 'Kitchen', 'Daily', 'John Caregiver', '2024-11-01', '2024-11-01', 'completed', 'high', 'Important for diabetic food safety'),
      ('Harold Martinez', 'Organize Medications', 'Bedroom', 'Weekly', 'Nurse Mary Smith', '2024-11-03', NULL, 'pending', 'high', 'Refill weekly pill organizer'),
      ('Betty Anderson', 'Dust All Surfaces', 'Bedroom', 'Twice weekly', 'Cleaning Service', '2024-11-02', NULL, 'pending', 'normal', 'Use damp cloth, patient has dust sensitivity'),
      ('Betty Anderson', 'Laundry', 'Laundry Room', 'Three times weekly', 'John Caregiver', '2024-11-01', '2024-11-01', 'completed', 'normal', 'Fragrance-free detergent only'),
      ('George Taylor', 'Floor Mopping', 'Kitchen', 'Daily', 'John Caregiver', '2024-11-01', '2024-11-01', 'completed', 'high', 'Keep dry immediately to prevent slip hazard'),
      ('George Taylor', 'Window Cleaning', 'Living Room', 'Monthly', 'Cleaning Service', '2024-11-15', NULL, 'pending', 'low', 'Patient enjoys natural light'),
      ('George Taylor', 'Organize Closet', 'Bedroom', 'Monthly', 'Linda Taylor', '2024-11-10', NULL, 'pending', 'low', 'Keep frequently used items at accessible height');
    `);
    console.log('Housekeeping seeded');

    // Seed Medical Equipment
    await client.query(`
      INSERT INTO medical_equipment (patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes) VALUES
      ('Eleanor Williams', 'Digital Blood Pressure Monitor', 'Monitoring', 'Omron', 'OMR-2023-BP001', '2023-06-15', '2025-06-15', '2024-10-01', '2025-01-01', 'good', 'Bedroom nightstand', 'Calibrated quarterly'),
      ('Eleanor Williams', 'Rollator Walker', 'Mobility', 'Drive Medical', 'DM-2024-RW001', '2024-01-10', '2026-01-10', '2024-09-15', '2025-03-15', 'good', 'Hallway', 'Brakes checked, tires good'),
      ('Eleanor Williams', 'Shower Chair', 'Safety', 'Medline', 'ML-2023-SC001', '2023-08-20', '2025-08-20', '2024-08-20', '2025-02-20', 'good', 'Bathroom', 'Non-slip feet, weight capacity 300lbs'),
      ('Harold Martinez', 'Blood Glucose Monitor', 'Monitoring', 'OneTouch', 'OT-2024-BG001', '2024-10-28', '2026-10-28', '2024-10-28', '2025-04-28', 'new', 'Bedroom', 'Replacement for malfunctioning unit'),
      ('Harold Martinez', 'Insulin Pump', 'Treatment', 'Medtronic', 'MT-2023-IP001', '2023-03-01', '2027-03-01', '2024-09-01', '2025-03-01', 'good', 'Worn by patient', 'Supplies ordered monthly'),
      ('Harold Martinez', 'Diabetic Shoes', 'Orthopedic', 'Dr. Comfort', 'DC-2024-DS001', '2024-05-15', NULL, NULL, NULL, 'good', 'Bedroom closet', 'Custom molded, offloading left foot'),
      ('Betty Anderson', 'Portable Oxygen Concentrator', 'Respiratory', 'Inogen', 'IG-2024-OC001', '2024-02-01', '2027-02-01', '2024-10-01', '2025-01-01', 'good', 'Bedroom', 'Used during CHF flare-ups, PRN'),
      ('Betty Anderson', 'Wheelchair', 'Mobility', 'Invacare', 'IV-2024-WC001', '2024-03-15', '2026-03-15', '2024-09-15', '2025-03-15', 'good', 'Room entrance', 'Lightweight, rented through Medicare'),
      ('Betty Anderson', 'Hospital Bed', 'Furniture', 'Hill-Rom', 'HR-2024-HB001', '2024-01-20', '2026-01-20', '2024-07-20', '2025-01-20', 'good', 'Bedroom', 'Electric adjustable, pressure-relieving mattress'),
      ('George Taylor', 'CPAP Machine', 'Respiratory', 'ResMed', 'RM-2022-CP001', '2022-09-10', '2025-09-10', '2024-09-10', '2025-03-10', 'fair', 'Bedroom nightstand', 'Filter replacement needed soon'),
      ('George Taylor', 'Quad Cane', 'Mobility', 'Hugo', 'HG-2024-QC001', '2024-10-12', '2026-10-12', '2024-10-12', '2025-04-12', 'new', 'Bedside', 'Provided after fall incident'),
      ('George Taylor', 'Bed Alarm', 'Safety', 'Smart Caregiver', 'SC-2024-BA001', '2024-10-15', '2026-10-15', '2024-10-15', '2025-04-15', 'new', 'Under bed mattress', 'Alerts when patient attempts to get up unassisted');
    `);
    console.log('Medical equipment seeded');

    console.log('\n✅ All data seeded successfully!');
    console.log('Login credentials:');
    console.log('  Admin: admin@eldercare.com / password123');
    console.log('  Nurse: nurse@eldercare.com / password123');
    console.log('  Caregiver: caregiver@eldercare.com / password123');

  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
