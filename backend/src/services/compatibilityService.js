import { db } from '../db/database.js';

// PRD Section 9.3 Red Cell Compatibility Matrix
export const RED_CELL_COMPATIBILITY = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

// PRD Section 9.3 Plasma Compatibility Matrix (Reverse pattern, AB is universal plasma donor)
export const PLASMA_COMPATIBILITY = {
  'O-': ['O-', 'A-', 'B-', 'AB-', 'O+', 'A+', 'B+', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'],
  'A-': ['A-', 'AB-', 'A+', 'AB+'],
  'A+': ['A+', 'AB+', 'A-', 'AB-'],
  'B-': ['B-', 'AB-', 'B+', 'AB+'],
  'B+': ['B+', 'AB+', 'B-', 'AB-'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+', 'AB-']
};

export function getCompatibleBloodGroups(recipientGroup, componentType = 'Red Blood Cells') {
  const normComponent = (componentType || '').toLowerCase();
  if (normComponent.includes('plasma')) {
    return PLASMA_COMPATIBILITY[recipientGroup] || [recipientGroup];
  }
  // Default to Red Cell / Whole Blood / Platelet compatibility
  return RED_CELL_COMPATIBILITY[recipientGroup] || [recipientGroup];
}

/**
 * Finds and ranks available units for a blood request according to PRD 9.4:
 * 1. Status 'Available' and not expired (expires_on >= today)
 * 2. Exact match prioritized, then compatible groups
 * 3. Earliest expiry first (FEFO)
 */
export function findCompatibleUnits(recipientGroup, componentType, requiredUnits = 1) {
  const today = new Date().toISOString().split('T')[0];
  const compatibleGroups = getCompatibleBloodGroups(recipientGroup, componentType);

  if (compatibleGroups.length === 0) {
    return {
      compatible_groups: [],
      units: [],
      exact_match_count: 0,
      compatible_count: 0,
      can_fulfill_fully: false
    };
  }

  const placeholders = compatibleGroups.map(() => '?').join(',');

  // Query units with matching component, compatible blood group, status Available, and expires_on >= today
  let sql = `
    SELECT u.*, d.volume_ml, d.donation_date
    FROM blood_units u
    LEFT JOIN donations d ON u.donation_id = d.donation_id
    WHERE u.status = 'Available'
      AND u.expires_on >= ?
      AND u.blood_group IN (${placeholders})
  `;

  const params = [today, ...compatibleGroups];

  if (componentType) {
    // If request asks for Red Blood Cells, can also allow Whole Blood if needed or exact component
    sql += ` AND (u.component_type = ? OR (u.component_type = 'Whole Blood' AND ? = 'Red Blood Cells'))`;
    params.push(componentType, componentType);
  }

  const rows = db.query(sql, params);

  // Score and annotate units:
  // 1. match_rank: exact group match = 1, compatible = 2
  // 2. days_until_expiry
  // 3. is_universal_donor (O- for red cells when recipient is not O-)
  const scoredUnits = rows.map(unit => {
    const isExact = unit.blood_group === recipientGroup;
    const isUniversal = unit.blood_group === 'O-' && recipientGroup !== 'O-';
    
    // Calculate days remaining
    const expDate = new Date(unit.expires_on);
    const todayDate = new Date(today);
    const diffDays = Math.ceil((expDate - todayDate) / (1000 * 60 * 60 * 24));

    return {
      ...unit,
      is_exact_match: isExact,
      is_universal_donor: isUniversal,
      match_type: isExact ? 'Exact Match' : (isUniversal ? 'Universal Donor (O-)' : 'Compatible Group'),
      match_score: isExact ? 1 : 2,
      days_until_expiry: diffDays
    };
  });

  // FEFO sorting:
  // First prioritize Exact Match (score 1 vs 2),
  // Then sort by earliest expiry (expires_on ascending)!
  scoredUnits.sort((a, b) => {
    if (a.match_score !== b.match_score) {
      return a.match_score - b.match_score;
    }
    // FEFO: earliest expiry first
    if (a.expires_on !== b.expires_on) {
      return a.expires_on.localeCompare(b.expires_on);
    }
    return (a.collected_on || '').localeCompare(b.collected_on || '');
  });

  const exactCount = scoredUnits.filter(u => u.is_exact_match).length;
  const compatibleCount = scoredUnits.length;

  return {
    recipient_group: recipientGroup,
    component_type: componentType,
    compatible_groups: compatibleGroups,
    exact_match_count: exactCount,
    total_available_compatible: compatibleCount,
    can_fulfill_fully: compatibleCount >= requiredUnits,
    recommended_selection: scoredUnits.slice(0, requiredUnits).map(u => u.unit_id),
    units: scoredUnits
  };
}
