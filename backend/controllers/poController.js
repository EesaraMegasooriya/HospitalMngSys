// controllers/poController.js
const poModel = require("../models/poModel");
const { writeAudit } = require("../utils/audit");

// ──────────────────────────────────────────────
// Subject Clerk endpoints
// ──────────────────────────────────────────────

/**
 * POST /api/orders
 * Create a new draft PO from selected items
 * Body: { date, calcRunId, items: [{ itemId, categoryId, quantity, unit, unitPrice, defaultPrice, forBreakfast, ... }] }
 */
exports.createOrder = async (req, res) => {
  try {
    const { date, calcRunId, items } = req.body;

    if (!date || !calcRunId || !items || items.length === 0) {
      return res.status(400).json({ message: "date, calcRunId, and items are required" });
    }

    // Check if PO already exists for this date
    const existing = await poModel.getPurchaseOrderByDate(date);
    if (existing) {
      return res.status(409).json({
        message: "A purchase order already exists for this date",
        existingId: existing.id,
        status: existing.status,
      });
    }

    const po = await poModel.createPurchaseOrder({
      calcRunId,
      poDate: date,
      items,
      createdBy: req.user?.id,
    });

    await writeAudit({
      req,
      action: "CREATE_PO",
      entity: "purchase_orders",
      entity_id: String(po.id),
      new_value: { billNumber: po.billNumber, date, itemCount: po.itemCount, total: po.original_total },
      details: { message: `Draft PO ${po.billNumber} created for ${date}` },
      severity: "info",
      status_code: 201,
      success: true,
    });

    res.status(201).json({
      message: "Purchase order created",
      po: {
        id: po.id,
        billNumber: po.bill_number || po.billNumber,
        status: po.status,
        date: po.po_date,
        originalTotal: parseFloat(po.original_total),
        itemCount: po.itemCount,
      },
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to create purchase order" });
  }
};

/**
 * PUT /api/orders/:id
 * Update a draft PO (re-select items)
 */
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }

    const result = await poModel.updatePurchaseOrder(id, { items });

    await writeAudit({
      req,
      action: "UPDATE_PO",
      entity: "purchase_orders",
      entity_id: String(id),
      new_value: { itemCount: result.itemCount, total: result.originalTotal },
      details: { message: `PO updated with ${result.itemCount} items` },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.json({ message: "Purchase order updated", result });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    res.status(error.message.includes("draft") ? 403 : 500).json({
      message: error.message || "Failed to update purchase order",
    });
  }
};

/**
 * POST /api/orders/:id/submit
 * Submit a draft PO for accountant approval (draft → pending)
 */
exports.submitOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await poModel.submitForApproval(id, req.user?.id);

    await writeAudit({
      req,
      action: "SUBMIT_PO",
      entity: "purchase_orders",
      entity_id: String(id),
      new_value: { status: "pending", submittedAt: po.submitted_at },
      details: { message: `PO ${po.bill_number} submitted for approval` },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.json({
      message: "Purchase order submitted for approval",
      po: { id: po.id, status: po.status, billNumber: po.bill_number },
    });
  } catch (error) {
    console.error("SUBMIT ORDER ERROR:", error);
    res.status(error.message.includes("draft") ? 403 : 500).json({
      message: error.message || "Failed to submit purchase order",
    });
  }
};

/**
 * POST /api/orders/:id/revise
 * Revise a rejected PO back to draft (rejected → draft)
 */
exports.reviseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await poModel.revisePurchaseOrder(id);

    await writeAudit({
      req,
      action: "REVISE_PO",
      entity: "purchase_orders",
      entity_id: String(id),
      new_value: { status: "draft" },
      details: { message: `PO ${po.bill_number} returned to draft for revision` },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.json({
      message: "Purchase order returned to draft for revision",
      po: { id: po.id, status: po.status, billNumber: po.bill_number },
    });
  } catch (error) {
    console.error("REVISE ORDER ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to revise purchase order" });
  }
};

// ──────────────────────────────────────────────
// Accountant endpoints
// ──────────────────────────────────────────────

/**
 * POST /api/orders/:id/approve
 * Approve a pending PO (pending → approved)
 * Body: { revisions: { itemId: { qty, price }, ... } }  (optional)
 */
exports.approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisions } = req.body;

    const result = await poModel.approvePurchaseOrder(id, req.user?.id, { revisions });

    await writeAudit({
      req,
      action: "APPROVE_PO",
      entity: "purchase_orders",
      entity_id: String(id),
      new_value: { status: "approved", revisedTotal: result.revisedTotal },
      details: {
        message: `PO approved with total Rs. ${result.revisedTotal}`,
        hasRevisions: Object.keys(revisions || {}).length > 0,
      },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.json({
      message: "Purchase order approved",
      result,
    });
  } catch (error) {
    console.error("APPROVE ORDER ERROR:", error);
    res.status(error.message.includes("pending") ? 403 : 500).json({
      message: error.message || "Failed to approve purchase order",
    });
  }
};

/**
 * POST /api/orders/:id/reject
 * Reject a pending PO (pending → rejected)
 * Body: { reason: "..." }
 */
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const po = await poModel.rejectPurchaseOrder(id, req.user?.id, reason.trim());

    await writeAudit({
      req,
      action: "REJECT_PO",
      entity: "purchase_orders",
      entity_id: String(id),
      new_value: { status: "rejected", reason: reason.trim() },
      details: { message: `PO ${po.bill_number} rejected: ${reason.trim()}` },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.json({
      message: "Purchase order rejected",
      po: { id: po.id, status: po.status, billNumber: po.bill_number },
    });
  } catch (error) {
    console.error("REJECT ORDER ERROR:", error);
    res.status(error.message.includes("pending") ? 403 : 500).json({
      message: error.message || "Failed to reject purchase order",
    });
  }
};

// ──────────────────────────────────────────────
// Shared query endpoints
// ──────────────────────────────────────────────

/**
 * GET /api/orders
 * List all POs (with optional ?status= filter)
 */
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let orders;
    if (status) {
      orders = await poModel.getPurchaseOrdersByStatus(status);
    } else {
      orders = await poModel.getAllPurchaseOrders();
    }

    res.json({ orders });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch purchase orders" });
  }
};

/**
 * GET /api/orders/:id
 * Get a single PO with all line items grouped by category
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await poModel.getPurchaseOrderById(id);

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({ po });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    res.status(500).json({ message: "Failed to fetch purchase order" });
  }
};

/**
 * GET /api/orders/by-date?date=YYYY-MM-DD
 * Get PO for a specific date (used by CalculationResults "Generate PO" button)
 */
exports.getOrderByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required" });

    const po = await poModel.getPurchaseOrderByDate(date);
    res.json({ po: po || null });
  } catch (error) {
    console.error("GET ORDER BY DATE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch purchase order" });
  }
};

/**
 * GET /api/orders/pending
 * Get all pending POs for accountant approval queue
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await poModel.getPurchaseOrdersByStatus("pending");
    res.json({ orders });
  } catch (error) {
    console.error("GET PENDING ORDERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch pending orders" });
  }
};