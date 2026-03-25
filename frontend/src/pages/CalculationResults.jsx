import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, FileText, ClipboardList } from "lucide-react";
import { getTodaySL } from "@/lib/date-utils";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const today = getTodaySL();

const CalculationResults = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [generatingPO, setGeneratingPO] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [breakdownItem, setBreakdownItem] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  const [calcRun, setCalcRun] = useState(null);
  const [tabs, setTabs] = useState({});
  const [categories, setCategories] = useState([]);
  const [poLineItems, setPoLineItems] = useState([]);

  const [allItemsByCategory, setAllItemsByCategory] = useState({});
  const [flatItems, setFlatItems] = useState([]); 

  const [recipeResults, setRecipeResults] = useState([]);
  
  // Start completely empty so the clerk has 100% control
  const [selections, setSelections] = useState({});

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

        setRecipeResults(calcData.recipeResults || []);
        setPoLineItems(calcData.poLineItems || []);

        const items = itemsData.items || [];
        setFlatItems(items);

        // Group ALL items by categoryId, and duplicate Extras into their own tab
        const grouped = {};
        const extrasList = [];

        for (const item of items) {
          const catId = String(item.categoryId);
          if (!grouped[catId]) grouped[catId] = [];
          
          const itemObj = {
            id: item.id,
            nameEn: item.nameEn,
            nameSi: item.nameSi,
            unit: item.unit,
            defaultPrice: item.defaultPrice || 0,
            categoryId: item.categoryId,
            isExtra: item.isExtra || false
          };
          
          grouped[catId].push(itemObj);

          if (item.isExtra) {
              extrasList.push(itemObj);
          }
        }
        grouped['extras'] = extrasList;
        setAllItemsByCategory(grouped);

        // Explicitly start with no auto-selections
        setSelections({});

      } catch (error) {
        toast({ title: "Error", description: error.message || "Failed to load calculation results", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast]);

  const fetchBreakdown = async (item) => {
    setBreakdownItem(item);
    setLoadingBreakdown(true);
    try {
      const res = await fetch(`${API_BASE}/calculations/breakdown/${item.id}?date=${today}`, { headers: getAuthHeaders() });
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

  const toggleItemSelection = (item, defaultQty) => {
    setSelections((prev) => {
      const existing = prev[item.id];
      if (existing?.selected) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { selected: true, quantity: defaultQty || 0, unit: item.unit || "Kg", customPrice: null },
      };
    });
  };

  const updateSelectionQuantity = (itemId, quantity) => {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: parseFloat(quantity) || 0 },
    }));
  };

  const handleGeneratePO = async () => {
    setGeneratingPO(true);
    try {
      const finalSelectedItems = [];
      
      // Pull EXACTLY what the user ticked in the UI boxes. No hidden items.
      for (const [itemId, sel] of Object.entries(selections)) {
        if (sel.selected && sel.quantity > 0) {
           const itemInfo = flatItems.find(i => String(i.id) === String(itemId));
           if (itemInfo) {
               finalSelectedItems.push({
                   itemId: itemInfo.id,
                   categoryId: itemInfo.categoryId,
                   quantity: sel.quantity,
                   unit: itemInfo.unit,
                   unitPrice: itemInfo.defaultPrice,
                   defaultPrice: itemInfo.defaultPrice,
                   forBreakfast: true,
                   forLunch: true,
                   forDinner: true,
                   forExtra: itemInfo.isExtra || false,
                   forKanda: false,
               });
           }
        }
      }

      if (finalSelectedItems.length === 0) {
        toast({ title: "No items to order", description: "Please select items via the checkboxes.", variant: "destructive" });
        setGeneratingPO(false);
        return;
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date: calcRun.date || today,
          calcRunId: calcRun.id,
          items: finalSelectedItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.existingId) {
          toast({ title: "PO Already Exists", description: "Navigating to existing purchase order." });
          navigate(`/orders/${data.existingId}`);
          return;
        }
        throw new Error(data.message || "Failed to create purchase order");
      }

      toast({ title: "Purchase Order Created", description: `PO #${data.po.billNumber} created successfully.` });
      navigate(`/orders/${data.po.id}`);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingPO(false);
    }
  };

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
            <TableCell className="text-right">{item.breakfast != null ? `${item.breakfast} ${item.unit}` : "—"}</TableCell>
            <TableCell className="text-right">{item.lunch != null ? `${item.lunch} ${item.unit}` : "—"}</TableCell>
            <TableCell className="text-right">{item.dinner != null ? `${item.dinner} ${item.unit}` : "—"}</TableCell>
            <TableCell className="text-right font-bold text-primary">{item.grandTotal} {item.unit}</TableCell>
            <TableCell>
              {item.breakdown && item.breakdown.length > 0 && (
                <Button variant="ghost" size="icon" onClick={() => fetchBreakdown(item)} className="touch-target"><Search className="h-4 w-4" /></Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No items calculated for this category</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderSelectionTable = (catId, catName) => {
    const options = allItemsByCategory[catId] || [];
    const selectedCount = options.filter((o) => selections[o.id]?.selected).length;

    if (options.length === 0) return null;

    return (
      <Card className="mt-4 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-label font-semibold">Select Items to Order — {catName}</CardTitle>
            {selectedCount > 0 && (<span className="text-xs font-semibold text-primary">{selectedCount} item{selectedCount > 1 ? "s" : ""} selected</span>)}
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

                const calculatedItem = poLineItems.find((po) => String(po.itemId) === String(item.id));
                let suggestedQty = calculatedItem ? calculatedItem.calculatedQty : 0;
                
                if (suggestedQty === 0 && item.isExtra && calcRun?.extrasTotals) {
                    suggestedQty = Number(calcRun.extrasTotals[item.nameEn]) || 0;
                }

                return (
                  <TableRow key={item.id} className={isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "opacity-80"}>
                    <TableCell><Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(item, suggestedQty)} /></TableCell>
                    <TableCell className={`font-medium ${isSelected ? "" : "text-muted-foreground"}`}>
                      <div className="flex items-center flex-wrap gap-2">
                        <span>{item.nameEn}</span>
                        {/* THE FIX: Highly visible 'Requested' badge for Subject Clerk guidance */}
                        {suggestedQty > 0 && (
                          <Badge variant="outline" className="text-[10px] h-6 bg-warning/10 text-warning border-warning/30 font-bold whitespace-nowrap gap-1">
                            <ClipboardList className="h-3 w-3" /> Requested: {suggestedQty}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{item.nameSi}</TableCell>
                    <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-right">Rs. {item.defaultPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {isSelected ? (
                        <Input type="number" step="0.001" min={0} value={qty === 0 ? "" : qty} placeholder={suggestedQty > 0 ? String(suggestedQty) : "0"} onChange={(e) => updateSelectionQuantity(item.id, e.target.value)} className="w-28 h-8 text-right text-sm ml-auto [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      ) : (<span className="text-muted-foreground">—</span>)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {isSelected && qty > 0 ? (<span className="text-primary">Rs. {totalPrice.toLocaleString()}</span>) : (<span className="text-muted-foreground">—</span>)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {selectedCount > 0 && (
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={6} className="text-right text-primary">Category Price Subtotal</TableCell>
                  <TableCell className="text-right text-primary">Rs. {Math.round(options.filter((o) => selections[o.id]?.selected).reduce((sum, o) => sum + (selections[o.id]?.quantity || 0) * o.defaultPrice, 0) * 100) / 100}</TableCell>
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

  let grandTotal = 0;
  const processedItemIds = new Set();

  for (const [catId, catItems] of Object.entries(allItemsByCategory)) {
     for (const item of catItems) {
         if (selections[item.id]?.selected && !processedItemIds.has(item.id)) {
             grandTotal += (selections[item.id].quantity || 0) * item.defaultPrice;
             processedItemIds.add(item.id);
         }
     }
  }
  grandTotal = Math.round(grandTotal * 100) / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-heading-md font-bold text-foreground">Calculation Results — {calcRun.date}</h1>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary text-primary-foreground capitalize">{calcRun.status}</Badge>
          {grandTotal > 0 && (<Badge className="bg-badge-hospital text-primary-foreground text-sm px-3 py-1">Grand Total: Rs. {grandTotal.toLocaleString()}</Badge>)}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {categories.map((cat) => {
            const catId = String(cat.id);
            const catItems = allItemsByCategory[catId] || [];
            // Remove duplicate items before counting selections
            const uniqueCatItems = Array.from(new Map(catItems.map(i => [i.id, i])).values());
            const selectedCount = uniqueCatItems.filter((o) => selections[o.id]?.selected).length;
            
            return (
              <TabsTrigger key={cat.id} value={catId} className="text-label gap-1.5">
                {cat.name}
                {selectedCount > 0 && (<span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5">{selectedCount}</span>)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => {
          const catId = String(cat.id);
          const catItems = tabs[catId] || [];

          return (
            <TabsContent key={cat.id} value={catId}>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-label font-semibold">Calculated Requirements</CardTitle></CardHeader>
                <CardContent className="pt-2">{renderCalculatedTable(catItems)}</CardContent>
              </Card>
              {renderSelectionTable(catId, cat.name)}
            </TabsContent>
          );
        })}
      </Tabs>

      {recipeResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-heading-sm font-semibold text-foreground">Special Requests — Recipe Calculations</h2>
          {recipeResults.map((recipe) => (
            <Card key={recipe.recipeId}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-label font-semibold">{recipe.recipeName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground">{recipe.rawPatientCount} patients requested</Badge>
                    <Badge className="bg-primary/20 text-primary">Weighted count: {recipe.weightedCount}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Ingredient (EN)</TableHead>
                      <TableHead className="hidden md:table-cell">Ingredient (SI)</TableHead>
                      <TableHead className="text-right">Norm / Patient</TableHead>
                      <TableHead className="text-right font-bold">Total Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recipe.ingredients || []).map((ing, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{ing.nameEn}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{ing.nameSi}</TableCell>
                        <TableCell className="text-right">{ing.normPerPatient}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{ing.qty}</TableCell>
                        <TableCell className="text-muted-foreground">{ing.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-10 bg-background border-t py-4 -mx-4 px-4 md:-mx-6 md:px-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{processedItemIds.size} items manually selected across all categories</p>
          <p className="text-lg font-bold text-primary">Grand Total: Rs. {grandTotal.toLocaleString()}</p>
        </div>
        <Button size="lg" className="h-12 px-8 touch-target" disabled={generatingPO || processedItemIds.size === 0} onClick={handleGeneratePO}>
          {generatingPO ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>) : (<><FileText className="h-5 w-5 mr-2" /> Generate Purchase Order</>)}
        </Button>
      </div>

      <Dialog open={!!breakdownItem} onOpenChange={() => { setBreakdownItem(null); setBreakdownData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{breakdownItem?.nameEn} — Breakdown</DialogTitle></DialogHeader>
          {loadingBreakdown ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : breakdownData ? (
            <div>
              <Table>
                <TableHeader><TableRow><TableHead>Diet Type</TableHead><TableHead className="text-right">Total (g)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {breakdownData.breakdown.map((r) => (
                    <TableRow key={r.code}><TableCell>{r.dietType}</TableCell><TableCell className="text-right">{r.totalG.toLocaleString()}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center font-semibold text-primary">Grand Total: {breakdownItem?.grandTotal} {breakdownItem?.unit}</div>
            </div>
          ) : (<p className="text-muted-foreground text-center py-4">No breakdown data available</p>)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalculationResults;