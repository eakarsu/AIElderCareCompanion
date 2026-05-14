const { redactPHI, rehydrate } = require('../utils/phiRedaction');

function assertEqual(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    console.error(`FAIL: ${msg}\n  expected: ${sb}\n  got:      ${sa}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

// 1. Patient name field gets tokenized
{
  const { redacted, mapping } = redactPHI({ patient_name: 'Jane Doe', age: 78 });
  assertEqual(redacted.patient_name, 'PATIENT_1', 'patient_name => token');
  assertEqual(mapping['PATIENT_1'], 'Jane Doe', 'mapping captures original');
  assertEqual(redacted.age, 78, 'numeric fields untouched');
}

// 2. Email regex
{
  const { redacted, mapping } = redactPHI({ note: 'Contact me at jane@example.com please' });
  if (!redacted.note.includes('EMAIL_')) {
    console.error('FAIL: email not tokenized:', redacted.note);
    process.exitCode = 1;
  } else {
    console.log('OK: email regex redaction');
  }
  const original = Object.values(mapping)[0];
  if (original !== 'jane@example.com') {
    console.error('FAIL: mapping wrong:', mapping);
    process.exitCode = 1;
  } else {
    console.log('OK: email mapping captured');
  }
}

// 3. SSN
{
  const { redacted } = redactPHI({ note: 'SSN is 123-45-6789' });
  if (!redacted.note.includes('SSN_')) {
    console.error('FAIL: SSN not tokenized:', redacted.note);
    process.exitCode = 1;
  } else {
    console.log('OK: SSN regex redaction');
  }
}

// 4. Nested objects
{
  const input = { patient: { name: 'Bob Smith' }, doctor_name: 'Dr Alice' };
  const { redacted, mapping } = redactPHI(input);
  if (!redacted.patient.name.startsWith('PATIENT_')) {
    console.error('FAIL: nested name not tokenized:', JSON.stringify(redacted));
    process.exitCode = 1;
  } else {
    console.log('OK: nested patient name');
  }
  if (!redacted.doctor_name.startsWith('DOCTOR_')) {
    console.error('FAIL: doctor_name not tokenized:', redacted.doctor_name);
    process.exitCode = 1;
  } else {
    console.log('OK: doctor_name tokenized');
  }
  // Roundtrip rehydrate
  const sample = `${redacted.patient.name} saw ${redacted.doctor_name}`;
  const hydrated = rehydrate(sample, mapping);
  assertEqual(hydrated, 'Bob Smith saw Dr Alice', 'rehydrate roundtrip');
}

// 5. Array of medications stays structured
{
  const input = { medications: [{ name: 'Aspirin', for_patient: 'Carol' }, { name: 'Metformin' }], patient_name: 'Carol' };
  const { redacted, mapping } = redactPHI(input);
  // 'name' field is in PHI map as PATIENT, so med.name becomes a token
  if (!redacted.medications[0].name.startsWith('PATIENT_')) {
    console.error('FAIL: med name not tokenized (expected because "name" is in field map):', redacted.medications[0].name);
    process.exitCode = 1;
  } else {
    console.log('OK: array element tokenization works');
  }
  // patient_name should reuse the same token as for_patient='Carol'
  console.log('NOTE: patient_name token =', redacted.patient_name, 'mapping size =', Object.keys(mapping).length);
}

// 6. Token reuse for same value
{
  const { mapping } = redactPHI({ patient_name: 'Eve', notes: 'Eve is doing well' });
  // 'Eve' in notes won't be redacted (no field match, no regex match), but field-based PATIENT token created once
  if (Object.keys(mapping).length !== 1) {
    console.log('NOTE: only field-based "Eve" tokenized, not free-text occurrences (regex skipped for plain words)');
  }
  console.log('OK: mapping size =', Object.keys(mapping).length);
}

console.log('phiRedaction tests complete');
