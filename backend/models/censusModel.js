const pool = require("../config/db");

const mapCensusRow = (row) => ({
  id: row.id,
  wardId: row.ward_id,
  date: row.entry_date,
  status: row.status,
  totalPatients: row.total_patients,
  diets: row.diets || {},
  special: row.special || {},
  extras: row.extras || {},
  customExtras: row.custom_extras || [],
  submittedBy: row.submitted_by,
  submittedAt: row.submitted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapStaffMealRow = (row) => ({
  id: row.id,
  date: row.meal_date,
  breakfast: row.breakfast,
  lunch: row.lunch,
  dinner: row.dinner,
  staffCycle: row.staff_cycle,
  status: row.status,
  submittedBy: row.submitted_by,
  submittedAt: row.submitted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

exports.getWardCensusByDate = async (wardId, entryDate) => {
  const query = `
    SELECT *
    FROM census_entries
    WHERE ward_id = $1 AND entry_date = $2
    LIMIT 1
  `;
  const result = await pool.query(query, [wardId, entryDate]);
  return result.rows[0] ? mapCensusRow(result.rows[0]) : null;
};

exports.getAllWardCensusStatusesByDate = async (entryDate) => {
  const query = `
    SELECT id, ward_id, entry_date, status, total_patients
    FROM census_entries
    WHERE entry_date = $1
    ORDER BY ward_id
  `;
  const result = await pool.query(query, [entryDate]);
  return result.rows.map(mapCensusRow);
};

exports.upsertWardCensus = async ({
  wardId,
  entryDate,
  status = "draft",
  totalPatients = 0,
  diets = {},
  special = {},
  extras = {},
  customExtras = [],
  submittedBy = null,
  submittedAt = null,
}) => {
  const query = `
    INSERT INTO census_entries (
      ward_id,
      entry_date,
      status,
      total_patients,
      diets,
      special,
      extras,
      custom_extras,
      submitted_by,
      submitted_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)
    ON CONFLICT (ward_id, entry_date)
    DO UPDATE SET
      status = EXCLUDED.status,
      total_patients = EXCLUDED.total_patients,
      diets = EXCLUDED.diets,
      special = EXCLUDED.special,
      extras = EXCLUDED.extras,
      custom_extras = EXCLUDED.custom_extras,
      submitted_by = EXCLUDED.submitted_by,
      submitted_at = EXCLUDED.submitted_at,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    wardId,
    entryDate,
    status,
    totalPatients,
    JSON.stringify(diets),
    JSON.stringify(special),
    JSON.stringify(extras),
    JSON.stringify(customExtras),
    submittedBy,
    submittedAt,
  ];

  const result = await pool.query(query, values);
  return mapCensusRow(result.rows[0]);
};

exports.getStaffMealsByDate = async (mealDate) => {
  const query = `
    SELECT *
    FROM staff_meals
    WHERE meal_date = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [mealDate]);
  return result.rows[0] ? mapStaffMealRow(result.rows[0]) : null;
};

exports.upsertStaffMeals = async ({
  mealDate,
  breakfast = 0,
  lunch = 0,
  dinner = 0,
  staffCycle = "Chicken",
  status = "submitted",
  submittedBy = null,
  submittedAt = null,
}) => {
  const query = `
    INSERT INTO staff_meals (
      meal_date,
      breakfast,
      lunch,
      dinner,
      staff_cycle,
      status,
      submitted_by,
      submitted_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
    ON CONFLICT (meal_date)
    DO UPDATE SET
      breakfast = EXCLUDED.breakfast,
      lunch = EXCLUDED.lunch,
      dinner = EXCLUDED.dinner,
      staff_cycle = EXCLUDED.staff_cycle,
      status = EXCLUDED.status,
      submitted_by = EXCLUDED.submitted_by,
      submitted_at = EXCLUDED.submitted_at,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    mealDate,
    breakfast,
    lunch,
    dinner,
    staffCycle,
    status,
    submittedBy,
    submittedAt,
  ];

  const result = await pool.query(query, values);
  return mapStaffMealRow(result.rows[0]);
};