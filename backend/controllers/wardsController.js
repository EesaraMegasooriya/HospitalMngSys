// controllers/wardsController.js
const pool = require("../config/db");
const { writeAudit } = require("../utils/audit");

exports.getWards = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, ward_name, bed_count, cot_count, icu_count
       FROM wards
       ORDER BY id DESC`
    );
    res.json({ wards: r.rows });
  } catch (err) {
    console.error("getWards error:", err);
    res.status(500).json({ message: "Failed to fetch wards" });
  }
};

exports.createWard = async (req, res) => {
  try {
    const { ward_name, bed_count = 0, cot_count = 0, icu_count = 0 } = req.body;

    if (!ward_name?.trim()) {
      return res.status(400).json({ message: "ward_name is required" });
    }

    const r = await pool.query(
      `INSERT INTO wards (ward_name, bed_count, cot_count, icu_count)
       VALUES ($1,$2,$3,$4)
       RETURNING id, ward_name, bed_count, cot_count, icu_count`,
      [
        ward_name.trim(),
        Number(bed_count) || 0,
        Number(cot_count) || 0,
        Number(icu_count) || 0,
      ]
    );

    const ward = r.rows[0];

    await writeAudit({
      req,
      module: "HOSPITAL_ADMIN", // ✅ IMPORTANT (module is NOT NULL in DB)
      action: "WARD_CREATE",
      entity: "WARD",
      entity_id: ward.id,
      actor_user_id: req.user?.id,
      actor_email: req.user?.email,
      actor_role: req.user?.role,
      details: ward,
    });

    res.status(201).json({ ward });
  } catch (err) {
    console.error("createWard error:", err);

    // duplicate ward name unique constraint
    if (err.code === "23505") {
      return res.status(409).json({ message: "Ward name already exists" });
    }

    res.status(500).json({ message: "Failed to create ward" });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const id = req.params.id;
    const { ward_name, bed_count = 0, cot_count = 0, icu_count = 0 } = req.body;

    if (!ward_name?.trim()) {
      return res.status(400).json({ message: "ward_name is required" });
    }

    const r = await pool.query(
      `UPDATE wards
       SET ward_name=$1, bed_count=$2, cot_count=$3, icu_count=$4
       WHERE id=$5
       RETURNING id, ward_name, bed_count, cot_count, icu_count`,
      [
        ward_name.trim(),
        Number(bed_count) || 0,
        Number(cot_count) || 0,
        Number(icu_count) || 0,
        id,
      ]
    );

    if (r.rowCount === 0) return res.status(404).json({ message: "Ward not found" });

    const ward = r.rows[0];

    await writeAudit({
      req,
      module: "HOSPITAL_ADMIN", // ✅ IMPORTANT (module is NOT NULL in DB)
      action: "WARD_UPDATE",
      entity: "WARD",
      entity_id: ward.id,
      actor_user_id: req.user?.id,
      actor_email: req.user?.email,
      actor_role: req.user?.role,
      details: ward,
    });

    res.json({ ward });
  } catch (err) {
    console.error("updateWard error:", err);

    if (err.code === "23505") {
      return res.status(409).json({ message: "Ward name already exists" });
    }

    res.status(500).json({ message: "Failed to update ward" });
  }
};