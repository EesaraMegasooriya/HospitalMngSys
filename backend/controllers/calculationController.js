const calculationModel = require("../models/calculationModel");
const { writeAudit } = require("../utils/audit");

/**
 * POST /api/calculations/run
 * Triggers the full calculation engine for a given date.
 * Called by Subject Clerk after all wards have submitted.
 */
exports.runCalculation = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const result = await calculationModel.runCalculation(date, req.user?.id);

    await writeAudit({
      req,
      action: "RUN_CALCULATION",
      entity: "calculation_runs",
      entity_id: String(result.calcRunId),
      new_value: {
        date,
        patientCycle: result.patientCycle,
        staffCycle: result.staffCycle,
        totalItems: result.grandTotals.length,
        totalRecipes: result.recipeResults.length,
      },
      details: { message: `Calculation completed for ${date}` },
      severity: "info",
      status_code: 200,
      success: true,
    });

    res.status(200).json({
      message: "Calculation completed successfully",
      calcRunId: result.calcRunId,
      date: result.date,
      patientCycle: result.patientCycle,
      staffCycle: result.staffCycle,
      aggregated: result.aggregated,
    });
  } catch (error) {
    console.error("RUN CALCULATION ERROR:", error);

    await writeAudit({
      req,
      action: "RUN_CALCULATION",
      entity: "calculation_runs",
      details: { error: error.message, date: req.body?.date },
      severity: "error",
      status_code: 500,
      success: false,
    });

    res.status(500).json({ message: error.message || "Calculation failed" });
  }
};

/**
 * GET /api/calculations/results?date=YYYY-MM-DD
 * Fetches saved calculation results for a date.
 * Used by Subject Clerk (results view), Kitchen (cook sheet), Accountant (PO review).
 */
exports.getResults = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const results = await calculationModel.getCalculationResults(date);

    if (!results) {
      return res.status(404).json({
        message: "No calculation results found for this date",
      });
    }

    // Group line items by tab category for the frontend
    const grouped = groupResultsForFrontend(results);

    res.status(200).json({
      run: results.run,
      tabs: grouped,
      vegSummaries: results.vegSummaries,
      recipeResults: results.recipeResults,
      poLineItems: results.poLineItems,
    });
  } catch (error) {
    console.error("GET CALC RESULTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch calculation results" });
  }
};

/**
 * GET /api/calculations/cook-sheet?date=YYYY-MM-DD
 * Fetches calculation results formatted for the Kitchen cook sheet.
 * NO financial data is included.
 */
exports.getCookSheet = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const results = await calculationModel.getCalculationResults(date);

    if (!results) {
      return res.status(404).json({
        message: "No calculation results found for this date",
      });
    }

    // Build cook sheet data — NO prices
    const cookSheet = {
      date: results.run.date,
      patientCycle: results.run.patientCycle,
      staffCycle: results.run.staffCycle,

      // Patient totals
      patientTotals: results.run.patientTotals,

      // Staff meal counts
      staff: {
        breakfast: results.run.staffBreakfast,
        lunch: results.run.staffLunch,
        dinner: results.run.staffDinner,
      },

      // Diet instructions (rice/bread per meal)
      dietInstructions: buildDietInstructions(results.lineItems),

      // Protein allocation (children / patients / staff)
      proteinAllocation: buildProteinAllocation(results.lineItems),

      // Recipe results with ingredient quantities
      recipes: results.recipeResults,

      // Kanda calculation
      kanda: results.run.kandaCount > 0
        ? {
            count: results.run.kandaCount,
            redRiceG: results.run.kandaCount * 30,
          }
        : null,

      // Extra items
      extras: results.run.extrasTotals,
      customExtras: results.run.customExtrasTotals,
    };

    res.status(200).json({ cookSheet });
  } catch (error) {
    console.error("GET COOK SHEET ERROR:", error);
    res.status(500).json({ message: "Failed to fetch cook sheet" });
  }
};

/**
 * GET /api/calculations/breakdown/:itemId?date=YYYY-MM-DD
 * Fetches detailed per-diet-type breakdown for a specific item.
 * Used by Subject Clerk when clicking the 🔍 icon.
 */
exports.getItemBreakdown = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { date } = req.query;

    if (!date || !itemId) {
      return res.status(400).json({ message: "date and itemId are required" });
    }

    const results = await calculationModel.getCalculationResults(date);

    if (!results) {
      return res.status(404).json({ message: "No calculation results found" });
    }

    const itemLines = results.lineItems.filter(
      (li) => li.itemId === Number(itemId)
    );

    if (itemLines.length === 0) {
      return res.status(404).json({ message: "Item not found in calculation" });
    }

    // Merge breakdowns across meals
    const breakdown = {};
    for (const li of itemLines) {
      for (const [code, data] of Object.entries(li.breakdown)) {
        if (!breakdown[code]) {
          breakdown[code] = {
            dietType: data.nameEn || code,
            code,
            meals: {},
            totalG: 0,
          };
        }
        breakdown[code].meals[li.meal] = {
          count: data.count,
          normG: data.normG,
          subtotalG: data.totalG,
        };
        breakdown[code].totalG += data.totalG;
      }
    }

    res.status(200).json({
      itemId: Number(itemId),
      nameEn: itemLines[0].nameEn,
      nameSi: itemLines[0].nameSi,
      unit: itemLines[0].unit,
      meals: itemLines.map((li) => ({
        meal: li.meal,
        displayValue: li.displayValue,
        displayUnit: li.displayUnit,
      })),
      breakdown: Object.values(breakdown),
    });
  } catch (error) {
    console.error("GET BREAKDOWN ERROR:", error);
    res.status(500).json({ message: "Failed to fetch item breakdown" });
  }
};

// ──────────────────────────────────────────────────
// Helper: Group results into frontend tab structure
// ──────────────────────────────────────────────────

function groupResultsForFrontend(results) {
  const tabs = {
    rice: [],
    protein: [],
    vegetables: [],
    condiments: [],
    extras: [],
  };

  // Build grand totals per item
  const itemMap = {};
  for (const li of results.lineItems) {
    if (!itemMap[li.itemId]) {
      itemMap[li.itemId] = {
        id: li.itemId,
        nameEn: li.nameEn,
        nameSi: li.nameSi,
        unit: li.unit,
        categoryId: li.categoryId,
        categoryName: li.categoryName,
        isProtein: li.isProtein,
        isVegetable: li.isVegetable,
        breakfast: null,
        lunch: null,
        dinner: null,
        grandTotal: 0,
        grandTotalBase: 0,
        breakdown: [],
      };
    }
    const item = itemMap[li.itemId];
    item[li.meal] = li.displayValue;
    item.grandTotalBase += li.subtotalBase;

    // Collect breakdown for dialog
    for (const [code, data] of Object.entries(li.breakdown)) {
      item.breakdown.push({
        meal: li.meal,
        dietType: data.nameEn || code,
        code,
        count: data.count,
        normG: data.normG,
        subtotalG: data.totalG,
      });
    }
  }

  // Calculate grand total in display units
  for (const item of Object.values(itemMap)) {
    const { base } = require("../utils/uom").getBaseUnit(item.unit);
    item.grandTotal = require("../utils/uom").roundDisplay(
      require("../utils/uom").toDisplayUnit(item.grandTotalBase, item.unit),
      item.unit
    );
  }

  // Categorize into tabs
  for (const item of Object.values(itemMap)) {
    if (item.isProtein) {
      tabs.protein.push(item);
    } else if (item.isVegetable) {
      tabs.vegetables.push(item);
    } else if (item.categoryId <= 1) {
      // Rice/Bread category
      tabs.rice.push(item);
    } else if (item.categoryId === 8) {
      // Condiments
      tabs.condiments.push(item);
    } else {
      // Everything else goes to extras
      tabs.extras.push(item);
    }
  }

  // Add raw-sum extras from the run
  // (These are not in line items since they bypass norm-weight calculation)
  const extrasTotals = results.run.extrasTotals || {};
  for (const [name, qty] of Object.entries(extrasTotals)) {
    if (Number(qty) > 0) {
      tabs.extras.push({
        id: `extra-${name}`,
        nameEn: name,
        nameSi: "",
        unit: "",
        breakfast: null,
        lunch: null,
        dinner: null,
        grandTotal: Number(qty),
        isExtra: true,
        breakdown: [],
      });
    }
  }

  return tabs;
}

// ──────────────────────────────────────────────────
// Helper: Build diet instructions for cook sheet
// ──────────────────────────────────────────────────

function buildDietInstructions(lineItems) {
  const instructions = [];

  // Find rice items (category 1)
  const riceItems = lineItems.filter((li) => li.categoryId <= 1 && !li.nameEn?.toLowerCase().includes("bread"));
  const breadItems = lineItems.filter((li) => li.nameEn?.toLowerCase().includes("bread"));

  // Aggregate rice by meal
  const riceMeals = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const li of riceItems) {
    riceMeals[li.meal] = (riceMeals[li.meal] || 0) + li.displayValue;
  }

  instructions.push({
    type: "Rice (Kg)",
    breakfast: Math.round(riceMeals.breakfast * 100) / 100 || null,
    lunch: Math.round(riceMeals.lunch * 100) / 100 || null,
    dinner: Math.round(riceMeals.dinner * 100) / 100 || null,
  });

  // Bread
  const breadMeals = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const li of breadItems) {
    breadMeals[li.meal] = (breadMeals[li.meal] || 0) + li.displayValue;
  }
  instructions.push({
    type: "Bread (loaves)",
    breakfast: breadMeals.breakfast || null,
    lunch: breadMeals.lunch || null,
    dinner: breadMeals.dinner || null,
  });

  return instructions;
}

// ──────────────────────────────────────────────────
// Helper: Build protein allocation for cook sheet
// ──────────────────────────────────────────────────

function buildProteinAllocation(lineItems) {
  const proteinItems = lineItems.filter((li) => li.isProtein);
  const allocation = {};

  for (const li of proteinItems) {
    if (!allocation[li.itemId]) {
      allocation[li.itemId] = {
        nameEn: li.nameEn,
        nameSi: li.nameSi,
        unit: li.unit,
        children: 0,
        patients: 0,
        staff: 0,
      };
    }

    const a = allocation[li.itemId];
    const bd = li.breakdown || {};

    for (const [code, data] of Object.entries(bd)) {
      const totalKg = data.totalG / 1000;
      if (code === "STAFF") {
        a.staff += totalKg;
      } else if (["S1", "S2", "S3", "S4", "S5"].includes(code)) {
        a.children += totalKg;
      } else {
        a.patients += totalKg;
      }
    }
  }

  return Object.values(allocation).map((a) => ({
    ...a,
    children: Math.round(a.children * 100) / 100,
    patients: Math.round(a.patients * 100) / 100,
    staff: Math.round(a.staff * 100) / 100,
  }));
}