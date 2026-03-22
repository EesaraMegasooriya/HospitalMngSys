import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, FileText } from "lucide-react";

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
  const [tabs, setTabs] = useState({});
  const [categories, setCategories] = useState([]);

  // ALL items from database grouped by categoryId
  const [allItemsByCategory, setAllItemsByCategory] = useState({});

  // Selected items for ordering: { itemId: { selected: true, quantity: 4.905, customPrice: null } }
  const [selections, setSelections] = useState({});

  // Fetch calculation results + items
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);

        const [calcRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE}/calculations/results?date=${today}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/items`, { headers: getAuthHeaders() }),
        ]);

        const calcData = await calcRes.json();
        const itemsData = await itemsRes.json();

        if (!calcRes.ok) throw new Error(calcData.message || "No calculation results found");

        setCalcRun(calcData.run);
        setTabs(calcData.tabs || {});
        const cats = calcData.categories || [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(String(cats[0].id));

        // Group ALL items by categoryId
        const items = itemsData.items || [];
        const grouped = {};
        for (const item of items) {
          const catId = String(item.categoryId);
          if (!grouped[catId]) grouped[catId] = [];
          grouped[catId].push({
            id: item.id,
            nameEn: item.nameEn,
            nameSi: item.nameSi,
            unit: item.unit,
            defaultPrice: item.defaultPrice || 0,
          });
        }
        setAllItemsByCategory(grouped);
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
      if (!res.ok) throw new Error(data.message || "Failed to fetch breakdown");
      setBreakdownData(data);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setBreakdownData(null);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // ─── Selection helpers ───
  const toggleItemSelection = (itemId, quantity, unit) => {
    setSelections((prev) => {
      const existing = prev[itemId];
      if (existing?.selected) {
        // Deselect
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      // Select with the calculated quantity
      return {
        ...prev,
        [itemId]: { selected: true, quantity: quantity || 0, unit: unit || "Kg", customPrice: null },
      };
    });
  };

  const updateSelectionQuantity = (itemId, quantity) => {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: parseFloat(quantity) || 0 },
    }));
  };

  // Get required total for a category (MAX of calculated items)
  const getCategoryTotal = (catId) => {
    const items = tabs[catId] || [];
    if (items.length === 0) return 0;
    return Math.round(Math.max(...items.map((item) => item.grandTotal || 0)) * 100) / 100;
  };

  const getCategoryUnit = (catId) => {
    const items = tabs[catId] || [];
    return items.length > 0 ? items[0].unit || "Kg" : "Kg";
  };

  // Get total selected quantity for a category
  const getSelectedTotal = (catId) => {
    const catItems = allItemsByCategory[catId] || [];
    let total = 0;
    for (const item of catItems) {
      if (selections[item.id]?.selected) {
        total += selections[item.id].quantity || 0;
      }
    }
    return Math.round(total * 100) / 100;
  };

  // ─── Render: Calculated totals table (read-only reference) ───
  const renderCalculatedTable = (items) => (
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
            <TableCell className="hidden md:table-cell text-muted-foreground">{item.nameSi}</TableCell>
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
                <Button variant="ghost" size="icon" onClick={() => fetchBreakdown(item)} className="touch-target">
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
              No items calculated for this category
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // ─── Render: Item selection table with checkboxes ───
  const renderSelectionTable = (catId, catName) => {
    const requiredTotal = getCategoryTotal(catId);
    const unit = getCategoryUnit(catId);
    const options = allItemsByCategory[catId] || [];
    const selectedTotal = getSelectedTotal(catId);
    const selectedCount = options.filter((o) => selections[o.id]?.selected).length;

    if (requiredTotal === 0 && options.length === 0) return null;

    return (
      <Card className="mt-4 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-label font-semibold">
              Select Items to Order — {catName}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Required: <span className="font-bold text-foreground">{requiredTotal} {unit}</span>
              </span>
              <span className={`text-xs font-semibold ${
                selectedTotal > requiredTotal ? "text-destructive" :
                selectedTotal > 0 && Math.abs(selectedTotal - requiredTotal) < 0.01 ? "text-primary" :
                selectedTotal > 0 ? "text-warning" : "text-muted-foreground"
              }`}>
                Selected: {selectedTotal} {unit}
                {selectedCount > 0 && ` (${selectedCount} item${selectedCount > 1 ? "s" : ""})`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Item (EN)</TableHead>
                <TableHead className="hidden md:table-cell">Item (SI)</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Price (Rs)</TableHead>
                <TableHead className="text-right w-32">Quantity</TableHead>
                <TableHead className="text-right">Total (Rs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((item) => {
                const isSelected = selections[item.id]?.selected || false;
                const qty = selections[item.id]?.quantity || 0;
                const totalPrice = Math.round(qty * item.defaultPrice * 100) / 100;

                return (
                  <TableRow
                    key={item.id}
                    className={isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "opacity-70"}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.id, requiredTotal, item.unit)}
                      />
                    </TableCell>
                    <TableCell className={`font-medium ${isSelected ? "" : "text-muted-foreground"}`}>
                      {item.nameEn}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {item.nameSi}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right">
                      Rs. {item.defaultPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelected ? (
                        <Input
                          type="number"
                          step="0.001"
                          min={0}
                          value={qty || ""}
                          onChange={(e) => updateSelectionQuantity(item.id, e.target.value)}
                          className="w-28 h-8 text-right text-sm ml-auto [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {isSelected && qty > 0 ? (
                        <span className="text-primary">Rs. {totalPrice.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Category subtotal row */}
              {selectedCount > 0 && (
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={5} className="text-right text-primary">
                    Category Subtotal
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {selectedTotal} {unit}
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    Rs. {Math.round(
                      options
                        .filter((o) => selections[o.id]?.selected)
                        .reduce((sum, o) => sum + (selections[o.id]?.quantity || 0) * o.defaultPrice, 0)
                      * 100
                    ) / 100}
                  </TableCell>
                </TableRow>
              )}

              {options.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    No items available in this category
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

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

  // Grand total of all selected items across all categories
  const grandTotal = Math.round(
    Object.values(allItemsByCategory)
      .flat()
      .filter((item) => selections[item.id]?.selected)
      .reduce((sum, item) => sum + (selections[item.id]?.quantity || 0) * item.defaultPrice, 0)
    * 100
  ) / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-heading-md font-bold text-foreground">
          Calculation Results — {calcRun.date}
        </h1>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary text-primary-foreground capitalize">
            {calcRun.status}
          </Badge>
          {grandTotal > 0 && (
            <Badge className="bg-badge-hospital text-primary-foreground text-sm px-3 py-1">
              Grand Total: Rs. {grandTotal.toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {categories.map((cat) => {
            const catId = String(cat.id);
            const catItems = allItemsByCategory[catId] || [];
            const selectedCount = catItems.filter((o) => selections[o.id]?.selected).length;
            return (
              <TabsTrigger key={cat.id} value={catId} className="text-label gap-1.5">
                {cat.name}
                {selectedCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5">
                    {selectedCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const catId = String(cat.id);
          const catItems = tabs[catId] || [];

          return (
            <TabsContent key={cat.id} value={catId}>
              {/* Calculated requirements (read-only reference) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-label font-semibold">
                    Calculated Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {renderCalculatedTable(catItems)}
                </CardContent>
              </Card>

              {/* Item selection table with checkboxes and prices */}
              {renderSelectionTable(catId, cat.name)}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Sticky bottom bar with Generate PO button */}
      {grandTotal > 0 && (
        <div className="sticky bottom-0 bg-background border-t py-4 -mx-4 px-4 md:-mx-6 md:px-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {Object.values(selections).filter((s) => s.selected).length} items selected across all categories
            </p>
            <p className="text-lg font-bold text-primary">
              Grand Total: Rs. {grandTotal.toLocaleString()}
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 px-8"
            onClick={() => {
              toast({
                title: "Draft PO Generated",
                description: `Purchase order created with Rs. ${grandTotal.toLocaleString()} total`,
              });
            }}
          >
            <FileText className="h-5 w-5 mr-2" /> Generate Purchase Order
          </Button>
        </div>
      )}

      {/* Breakdown Dialog */}
      <Dialog
        open={!!breakdownItem}
        onOpenChange={() => { setBreakdownItem(null); setBreakdownData(null); }}
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
                      <TableCell className="text-right">{r.totalG.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center font-semibold text-primary">
                Grand Total: {breakdownItem?.grandTotal} {breakdownItem?.unit}
              </div>
              {breakdownData.meals && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {breakdownData.meals.map((m) => (
                    <div key={m.meal} className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground capitalize">{m.meal}</p>
                      <p className="text-sm font-bold">{m.displayValue} {m.displayUnit}</p>
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