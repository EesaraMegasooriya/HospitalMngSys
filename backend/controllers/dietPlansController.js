const pool = require("../config/db");
const { writeAudit } = require("../utils/audit");

/* ================= GET ALL ================= */
exports.getAll = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, code, name, display_order, active, created_at
       FROM diet_plans
       ORDER BY display_order ASC`
    );

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "GET_DIET_PLANS",
      entity: "diet_plan",
      success: true,
      status_code: 200,
      details: { count: r.rowCount },
    });

    res.json({ plans: r.rows });
  } catch (err) {
    console.error(err);

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "GET_DIET_PLANS_FAILED",
      entity: "diet_plan",
      success: false,
      status_code: 500,
      details: { error: err.message },
    });

    res.status(500).json({ message: "Failed to fetch diet plans" });
  }
};

/* ================= CREATE ================= */
exports.create = async (req, res) => {
  try {
    const { code, name, display_order = 1 } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: "Code is required" });
    }
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const r = await pool.query(
      `INSERT INTO diet_plans (code, name, display_order, active)
       VALUES ($1,$2,$3,true)
       RETURNING *`,
      [code.trim(), name.trim(), Number(display_order)]
    );

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "CREATE_DIET_PLAN",
      entity: "diet_plan",
      entity_id: r.rows[0].id,
      success: true,
      status_code: 201,
      details: r.rows[0],
    });

    res.status(201).json({ plan: r.rows[0] });
  } catch (err) {
    console.error(err);

    // unique constraint message (diet_plans_code_unique)
    const msg =
      err.code === "23505"
        ? "Diet plan code already exists"
        : "Failed to create diet plan";

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "CREATE_DIET_PLAN_FAILED",
      entity: "diet_plan",
      success: false,
      status_code: 500,
      details: { error: err.message },
    });

    res.status(500).json({ message: msg });
  }
};

/* ================= UPDATE ================= */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, display_order } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: "Code is required" });
    }
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const r = await pool.query(
      `UPDATE diet_plans
       SET code=$1,
           name=$2,
           display_order=$3,
           updated_at=NOW()
       WHERE id=$4
       RETURNING *`,
      [code.trim(), name.trim(), Number(display_order), id]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "UPDATE_DIET_PLAN",
      entity: "diet_plan",
      entity_id: id,
      success: true,
      status_code: 200,
      details: r.rows[0],
    });

    res.json({ plan: r.rows[0] });
  } catch (err) {
    console.error(err);

    const msg =
      err.code === "23505"
        ? "Diet plan code already exists"
        : "Failed to update diet plan";

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "UPDATE_DIET_PLAN_FAILED",
      entity: "diet_plan",
      entity_id: req.params.id,
      success: false,
      status_code: 500,
      details: { error: err.message },
    });

    res.status(500).json({ message: msg });
  }
};

/* ================= TOGGLE ================= */
exports.toggle = async (req, res) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      `UPDATE diet_plans
       SET active = NOT active,
           updated_at = NOW()
       WHERE id=$1
       RETURNING *`,
      [id]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "TOGGLE_DIET_PLAN_STATUS",
      entity: "diet_plan",
      entity_id: id,
      success: true,
      status_code: 200,
      details: { active: r.rows[0].active },
    });

    res.json({ plan: r.rows[0] });
  } catch (err) {
    console.error(err);

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "TOGGLE_DIET_PLAN_FAILED",
      entity: "diet_plan",
      entity_id: req.params.id,
      success: false,
      status_code: 500,
      details: { error: err.message },
    });

    res.status(500).json({ message: "Failed to change status" });
  }
};

/* ================= DELETE ================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      `DELETE FROM diet_plans WHERE id=$1 RETURNING id`,
      [id]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ message: "Diet plan not found" });
    }

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "DELETE_DIET_PLAN",
      entity: "diet_plan",
      entity_id: id,
      success: true,
      status_code: 200,
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);

    await writeAudit({
      req,
      module: "DIET_PLANS",
      action: "DELETE_DIET_PLAN_FAILED",
      entity: "diet_plan",
      entity_id: req.params.id,
      success: false,
      status_code: 500,
      details: { error: err.message },
    });

    res.status(500).json({ message: "Failed to delete diet plan" });
  }
};