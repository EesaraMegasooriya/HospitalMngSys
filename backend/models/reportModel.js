const pool = require("../config/db");

exports.getAccountantDashboardData = async (timeframe) => {
  const client = await pool.connect();
  try {
    // 1. Determine the date filter based on the dropdown selection
    let dateFilter = "CURRENT_DATE - INTERVAL '6 months'";
    if (timeframe === '1w') dateFilter = "CURRENT_DATE - INTERVAL '7 days'";
    if (timeframe === '1m') dateFilter = "CURRENT_DATE - INTERVAL '1 month'";

    // 2. Expenditure by Category (Filtered by timeframe)
    const categoryRes = await client.query(`
      SELECT 
        c.name, 
        SUM(ii.total_price) as value
      FROM invoice_items ii
      JOIN items i ON ii.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE inv.status = 'received' AND inv.invoice_date >= ${dateFilter}
      GROUP BY c.name
      ORDER BY value DESC
    `);

    // 3. Invoice Spending Trend (Dynamically grouped by Day or Month)
    let trendQuery = "";
    if (timeframe === '1w') {
      // Weekly: Group by Day (e.g., Mon, Tue, Wed)
      trendQuery = `
        SELECT TO_CHAR(invoice_date, 'Dy') as label, invoice_date as sort_date, SUM(billed_total) as total
        FROM invoices WHERE status = 'received' AND invoice_date >= ${dateFilter}
        GROUP BY invoice_date ORDER BY sort_date ASC
      `;
    } else if (timeframe === '1m') {
      // Monthly: Group by specific Date (e.g., 14 Mar, 15 Mar)
      trendQuery = `
        SELECT TO_CHAR(invoice_date, 'DD Mon') as label, invoice_date as sort_date, SUM(billed_total) as total
        FROM invoices WHERE status = 'received' AND invoice_date >= ${dateFilter}
        GROUP BY invoice_date ORDER BY sort_date ASC
      `;
    } else {
      // 6 Months: Group by Month (e.g., Jan, Feb, Mar)
      trendQuery = `
        SELECT TO_CHAR(invoice_date, 'Mon') as label, EXTRACT(MONTH FROM invoice_date) as sort_date, SUM(billed_total) as total
        FROM invoices WHERE status = 'received' AND invoice_date >= ${dateFilter}
        GROUP BY TO_CHAR(invoice_date, 'Mon'), EXTRACT(MONTH FROM invoice_date)
        ORDER BY sort_date ASC
      `;
    }

    const trendRes = await client.query(trendQuery);

    return {
      categorySpend: categoryRes.rows.map((r, index) => ({ 
        name: r.name, 
        value: Number(r.value),
        color: `hsl(var(--chart-${(index % 5) + 1}))` 
      })),
      spendingTrend: trendRes.rows.map(r => ({
        label: r.label,
        total: Number(r.total) || 0
      }))
    };
  } finally {
    client.release();
  }
};