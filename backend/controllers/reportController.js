const reportModel = require("../models/reportModel");

exports.getAccountantReports = async (req, res) => {
  try {
    const data = await reportModel.getAccountantDashboardData();
    res.json(data);
  } catch (error) {
    console.error("GET ACCOUNTANT REPORTS ERROR:", error);
    res.status(500).json({ message: "Failed to generate financial reports." });
  }
};