import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, X, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const today = new Date().toISOString().split("T")[0];

const CalculationResults = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [breakdownItem, setBreakdownItem] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // Data from API
  const [calcRun, setCalcRun] = useState(null);
  const [tabs, setTabs] = useState({}); // keyed by category ID (string)
  const [categories, setCategories] = useState([]); // [{ id: "1", name: "..." }, ...]
  const [vegSummaries, setVegSummaries] = useState([]);
  const [vegItems, setVegItems] = useState({}); // Available vegetables per category from items table

  // Vegetable allocations (Subject Clerk picks specific vegetables)
  const [vegAllocations, setVegAllocations] = useState({});

  // Fetch calculation results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/calculations/results?date=${today}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No calculation results found");
        }

        setCalcRun(data.run);
        setTabs(data.tabs || {});
        const cats = data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveTab(String(cats[0].id));
        }
        setVegSummaries(data.vegSummaries || []);

        // Initialize empty allocations for each veg category
        const allocs = {};
        for (const vs of data.vegSummaries || []) {
          allocs[vs.vegCategory] = [];
        }
        setVegAllocations(allocs);

        // Fetch vegetable items for allocation dropdowns
        const itemsRes = await fetch(`${API_BASE}/items`, { headers: getAuthHeaders() });
        const itemsData = await itemsRes.json();
        const items = itemsData.items || [];

        // Group vegetable items by veg_category
        const grouped = {};
        for (const item of items) {
          if (item.isVegetable && item.vegCategory) {
            const cat = item.vegCategory.toLowerCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push({
              id: item.id,
              nameEn: item.nameEn,
              nameSi: item.nameSi,
              unit: item.unit,
            });
          }
        }
        setVegItems(grouped);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load calculation results",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast]);

  // Fetch item breakdown when clicking 🔍
  const fetchBreakdown = async (item) => {
    setBreakdownItem(item);
    setLoadingBreakdown(true);
    try {
      const res = await fetch(
        `${API_BASE}/calculations/breakdown/${item.id}?date=${today}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch breakdown");
      }

      setBreakdownData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setBreakdownData(null);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Veg allocation helpers
  const addVeg = (catKey) => {
    setVegAllocations((prev) => ({
      ...prev,
      [catKey]: [...(prev[catKey] || []), { vegetable: "", quantityKg: 0 }],
    }));
  };

  const removeVeg = (catKey, idx) => {
    setVegAllocations((prev) => ({
      ...prev,
      [catKey]: prev[catKey].filter((_, i) => i !== idx),
    }));
  };

  const updateVeg = (catKey, idx, field, value) => {
    setVegAllocations((prev) => ({
      ...prev,
      [catKey]: prev[catKey].map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));
  };

  // Render table for rice/protein/condiments/extras tabs
  const renderTable = (items) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Item (EN)</TableHead>
          <TableHead className="hidden md:table-cell">Item (SI)</TableHead>
          <TableHead className="text-right">Breakfast</TableHead>
          <TableHead className="text-right">Lunch</TableHead>
          <TableHead className="text-right">Dinner</TableHead>
          <TableHead className="text-right font-bold">Grand Total</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
            <TableCell className="font-medium">{item.nameEn}</TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {item.nameSi}
            </TableCell>
            <TableCell className="text-right">
              {item.breakfast != null ? `${item.breakfast} ${item.unit}` : "—"}
            </TableCell>
            <TableCell className="text-right">
              {item.lunch != null ? `${item.lunch} ${item.unit}` : "—"}
            </TableCell>
            <TableCell className="text-right">
              {item.dinner != null ? `${item.dinner} ${item.unit}` : "—"}
            </TableCell>
            <TableCell className="text-right font-bold text-primary">
              {item.grandTotal} {item.unit}
            </TableCell>
            <TableCell>
              {item.breakdown && item.breakdown.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchBreakdown(item)}
                  className="touch-target"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
              No items in this category
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Render vegetables tab with allocation UI
  const renderVegetables = () => (
    <div className="space-y-6">
      {vegSummaries.map((vs) => {
        const catKey = vs.vegCategory;
        const catName = {
          palaa: "Palaa (Leafy Vegetables)",
          gedi: "Gedi (Vegetable Fruits)",
          piti: "Piti (Starchy Vegetables)",
          other: "Other Vegetables",
        }[catKey] || catKey;

        const allocs = vegAllocations[catKey] || [];
        const allocated = allocs.reduce((s, a) => s + (a.quantityKg || 0), 0);
        const pct = vs.requiredKg > 0 ? Math.min((allocated / vs.requiredKg) * 100, 100) : 0;
        const progressColor =
          allocated > vs.requiredKg
            ? "text-destructive"
            : pct >= 80
            ? "text-warning"
            : "text-primary";

        const options = vegItems[catKey] || [];

        return (
          <Card key={catKey}>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-label font-semibold">{catName}</CardTitle>
                <span className={`text-label font-medium ${progressColor}`}>
                  Allocated: {allocated.toFixed(2)} / {vs.requiredKg} Kg
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={pct} className="h-2" />
              <div className="space-y-2">
                {allocs.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={a.vegetable}
                      onValueChange={(v) => updateVeg(catKey, idx, "vegetable", v)}
                    >
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue placeholder="Select vegetable" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (
                          <SelectItem key={o.id} value={o.nameEn}>
                            {o.nameSi} / {o.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.001"
                      value={a.quantityKg || ""}
                      onChange={(e) =>
                        updateVeg(catKey, idx, "quantityKg", parseFloat(e.target.value) || 0)
                      }
                      className="w-28 h-10 text-right"
                      placeholder="Kg"
                    />
                    <span className="text-xs text-muted-foreground">Kg</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVeg(catKey, idx)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => addVeg(catKey)}>
                <Plus className="h-4 w-4 mr-1" /> Add Vegetable
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {vegSummaries.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No vegetable requirements calculated
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading calculation results...</span>
      </div>
    );
  }

  if (!calcRun) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No calculation results found for today. Run the calculation from the Calculations page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-heading-md font-bold text-foreground">
          Calculation Results — {calcRun.date}
        </h1>
        <Badge className="bg-primary text-primary-foreground capitalize">
          {calcRun.status}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={String(cat.id)} className="text-label">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={String(cat.id)}>
            <Card>
              <CardContent className="pt-4">
                {renderTable(tabs[String(cat.id)] || [])}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Vegetable Allocation Section */}
      {vegSummaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-heading-sm font-semibold text-foreground">Vegetable Allocation</h2>
          {renderVegetables()}
        </div>
      )}

      {/* Breakdown Dialog */}
      <Dialog
        open={!!breakdownItem}
        onOpenChange={() => {
          setBreakdownItem(null);
          setBreakdownData(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{breakdownItem?.nameEn} — Breakdown</DialogTitle>
          </DialogHeader>
          {loadingBreakdown ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : breakdownData ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diet Type</TableHead>
                    <TableHead className="text-right">Total (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdownData.breakdown.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell>{r.dietType}</TableCell>
                      <TableCell className="text-right">
                        {r.totalG.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center font-semibold text-primary">
                Grand Total: {breakdownItem?.grandTotal} {breakdownItem?.unit}
              </div>

              {/* Per-meal breakdown */}
              {breakdownData.meals && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {breakdownData.meals.map((m) => (
                    <div key={m.meal} className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground capitalize">{m.meal}</p>
                      <p className="text-sm font-bold">
                        {m.displayValue} {m.displayUnit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No breakdown data available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalculationResults;