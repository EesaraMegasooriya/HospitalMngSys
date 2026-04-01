import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

// Custom Tooltip for Currency formatting
const CurrencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: Rs. {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FinancialReports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    categorySpend: [],
    orderedVsReceived: []
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE}/reports/accountant`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || "Failed to load reports");
        
        // Map colors manually if CSS variables aren't strictly defined as chart-1, chart-2 etc.
        const colors = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#64748b"];
        const formattedCategorySpend = data.categorySpend.map((item, i) => ({
           ...item,
           color: colors[i % colors.length]
        }));

        setReportData({
          categorySpend: formattedCategorySpend,
          orderedVsReceived: data.orderedVsReceived
        });
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Crunching financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          Accountant Financial Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Real-time expenditure aggregation based on finalized deliveries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Budget/Spend by Category (Donut Chart) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Actual Expenditure by Category
            </CardTitle>
            <CardDescription>Total hospital spending breakdown based on received invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full flex items-center">
              {reportData.categorySpend.length === 0 ? (
                <div className="w-full text-center text-muted-foreground">No received invoices found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.categorySpend}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {reportData.categorySpend.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Ordered vs Received Value (Area Chart) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Procurement Accuracy (Last 6 Months)
            </CardTitle>
            <CardDescription>Estimated Purchase Order value vs. Actual Billed Invoice value.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
               {reportData.orderedVsReceived.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No purchase order data found.</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.orderedVsReceived} margin={{ top: 10, right: 0, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrdered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Area type="monotone" name="Estimated PO Value" dataKey="Ordered" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorOrdered)" strokeWidth={2} />
                  <Area type="monotone" name="Actual Billed Value" dataKey="Received" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default FinancialReports;