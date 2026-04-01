const pool = require("../config/db");

exports.getAccountantDashboardData = async () => {
  const client = await pool.connect();
  try {
    // 1. Expenditure by Category (Based on actual received invoices)
    const categoryRes = await client.query(`
      SELECT 
        c.name, 
        SUM(ii.total_price) as value
      FROM invoice_items ii
      JOIN items i ON ii.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE inv.status = 'received'
      GROUP BY c.name
      ORDER BY value DESC
    `);

    // 2. Ordered vs. Received Totals (Last 6 Months)
    const orderedVsReceivedRes = await client.query(`
      SELECT 
        TO_CHAR(po.po_date, 'Mon') as month,
        EXTRACT(MONTH FROM po.po_date) as month_num,
        SUM(po.original_total) as "Ordered",
        SUM(inv.billed_total) as "Received"
      FROM purchase_orders po
      LEFT JOIN invoices inv ON po.id = inv.po_id
      WHERE po.po_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(po.po_date, 'Mon'), EXTRACT(MONTH FROM po.po_date)
      ORDER BY month_num ASC
    `);

    // Format the data for Recharts
    return {
      categorySpend: categoryRes.rows.map((r, index) => ({ 
        name: r.name, 
        value: Number(r.value),
        // Assign a standard theme color based on index to keep charts pretty
        color: `hsl(var(--chart-${(index % 5) + 1}))` 
      })),
      orderedVsReceived: orderedVsReceivedRes.rows.map(r => ({
        month: r.month,
        Ordered: Number(r.Ordered) || 0,
        Received: Number(r.Received) || 0
      }))
    };
  } finally {
    client.release();
  }
};