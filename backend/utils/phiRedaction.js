/**
 * PHI Redaction utility — strips/masks Protected Health Information before sending
 * payloads to external AI providers (OpenRouter). Maintains a per-call mapping so
 * that AI responses can be re-hydrated with original tokens for in-app display.
 *
 * What gets redacted:
 *   - patient_name / name fields => PATIENT_<n>
 *   - email addresses           => EMAIL_<n>
 *   - phone numbers             => PHONE_<n>
 *   - SSN-style strings         => SSN_<n>
 *   - addresses (street/city)   => ADDRESS_<n>
 *   - DOB / explicit dob fields => DOB_<n>
 *   - prescribing_doctor / doctor_name => DOCTOR_<n>
 *   - MRN / medical_record_number => MRN_<n>
 *
 * Use redactPHI(payload) BEFORE calling OpenRouter and rehydrate(text, mapping)
 * AFTER receiving the response (optional, for display).
 */

const PHI_FIELD_PREFIX_MAP = {
  patient_name: 'PATIENT',
  patientName: 'PATIENT',
  name: 'PATIENT',
  full_name: 'PATIENT',
  email: 'EMAIL',
  phone: 'PHONE',
  phone_number: 'PHONE',
  contact_name: 'CONTACT',
  prescribing_doctor: 'DOCTOR',
  doctor_name: 'DOCTOR',
  responder_name: 'CONTACT',
  caregiver_name: 'CAREGIVER',
  visitor_name: 'VISITOR',
  ssn: 'SSN',
  social_security_number: 'SSN',
  mrn: 'MRN',
  medical_record_number: 'MRN',
  address: 'ADDRESS',
  street: 'ADDRESS',
  street_address: 'ADDRESS',
  date_of_birth: 'DOB',
  dob: 'DOB',
  birth_date: 'DOB'
};

const PATTERNS = [
  // SSN: 123-45-6789 or 123 45 6789
  { regex: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g, prefix: 'SSN' },
  // Email
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, prefix: 'EMAIL' },
  // US phone
  { regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, prefix: 'PHONE' },
  // MRN (e.g. MRN12345 or MRN-12345)
  { regex: /\bMRN[-:\s]?\d{4,}\b/gi, prefix: 'MRN' }
];

/**
 * Recursively redacts PHI fields in an object. Returns { redacted, mapping }.
 * `mapping` is { token: originalValue } for optional re-hydration.
 */
function redactPHI(input) {
  const mapping = {};
  const counters = {};

  function nextToken(prefix, originalValue) {
    // Reuse same token for same value (consistent across the payload)
    const existing = Object.entries(mapping).find(([, v]) => v === originalValue);
    if (existing) return existing[0];
    counters[prefix] = (counters[prefix] || 0) + 1;
    const token = `${prefix}_${counters[prefix]}`;
    mapping[token] = originalValue;
    return token;
  }

  function applyRegexPatterns(str) {
    let result = str;
    for (const { regex, prefix } of PATTERNS) {
      result = result.replace(regex, (match) => nextToken(prefix, match));
    }
    return result;
  }

  function walk(value, parentKey = '') {
    if (value == null) return value;

    if (typeof value === 'string') {
      // First check if this string belongs to a PHI field
      const fieldPrefix = parentKey && PHI_FIELD_PREFIX_MAP[parentKey];
      if (fieldPrefix) {
        return nextToken(fieldPrefix, value);
      }
      // Otherwise scan for regex patterns
      return applyRegexPatterns(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') return value;

    if (Array.isArray(value)) {
      return value.map((item) => walk(item, parentKey));
    }

    if (typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = walk(v, k);
      }
      return out;
    }

    return value;
  }

  const redacted = walk(input);
  return { redacted, mapping };
}

/**
 * Re-hydrate AI response text by replacing tokens with original values.
 * Useful for displaying responses to authorized users.
 */
function rehydrate(text, mapping) {
  if (!text || !mapping) return text;
  let result = String(text);
  // Replace longer tokens first to avoid partial matches
  const tokens = Object.keys(mapping).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    result = result.split(token).join(mapping[token]);
  }
  return result;
}

/**
 * Convenience: redact payload, return redacted JSON string.
 */
function redactToString(input) {
  const { redacted, mapping } = redactPHI(input);
  return { json: JSON.stringify(redacted), mapping };
}

module.exports = { redactPHI, rehydrate, redactToString };
