import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

const StatBox = ({ label, value, size = "lg" }) => (
  <div className="bg-card rounded-xl border-2 border-border p-4 text-center">
    <p className={`font-bold text-primary ${size === "lg" ? "text-5xl" : "text-3xl"}`}>
      {value}
    </p>
    <p className="text-base text-muted-foreground font-medium mt-1">{label}</p>
  </div>
);

const RecipeCard = ({ title, count, borderColor, ingredients }) => (
  <Card className={`border-2 ${borderColor}`}>
    <CardHeader>
      <CardTitle className="text-xl font-bold">
        {title} — for {count} patients
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {ingredients.map((ing) => (
          <div
            key={ing.nameEn || ing.itemId}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <span className="text-base font-semibold">
              {ing.nameSi ? `${ing.nameSi} / ` : ""}
              {ing.nameEn}
            </span>
            <span className="text-xl font-bold text-primary">
              {ing.qty} {ing.unit}
            </span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const CookSheet = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cookSheet, setCookSheet] = useState(null);
  const [extrasOpen, setExtrasOpen] = useState(false);

  useEffect(() => {
    const fetchCookSheet = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/calculations/cook-sheet?date=${today}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No cook sheet found for today");
        }

        setCookSheet(data.cookSheet);
      } catch (error) {
        toast({
          title: "No Cook Sheet",
          description: error.message || "Cook sheet not available for today",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCookSheet();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading cook sheet...</span>
      </div>
    );
  }

  if (!cookSheet) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No cook sheet available for today. The calculation has not been run yet.
      </div>
    );
  }

  const patientTotals = cookSheet.patientTotals || {};
  const staff = cookSheet.staff || {};
  const dietInstructions = cookSheet.dietInstructions || [];
  const proteinAllocation = cookSheet.proteinAllocation || [];
  const recipes = cookSheet.recipes || [];
  const kanda = cookSheet.kanda;
  const extras = cookSheet.extras || {};
  const customExtras = cookSheet.customExtras || [];

  // Build extras list for display
  const extrasList = [
    ...Object.entries(extras)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([name, qty]) => ({ item: name, qty: Number(qty), unit: "" })),
    ...customExtras
      .filter((ce) => Number(ce.quantity) > 0)
      .map((ce) => ({ item: ce.name, qty: ce.quantity, unit: ce.unit })),
  ];

  return (
    <div className="space-y-6">
      {/* Large header banner */}
      <div className="bg-primary rounded-xl p-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
          TODAY'S COOK SHEET
        </h1>
        <p className="text-xl text-primary-foreground/80 mt-1">{cookSheet.date}</p>
        <Badge className="mt-2 bg-primary-foreground/20 text-primary-foreground text-lg px-4 py-1">
          {cookSheet.patientCycle} Cycle
        </Badge>
      </div>

      {/* Patient details */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(patientTotals).map(([code, count]) => (
              <StatBox key={code} label={code} value={count} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff meals */}
      <Card className="border-2 border-badge-hospital">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Staff Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Breakfast" value={staff.breakfast || 0} />
            <StatBox label="Lunch" value={staff.lunch || 0} />
            <StatBox label="Dinner" value={staff.dinner || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Diet instructions */}
      {dietInstructions.length > 0 && (
        <Card className="border-2 border-warning">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Diet Instructions to Kitchen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base font-bold">Type</TableHead>
                  <TableHead className="text-base font-bold text-right">Breakfast</TableHead>
                  <TableHead className="text-base font-bold text-right">Lunch</TableHead>
                  <TableHead className="text-base font-bold text-right">Dinner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dietInstructions.map((r) => (
                  <TableRow key={r.type}>
                    <TableCell className="text-base font-semibold">{r.type}</TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {r.breakfast || "—"}
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {r.lunch || "—"}
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {r.dinner || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Protein */}
      {proteinAllocation.length > 0 && (
        <Card className="border-2 border-destructive">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Protein Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base font-bold">Item</TableHead>
                  <TableHead className="text-base font-bold text-right">Children</TableHead>
                  <TableHead className="text-base font-bold text-right">Patients</TableHead>
                  <TableHead className="text-base font-bold text-right">Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proteinAllocation.map((r) => (
                  <TableRow key={r.nameEn}>
                    <TableCell className="text-base font-semibold">{r.nameEn}</TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {r.children || "—"}
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {r.patients || "—"}
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {r.staff || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recipes — actual ingredient quantities */}
      {recipes.map((recipe) => {
        const borderColor =
          recipe.recipeKey?.includes("sambola") || recipe.recipeKey?.includes("polSambola")
            ? "border-orange-400"
            : recipe.recipeKey?.includes("soup")
            ? "border-badge-hospital"
            : "border-purple-500";

        return (
          <RecipeCard
            key={recipe.recipeId}
            title={recipe.recipeName}
            count={recipe.patientCount}
            borderColor={borderColor}
            ingredients={recipe.ingredients}
          />
        );
      })}

      {/* Kanda */}
      {kanda && kanda.count > 0 && (
        <RecipeCard
          title="Kanda (Porridge)"
          count={kanda.count}
          borderColor="border-purple-500"
          ingredients={[
            {
              nameSi: "හාල් - රතු නාඩු",
              nameEn: "Red Raw Rice (Red Nadu)",
              qty: kanda.redRiceG,
              unit: "g",
            },
          ]}
        />
      )}

      {/* Extra items */}
      {extrasList.length > 0 && (
        <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
          <Card className="border-2 border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${extrasOpen ? "" : "-rotate-90"}`}
                  />
                  Extra Items
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base font-bold">Item</TableHead>
                      <TableHead className="text-base font-bold text-right">Quantity</TableHead>
                      <TableHead className="text-base font-bold">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extrasList.map((e) => (
                      <TableRow key={e.item}>
                        <TableCell className="text-base font-semibold">{e.item}</TableCell>
                        <TableCell className="text-right text-lg font-bold text-primary">
                          {e.qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-base">{e.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

export default CookSheet;