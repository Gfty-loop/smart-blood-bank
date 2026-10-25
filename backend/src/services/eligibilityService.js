import { db } from '../db/database.js';

function getSetting(key, defaultValue) {
  const row = db.get('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  return row ? row.setting_value : defaultValue;
}

export function checkEligibility({
  dob,
  weight_kg,
  hemoglobin,
  last_donation_date,
  feeling_well = true,
  recent_illness = false,
  recent_surgery = false,
  on_antibiotics_or_meds = false
}) {
  const minAge = parseInt(getSetting('min_donor_age', '18'), 10);
  const maxAge = parseInt(getSetting('max_donor_age', '65'), 10);
  const minWeight = parseFloat(getSetting('min_donor_weight', '50'));
  const minHb = parseFloat(getSetting('min_hemoglobin', '12.5'));
  const minGapDays = parseInt(getSetting('min_donation_gap_days', '90'), 10);

  const reasons = [];
  const today = new Date();

  // 1. Calculate and check age
  let age = null;
  if (dob) {
    const birthDate = new Date(dob);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) {
      reasons.push(`Donor age (${age} years) is below minimum required age (${minAge} years).`);
    } else if (age > maxAge) {
      reasons.push(`Donor age (${age} years) exceeds maximum permissible age (${maxAge} years).`);
    }
  } else {
    reasons.push('Date of birth is required to verify age eligibility.');
  }

  // 2. Check weight
  if (weight_kg !== undefined && weight_kg !== null && weight_kg !== '') {
    const weight = parseFloat(weight_kg);
    if (weight < minWeight) {
      reasons.push(`Donor weight (${weight} kg) is below minimum safe threshold (${minWeight} kg).`);
    }
  }

  // 3. Check haemoglobin
  if (hemoglobin !== undefined && hemoglobin !== null && hemoglobin !== '') {
    const hb = parseFloat(hemoglobin);
    if (hb < minHb) {
      reasons.push(`Haemoglobin level (${hb} g/dL) is below minimum threshold (${minHb} g/dL).`);
    }
  }

  // 4. Check donation gap (default 90 days)
  let nextEligibleDate = today.toISOString().split('T')[0];
  let daysSinceLast = null;

  if (last_donation_date) {
    const lastDate = new Date(last_donation_date);
    const diffTime = today.getTime() - lastDate.getTime();
    daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const nextDateObj = new Date(lastDate.getTime() + minGapDays * 24 * 60 * 60 * 1000);
    nextEligibleDate = nextDateObj.toISOString().split('T')[0];

    if (daysSinceLast < minGapDays) {
      const daysRemaining = minGapDays - daysSinceLast;
      reasons.push(
        `Only ${daysSinceLast} days have passed since last donation (minimum gap is ${minGapDays} days). Next eligible on ${nextEligibleDate} (${daysRemaining} day(s) remaining).`
      );
    }
  }

  // 5. Questionnaire checks
  if (feeling_well === false || feeling_well === 'false') {
    reasons.push('Donor does not feel completely well today.');
  }
  if (recent_illness === true || recent_illness === 'true') {
    reasons.push('Donor reported recent illness, fever, or infection.');
  }
  if (recent_surgery === true || recent_surgery === 'true') {
    reasons.push('Donor reported recent major dental or surgical procedure.');
  }
  if (on_antibiotics_or_meds === true || on_antibiotics_or_meds === 'true') {
    reasons.push('Donor is currently taking temporary deferral medications (e.g. antibiotics).');
  }

  const isEligible = reasons.length === 0;

  return {
    is_eligible: isEligible,
    reasons,
    age,
    days_since_last_donation: daysSinceLast,
    next_eligible_date: nextEligibleDate,
    thresholds: {
      minAge,
      maxAge,
      minWeight,
      minHb,
      minGapDays
    }
  };
}
