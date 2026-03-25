import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Fetch only approved purchase orders to act as invoices
        const res = await fetch(`${API_BASE}/orders?status=approved`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load invoices");

        setInvoices(data.orders || []);
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading invoices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-heading-md font-bold text-foreground">Invoices</h1>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Supplier</TableHead>
                <TableHead className="text-right">Grand Total (Rs)</TableHead>
                <TableHead className="hidden sm:table-cell">Approved By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                // Use revised total if the accountant changed prices, otherwise original
                const finalTotal = inv.revisedTotal !== null ? inv.revisedTotal : inv.originalTotal;

                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.billNumber}</TableCell>
                    <TableCell>{inv.poDate || inv.date}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                      Manager, MPCS Ltd, Gampaha
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rs. {Number(finalTotal).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {inv.reviewedByName || "Accountant"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)} className="touch-target">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="touch-target">
                          <Printer className="h-4 w-4" onClick={() => navigate(`/invoices/${inv.id}`)} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No generated invoices found. Approve a Purchase Order first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;