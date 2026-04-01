import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

// 👇 Upgraded to use rich theme colors and locked hover states
const STATUS_STYLES = {
  draft: "bg-muted text-muted-foreground hover:bg-muted border-transparent font-medium",
  pending: "bg-warning-bg text-warning hover:bg-warning-bg border-transparent font-medium",
  approved: "bg-success text-success-foreground hover:bg-success border-transparent font-medium",
  rejected: "bg-error-bg text-destructive hover:bg-error-bg border-transparent font-medium",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPo = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch order");
        setPo(data.po);
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPo();
  }, [id, toast]);

  const toggleSection = (catId) => {
    setOpenSections((p) => ({ ...p, [catId]: !p[catId] }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");

      toast({ title: "Order Submitted", description: "Purchase order submitted for approval." });
      setShowSubmitDialog(false);
      navigate("/orders");
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevise = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/revise`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to revise");

      toast({ title: "Order Revised", description: "Purchase order returned to draft for editing." });
      // Refresh
      const refreshRes = await fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() });
      const refreshData = await refreshRes.json();
      setPo(refreshData.po);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading order details...</span>
      </div>
    );
  }

  if (!po) {
    return <div className="text-center py-16 text-lg text-muted-foreground">Purchase order not found.</div>;
  }

  const grandTotal = (po.categories || []).reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + (i.totalPrice || 0), 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-heading-lg font-bold text-foreground">Order: {po.billNumber}</h1>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-muted-foreground bg-muted px-4 py-2 rounded-lg">{po.date}</span>
          <Badge className={cn("text-base px-4 py-2", STATUS_STYLES[po.status] || "bg-muted text-muted-foreground")}>
            {po.status?.charAt(0).toUpperCase() + po.status?.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Rejection reason banner */}
      {po.status === "rejected" && po.rejectionReason && (
        <Card className="border-destructive/40 bg-error-bg">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-bold text-destructive">Rejected by Accountant</p>
                <p className="text-base text-destructive/80 mt-1 font-medium">{po.rejectionReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category sections */}
      {(po.categories || []).map((cat) => {
        const catTotal = cat.items.reduce((s, i) => s + (i.totalPrice || 0), 0);
        const isOpen = openSections[cat.id] ?? true;

        // 👇 Auto-Sort Items Alphabetically
        const sortedItems = [...cat.items].sort((a, b) => (a.nameEn || "").localeCompare(b.nameEn || ""));

        return (
          <Collapsible key={cat.id} open={isOpen} onOpenChange={() => toggleSection(cat.id)}>
            <Card className="border-primary/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-heading-sm flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                      {cat.id}. {cat.name}
                    </CardTitle>
                    <span className="text-xl font-bold text-primary">
                      Rs. {catTotal.toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 px-0 sm:px-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {/* 👇 Upgraded Header Typography */}
                      <TableRow className="text-lg">
                        <TableHead className="w-12 text-center font-semibold text-foreground py-4">#</TableHead>
                        <TableHead className="font-semibold text-foreground py-4 text-center">Item (SI)</TableHead>
                        <TableHead className="hidden lg:table-cell font-semibold text-foreground py-4 text-center">Item (EN)</TableHead>
                        <TableHead className="font-semibold text-foreground text-center py-4">Unit</TableHead>
                        <TableHead className="text-center font-semibold text-foreground py-4 w-12">B</TableHead>
                        <TableHead className="text-center font-semibold text-foreground py-4 w-12">L</TableHead>
                        <TableHead className="text-center font-semibold text-foreground py-4 w-12">D</TableHead>
                        <TableHead className="text-right font-semibold text-foreground py-4">Qty</TableHead>
                        <TableHead className="text-right font-semibold text-foreground py-4 w-36">Price (Rs)</TableHead>
                        <TableHead className="text-right font-semibold text-foreground py-4">Total (Rs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 👇 Upgraded Row Typography */}
                      {sortedItems.map((item, idx) => (
                        <TableRow key={item.id} className={cn("text-lg hover:bg-muted/30 transition-colors", item.isPriceChanged ? "bg-warning/5" : "")}>
                          <TableCell className="text-center text-muted-foreground py-4">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-center py-4">{item.nameSi}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-center py-4">{item.nameEn}</TableCell>
                          <TableCell className="text-muted-foreground text-center py-4">{item.unit}</TableCell>
                          <TableCell className="text-center py-4">
                            {item.forBreakfast ? <Check className="h-5 w-5 text-primary mx-auto" /> : ""}
                          </TableCell>
                          <TableCell className="text-center py-4">
                            {item.forLunch ? <Check className="h-5 w-5 text-primary mx-auto" /> : ""}
                          </TableCell>
                          <TableCell className="text-center py-4">
                            {item.forDinner ? <Check className="h-5 w-5 text-primary mx-auto" /> : ""}
                          </TableCell>
                          <TableCell className="text-right font-bold py-4 text-foreground">{item.quantity}</TableCell>
                          <TableCell className={cn("text-right py-4", item.isPriceChanged ? "bg-warning/10 font-medium" : "text-muted-foreground")}>
                            <div className="flex items-center justify-end gap-2">
                              {item.isPriceChanged && <AlertTriangle className="h-4 w-4 text-warning" title="Price updated during order generation" />}
                              <span>Rs. {item.unitPrice.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary py-4">
                            Rs. {item.totalPrice.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Grand Total */}
      <Card className="bg-primary/10 border-primary/30 shadow-md">
        <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-heading-sm font-bold text-foreground">Grand Total</span>
          <span className="text-heading-lg font-bold text-primary">Rs. {grandTotal.toLocaleString()}</span>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 sticky bottom-0 bg-background/95 backdrop-blur py-5 border-t-2 border-primary/10 -mx-4 px-4 md:-mx-6 md:px-6 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-40">
        <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold touch-target" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>

        {po.status === "draft" && (
          <Button size="lg" className="h-14 px-10 text-lg font-bold touch-target shadow-md hover:shadow-lg transition-all" onClick={() => setShowSubmitDialog(true)}>
            Submit for Approval
          </Button>
        )}

        {po.status === "rejected" && (
          <Button variant="destructive" size="lg" className="h-14 px-10 text-lg font-bold touch-target shadow-md hover:shadow-lg transition-all" onClick={handleRevise}>
            Revise & Return to Draft
          </Button>
        )}

        {po.status === "approved" && (
          <Badge className="bg-success/20 text-success text-lg px-6 py-3 font-semibold justify-center flex items-center h-14">
            Approved by {po.reviewedByName || "Accountant"}
          </Badge>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Submit Purchase Order?</DialogTitle>
          </DialogHeader>
          <p className="text-lg text-muted-foreground mt-2">
            This will send the purchase order for accountant approval.
            You won't be able to edit after submission.
          </p>
          <DialogFooter className="mt-4 gap-3">
            <Button variant="outline" className="h-12 px-6 text-base" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button className="h-12 px-8 text-base font-bold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;