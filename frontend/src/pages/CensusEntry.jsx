import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  HelpCircle,
  Plus,
  Save,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5050/api/census";
const WARDS_API = "http://localhost:5050/api/wards";
const ITEMS_API = "http://localhost:5050/api/items";

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const today = new Date().toISOString().split("T")[0];

const DIET_FIELDS = [
  { key: "normal", label: "Normal Diet" },
  { key: "soft", label: "Soft Diet" },
  { key: "liquid", label: "Liquid Diet" },
  { key: "lowSalt", label: "Low Salt" },
  { key: "diabetic", label: "Diabetic" },
  { key: "renal", label: "Renal" },
  { key: "nasogastric", label: "Nasogastric" },
  { key: "other", label: "Other" },
];

const statusConfig = {
  not_started: { label: "Not Submitted", className: "bg-muted text-muted-foreground" },
  draft: { label: "Draft", className: "bg-warning-bg text-warning" },
  submitted: { label: "Submitted", className: "bg-accent text-accent-foreground" },
  locked: { label: "Locked", className: "bg-destructive/10 text-destructive" },
};

const NumField = ({ value, onChange, onEnter, inputRef, min = 0, className = "" }) => {
  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      min={min}
      value={value || ""}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        onChange(isNaN(v) ? 0 : Math.max(min, v));
      }}
      onKeyDown={handleKey}
      className={`h-11 text-input text-center w-24 touch-target ${className}`}
    />
  );
};

const CensusEntryPage = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("patients");

  const [wards, setWards] = useState([]);
  const [wardStatuses, setWardStatuses] = useState([]);
  const [extraItemsMaster, setExtraItemsMaster] = useState([]);

  const [wardId, setWardId] = useState("");
  const [wardSearchOpen, setWardSearchOpen] = useState(false);

  const [diets, setDiets] = useState(() =>
    Object.fromEntries(DIET_FIELDS.map((f) => [f.key, 0]))
  );
  const [special, setSpecial] = useState({ soup: 0, kanda: 0, polSambola: 0 });
  const [extras, setExtras] = useState({});
  const [customExtras, setCustomExtras] = useState([]);

  const [staffMeals, setStaffMeals] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [staffSubmitted, setStaffSubmitted] = useState(false);

  const [status, setStatus] = useState("not_started");

  const [extrasOpen, setExtrasOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newItem, setNewItem] = useState({ name: "", quantity: 0, unit: "Pcs" });

  const inputRefs = useRef([]);
  const focusNext = (idx) => {
    const next = inputRefs.current[idx + 1];
    next?.focus();
  };
  const registerRef = (idx) => (el) => {
    inputRefs.current[idx] = el;
  };

  const ward = useMemo(() => wards.find((w) => String(w.id) === String(wardId)), [wards, wardId]);
  const capacity = ward ? (Number(ward.beds || 0) + Number(ward.cots || 0) + Number(ward.icu || 0) + Number(ward.incubators || 0)) : 0;

  const submittedCount = wardStatuses.filter(
    (w) => w.status === "submitted" || w.status === "locked"
  ).length;
  const submissionPct = wards.length ? Math.round((submittedCount / wards.length) * 100) : 0;

  const totalPatients = useMemo(
    () => Object.values(diets).reduce((s, v) => s + (Number(v) || 0), 0),
    [diets]
  );

  const capacityPercent = capacity > 0 ? Math.min((totalPatients / capacity) * 100, 120) : 0;
  const overCapacity = totalPatients > capacity && capacity > 0;

  const progressColor = overCapacity
    ? "bg-destructive"
    : capacityPercent >= 80
    ? "bg-warning"
    : "bg-primary";

  const isReadOnly = status === "submitted" || status === "locked";

  const normalizeWardStatuses = (statusesFromApi) => {
    return wards.map((w) => {
      const sub = statusesFromApi.find((s) => String(s.wardId) === String(w.id));
      return {
        ward: w,
        status: sub?.status || "not_started",
        totalPatients: sub?.totalPatients || 0,
      };
    });
  };

  const fetchWards = async () => {
    const res = await fetch(WARDS_API, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch wards");
    return data.wards || [];
  };

  const fetchStatuses = async () => {
    const res = await fetch(`${API_BASE}/statuses?date=${today}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch ward statuses");
    return data.statuses || [];
  };

  const fetchExtraItems = async () => {
    const res = await fetch(ITEMS_API, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch items");
    return (data.items || []).map((item) => ({
      id: item.id,
      name: item.nameEn,
      unit: item.unit,
    }));
  };

  const fetchStaffMeals = async () => {
    const res = await fetch(`${API_BASE}/staff?date=${today}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch staff meals");

    if (data.staffMeals) {
      setStaffMeals({
        breakfast: data.staffMeals.breakfast || 0,
        lunch: data.staffMeals.lunch || 0,
        dinner: data.staffMeals.dinner || 0,
      });
      setStaffSubmitted(data.staffMeals.status === "submitted");
    } else {
      setStaffMeals({ breakfast: 0, lunch: 0, dinner: 0 });
      setStaffSubmitted(false);
    }
  };

  const initExtrasObject = (itemsList) =>
    Object.fromEntries(itemsList.map((i) => [i.name, 0]));

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);

        const [wardsData, statusesData, itemsData] = await Promise.all([
          fetchWards(),
          fetchStatuses(),
          fetchExtraItems(),
        ]);

        setWards(wardsData);
        setExtraItemsMaster(itemsData);
        setExtras(initExtrasObject(itemsData));
        setWardStatuses(
          wardsData.map((w) => {
            const sub = statusesData.find((s) => String(s.wardId) === String(w.id));
            return {
              ward: w,
              status: sub?.status || "not_started",
              totalPatients: sub?.totalPatients || 0,
            };
          })
        );

        await fetchStaffMeals();
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load census page",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  const loadWardData = useCallback(
    async (id) => {
      try {
        setWardId(String(id));
        setWardSearchOpen(false);

        const res = await fetch(`${API_BASE}/ward/${id}?date=${today}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch ward census");
        }

        if (data.census) {
          setDiets({
            ...Object.fromEntries(DIET_FIELDS.map((f) => [f.key, 0])),
            ...(data.census.diets || {}),
          });

          setSpecial({
            soup: data.census.special?.soup || 0,
            kanda: data.census.special?.kanda || 0,
            polSambola: data.census.special?.polSambola || 0,
          });

          setExtras({
            ...initExtrasObject(extraItemsMaster),
            ...(data.census.extras || {}),
          });

          setCustomExtras(data.census.customExtras || []);
          setStatus(data.census.status || "not_started");
        } else {
          setDiets(Object.fromEntries(DIET_FIELDS.map((f) => [f.key, 0])));
          setSpecial({ soup: 0, kanda: 0, polSambola: 0 });
          setExtras(initExtrasObject(extraItemsMaster));
          setCustomExtras([]);
          setStatus("not_started");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load ward data",
          variant: "destructive",
        });
      }
    },
    [extraItemsMaster, toast]
  );

  const saveDraft = async () => {
    if (!wardId) return;

    try {
      setSavingDraft(true);

      const payload = {
        wardId,
        date: today,
        diets,
        special,
        extras,
        customExtras,
      };

      const res = await fetch(`${API_BASE}/draft`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save draft");

      setStatus("draft");

      const statusesData = await fetchStatuses();
      setWardStatuses(normalizeWardStatuses(statusesData));

      toast({
        title: "Draft Saved",
        description: `${ward?.name || "Ward"} draft saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not save draft",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!wardId) return;

    try {
      setSubmitting(true);

      const payload = {
        wardId,
        date: today,
        diets,
        special,
        extras,
        customExtras,
      };

      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit census");

      setConfirmOpen(false);
      setStatus("submitted");

      const statusesData = await fetchStatuses();
      const normalized = normalizeWardStatuses(statusesData);
      setWardStatuses(normalized);

      toast({
        title: "Census submitted",
        description: `${ward?.name} data submitted successfully.`,
      });

      const nextWard = normalized.find(
        (w) =>
          String(w.ward.id) !== String(wardId) &&
          (w.status === "not_started" || w.status === "draft")
      );

      if (nextWard) {
        setTimeout(() => loadWardData(nextWard.ward.id), 400);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not submit census",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomItem = () => {
    if (!newItem.name.trim()) return;
    setCustomExtras((prev) => [...prev, { ...newItem, name: newItem.name.trim() }]);
    setNewItem({ name: "", quantity: 0, unit: "Pcs" });
    setAddItemOpen(false);
  };

  const handleSubmitStaff = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date: today,
          breakfast: staffMeals.breakfast,
          lunch: staffMeals.lunch,
          dinner: staffMeals.dinner,
          staffCycle: "Chicken",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit staff meals");

      setStaffSubmitted(true);
      toast({
        title: "Staff meals submitted",
        description: "Staff meal counts saved for today.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not submit staff meals",
        variant: "destructive",
      });
    }
  };

  let refIdx = 0;

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      <h1 className="text-heading-lg text-foreground">Census Entry</h1>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-label font-semibold">
              {submittedCount} / {wards.length} wards submitted
            </span>
            <span className="text-label font-semibold text-primary">{submissionPct}%</span>
          </div>
          <Progress value={submissionPct} className="h-3" />
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-3">
            {wardStatuses.map((ws) => {
              const isSubmitted = ws.status === "submitted" || ws.status === "locked";
              const isActive = String(ws.ward.id) === String(wardId);

              return (
                <button
                  key={ws.ward.id}
                  onClick={() => loadWardData(ws.ward.id)}
                  className={cn(
                    "rounded-lg p-2 text-center text-xs border transition-all cursor-pointer",
                    isActive && "ring-2 ring-primary",
                    isSubmitted
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <p className="font-semibold truncate">{ws.ward.code}</p>
                  {isSubmitted && <p className="text-[10px]">{ws.totalPatients}p</p>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="patients" className="flex-1 touch-target">
            Patient Census
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-1 touch-target">
            Staff Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-label font-semibold">Select Ward</Label>
                  <Popover open={wardSearchOpen} onOpenChange={setWardSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={wardSearchOpen}
                        className="w-full justify-between h-12 text-input touch-target"
                      >
                        {ward ? `${ward.name} (${ward.code})` : "Search or select a ward…"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by ward name…" />
                        <CommandList>
                          <CommandEmpty>No ward found.</CommandEmpty>
                          <CommandGroup>
                            {wards.map((w) => (
                              <CommandItem
                                key={w.id}
                                value={`${w.name} ${w.code}`}
                                onSelect={() => loadWardData(w.id)}
                                className="text-body"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    String(wardId) === String(w.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-medium">{w.name}</span>
                                <span className="ml-2 text-muted-foreground text-sm">
                                  ({w.code})
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {capacity > 0 && String(wardId) === String(w.id)
                                    ? `${capacity} beds`
                                    : ""}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-8 gap-1.5 text-xs">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date().toLocaleDateString("en-LK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                  {ward && (
                    <Badge className={statusConfig[status].className + " h-8 text-xs"}>
                      {statusConfig[status].label}
                    </Badge>
                  )}
                </div>
              </div>

              {ward && (
                <p className="text-label text-muted-foreground">
                  Capacity: {capacity}
                </p>
              )}
            </CardContent>
          </Card>

          {!ward && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                {loading ? "Loading wards..." : "Select a ward above to begin entering census data."}
              </CardContent>
            </Card>
          )}

          {ward && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-heading-sm">Patient Counts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overCapacity && (
                    <div className="flex items-center gap-2 rounded-lg bg-error-bg border border-destructive/30 px-4 py-3 text-destructive text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Patient count exceeds ward capacity of {capacity}!
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {DIET_FIELDS.map((field) => {
                      const idx = refIdx++;
                      return (
                        <div key={field.key} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-label font-semibold">{field.label}</Label>
                            {field.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top">{field.tooltip}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <NumField
                            value={diets[field.key] || 0}
                            onChange={(v) => !isReadOnly && setDiets((d) => ({ ...d, [field.key]: v }))}
                            onEnter={() => focusNext(idx)}
                            inputRef={registerRef(idx)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-body font-bold text-foreground">Total Patients</span>
                      <span
                        className={`text-heading-sm font-bold ${
                          overCapacity ? "text-destructive" : "text-primary"
                        }`}
                      >
                        {totalPatients} / {capacity}
                      </span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-heading-sm">Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: "soup", label: "Soup" },
                      { key: "kanda", label: "Kanda" },
                      { key: "polSambola", label: "Pol Sambola" },
                    ].map((item) => {
                      const idx = refIdx++;
                      return (
                        <div key={item.key} className="space-y-1.5">
                          <Label className="text-label font-semibold">{item.label}</Label>
                          <NumField
                            value={special[item.key] || 0}
                            onChange={(v) => !isReadOnly && setSpecial((s) => ({ ...s, [item.key]: v }))}
                            onEnter={() => focusNext(idx)}
                            inputRef={registerRef(idx)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-heading-sm">Extra Items</CardTitle>
                        {extrasOpen ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1fr_100px_60px] gap-2 bg-muted px-4 py-2 text-label font-semibold text-muted-foreground">
                          <span>Item</span>
                          <span className="text-center">Qty</span>
                          <span className="text-center">Unit</span>
                        </div>

                        {extraItemsMaster.map((item) => {
                          const idx = refIdx++;
                          return (
                            <div
                              key={item.id}
                              className="grid grid-cols-[1fr_100px_60px] gap-2 px-4 py-2 border-t items-center"
                            >
                              <span className="text-body">{item.name}</span>
                              <NumField
                                value={extras[item.name] || 0}
                                onChange={(v) =>
                                  !isReadOnly && setExtras((e) => ({ ...e, [item.name]: v }))
                                }
                                onEnter={() => focusNext(idx)}
                                inputRef={registerRef(idx)}
                                className="w-full"
                              />
                              <span className="text-label text-muted-foreground text-center">
                                {item.unit}
                              </span>
                            </div>
                          );
                        })}

                        {customExtras.map((item, i) => (
                          <div
                            key={`custom-${i}`}
                            className="grid grid-cols-[1fr_100px_60px] gap-2 px-4 py-2 border-t items-center bg-accent/30"
                          >
                            <span className="text-body">{item.name}</span>
                            <NumField
                              value={item.quantity}
                              onChange={(v) =>
                                !isReadOnly &&
                                setCustomExtras((prev) =>
                                  prev.map((ce, j) => (j === i ? { ...ce, quantity: v } : ce))
                                )
                              }
                              className="w-full"
                            />
                            <span className="text-label text-muted-foreground text-center">
                              {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {!isReadOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 touch-target"
                          onClick={() => setAddItemOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Custom Item
                        </Button>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {!isReadOnly && (
                <div className="fixed bottom-0 left-0 right-0 md:static bg-card border-t md:border-0 p-4 md:p-0 flex gap-3 z-30">
                  <Button
                    variant="outline"
                    className="h-12 touch-target"
                    disabled={!wardId || savingDraft}
                    onClick={saveDraft}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingDraft ? "Saving..." : "Save Draft"}
                  </Button>

                  <Button
                    className="flex-1 md:flex-none h-12 touch-target text-body font-semibold"
                    disabled={overCapacity || totalPatients === 0 || submitting}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Ward Data"}
                  </Button>
                </div>
              )}

              {isReadOnly && (
                <div className="rounded-lg bg-accent border border-primary/20 px-4 py-3 text-sm font-medium text-accent-foreground">
                  This ward's census has been submitted and is locked for today.
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Staff Meal Counts for Today</CardTitle>
              <p className="text-label text-muted-foreground mt-1">
                Enter total staff meal counts (not per-ward).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {["breakfast", "lunch", "dinner"].map((meal) => (
                  <div key={meal} className="space-y-2 text-center">
                    <Label className="text-label font-semibold capitalize text-lg">{meal}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={staffMeals[meal] || ""}
                      onChange={(e) =>
                        !staffSubmitted &&
                        setStaffMeals((s) => ({
                          ...s,
                          [meal]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="h-14 text-2xl text-center touch-target font-bold"
                      disabled={staffSubmitted}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-badge-hospital text-primary-foreground px-3 py-1">
                  Staff Cycle: Chicken
                </Badge>
              </div>

              {staffSubmitted ? (
                <div className="rounded-lg bg-accent border border-primary/20 px-4 py-3 text-sm font-medium text-accent-foreground">
                  ✅ Staff meals submitted for today.
                </div>
              ) : (
                <Button
                  className="h-12 px-8 touch-target text-body font-semibold"
                  onClick={handleSubmitStaff}
                  disabled={staffMeals.breakfast + staffMeals.lunch + staffMeals.dinner === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Staff Meals
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Census Data</DialogTitle>
            <DialogDescription>
              Once submitted, {ward?.name}'s data will be locked for today. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="touch-target">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="touch-target">
              Yes, Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Extra Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-label font-semibold">Item Name</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                className="h-11 text-input"
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-label font-semibold">Quantity</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={newItem.quantity || ""}
                  onChange={(e) =>
                    setNewItem((n) => ({
                      ...n,
                      quantity: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="h-11 text-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-label font-semibold">Unit</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 w-full justify-between text-input">
                      {newItem.unit}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1">
                    {["Pcs", "g", "kg", "ml", "L", "Fruit"].map((u) => (
                      <Button
                        key={u}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setNewItem((n) => ({ ...n, unit: u }))}
                      >
                        {u}
                      </Button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setAddItemOpen(false)} className="touch-target">
              Cancel
            </Button>
            <Button onClick={handleAddCustomItem} disabled={!newItem.name.trim()} className="touch-target">
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CensusEntryPage;