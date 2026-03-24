import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Square, Calculator, Loader2, Leaf, Drumstick } from "lucide-react";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const today = new Date().toISOString().split("T")[0];

const Calculations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data from API
  const [wards, setWards] = useState([]);
  const [wardStatuses, setWardStatuses] = useState([]);
  const [staffMeals, setStaffMeals] = useState(null);
  const [dailyCycle, setDailyCycle] = useState({ patientCycle: "Vegetable", staffCycle: "Chicken" });
  const [dietTypes, setDietTypes] = useState([]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const [wardsRes, statusesRes, staffRes, cycleRes, dietTypesRes] = await Promise.all([
          fetch(`${API_BASE}/wards`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/census/statuses?date=${today}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/census/staff?date=${today}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/daily-cycle?date=${today}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/diet-types`, { headers: getAuthHeaders() }),
        ]);

        const wardsData = await wardsRes.json();
        const statusesData = await statusesRes.json();
        const staffData = await staffRes.json();
        const cycleData = await cycleRes.json();
        const dietTypesData = await dietTypesRes.json();

        // THE FIX: Filter out deactivated wards immediately!
        const activeWards = (wardsData.wards || []).filter((w) => w.active);
        setWards(activeWards);
        
        setDietTypes((dietTypesData.dietTypes || []).filter((d) => d.active && d.type !== "Staff"));

        // Build ward statuses by merging ONLY active wards with census statuses
        const statuses = statusesData.statuses || [];
        const merged = activeWards.map((w) => {
          const census = statuses.find((s) => String(s.wardId) === String(w.id));
          return {
            wardId: w.id,
            wardName: w.ward_name || w.wardName || w.name,
            code: w.ward_code || w.wardCode || w.code,
            status: census?.status || "not_started",
            patientCount: census?.totalPatients || 0,
          };
        });
        setWardStatuses(merged);

        if (staffData.staffMeals) {
          setStaffMeals(staffData.staffMeals);
        }

        if (cycleData.cycle) {
          setDailyCycle(cycleData.cycle);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load calculation data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [toast]);

  // Compute stats
  const submitted = wardStatuses.filter(
    (w) => w.status === "submitted" || w.status === "locked"
  ).length;
  const total = wardStatuses.length;
  const allSubmitted = total > 0 && submitted === total;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  // Aggregate patient totals from ward statuses
  // We need to fetch actual census data for aggregation
  const [aggregated, setAggregated] = useState(null);

  useEffect(() => {
    const fetchAggregated = async () => {
      if (submitted === 0) return;

      try {
        // Fetch all submissions for today to get diet breakdowns
        const res = await fetch(`${API_BASE}/census/my-submissions?date=${today}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        const submissions = data.submissions || [];

        // Aggregate across all wards
        const totals = {};
        dietTypes.forEach((dt) => {
          totals[dt.code || dt.id] = 0;
        });

        for (const sub of submissions) {
          const diets = sub.diets || {};
          for (const [key, value] of Object.entries(diets)) {
            if (totals[key] !== undefined) {
              totals[key] += Number(value) || 0;
            } else {
              totals[key] = Number(value) || 0;
            }
          }
        }

        const totalPatients = Object.values(totals).reduce((s, v) => s + v, 0);

        setAggregated({
          totals,
          totalPatients,
          staffB: staffMeals?.breakfast || 0,
          staffL: staffMeals?.lunch || 0,
          staffD: staffMeals?.dinner || 0,
          totalStaff:
            (staffMeals?.breakfast || 0) +
            (staffMeals?.lunch || 0) +
            (staffMeals?.dinner || 0),
        });
      } catch (error) {
        console.error("Failed to aggregate:", error);
      }
    };

    if (dietTypes.length > 0) {
      fetchAggregated();
    }
  }, [submitted, dietTypes, staffMeals]);

  // Run calculation via backend
  const handleRunCalc = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`${API_BASE}/calculations/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: today }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Calculation failed");
      }

      toast({
        title: "Calculation Complete",
        description: "Ingredient requirements have been calculated.",
      });

      navigate("/calculations/results");
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const statusIcon = (status) => {
    if (status === "submitted" || status === "locked")
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    if (status === "draft") return <Clock className="h-5 w-5 text-warning" />;
    // Apply matching golden brown/orange color to the pending icon
    return <Square className="h-5 w-5 text-orange-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading ward data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-heading-md font-bold text-foreground">
          Ward Submissions & Calculation
        </h1>
        <div className="flex items-center gap-2 text-label text-muted-foreground">
          <span>{today}</span>
        </div>
      </div>

      {/* Read-only cycle badges */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-label font-semibold">Patient Cycle:</span>
            <Badge className="bg-primary text-primary-foreground capitalize gap-1.5">
              <Leaf className="h-3.5 w-3.5" /> {dailyCycle.patientCycle}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label font-semibold">Staff Cycle:</span>
            <Badge className="bg-badge-hospital text-primary-foreground capitalize gap-1.5">
              <Drumstick className="h-3.5 w-3.5" /> {dailyCycle.staffCycle}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground italic ml-auto">
            Set by Hospital Admin
          </p>
        </CardContent>
      </Card>

      {/* Submission progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-label font-semibold">Submission Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-label">
            <span>
              {submitted} / {total} wards submitted
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
        </CardContent>
      </Card>

      {/* Ward grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {wardStatuses.map((w) => (
          <Card
            key={w.wardId}
            className={`p-3 border transition-colors ${
              w.status === "submitted" || w.status === "locked"
                ? "border-primary/40 bg-primary/5"
                : w.status === "draft"
                ? "border-warning/40 bg-warning/5"
                : "border-orange-500/40 bg-orange-500/5" // New golden brown border for pending
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-label font-semibold truncate">{w.wardName}</p>
                <p className="text-xs text-muted-foreground">{w.code}</p>
              </div>
              {statusIcon(w.status)}
            </div>
            {(w.status === "submitted" || w.status === "locked") && (
              <p className="text-xs text-primary font-medium mt-1">
                {w.patientCount} patients
              </p>
            )}
            {w.status === "draft" && (
              <p className="text-xs text-warning font-medium mt-1">Draft</p>
            )}
            {/* New Pending Text Label */}
            {w.status === "not_started" && (
              <p className="text-xs text-orange-600 font-medium mt-1">Pending</p>
            )}
          </Card>
        ))}
      </div>

      {/* Aggregated totals */}
      {aggregated && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-label font-semibold">Aggregated Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {dietTypes.map((dt) => (
                <div key={dt.code || dt.id} className="bg-muted rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">{dt.nameEn || dt.name_en}</p>
                  <p className="text-lg font-bold text-foreground">
                    {aggregated.totals[dt.code || dt.id] || 0}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Staff B</p>
                <p className="text-lg font-bold">{aggregated.staffB}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Staff L</p>
                <p className="text-lg font-bold">{aggregated.staffL}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Staff D</p>
                <p className="text-lg font-bold">{aggregated.staffD}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2 text-center border border-primary/30">
                <p className="text-xs text-primary font-medium">Total Patients</p>
                <p className="text-lg font-bold text-primary">{aggregated.totalPatients}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2 text-center border border-primary/30">
                <p className="text-xs text-primary font-medium">Total Staff</p>
                <p className="text-lg font-bold text-primary">{aggregated.totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Calculation */}
      <div className="flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="lg"
                className="h-14 px-10 text-body font-semibold touch-target"
                disabled={!allSubmitted || isCalculating}
                onClick={handleRunCalc}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-5 w-5" /> Run Calculation
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {!allSubmitted && (
            <TooltipContent>
              All wards must be submitted before running calculation
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
};

export default Calculations;