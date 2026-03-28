import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, Loader2, FileText } from "lucide-react";
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
        // Fetch ALL orders
        const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load invoices");

        // Filter to keep a permanent history of anything that was approved and sent to the supplier
        const history = (data.orders || []).filter(order => 
          ['approved', 'partially_delivered', 'delivered'].includes(order.status)
        );

        setInvoices(history);
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
        <span className="ml-3 text-muted-foreground">Loading invoice history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-md font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Supplier Invoice History
        </h1>
      </div>
      
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Supplier</TableHead>
                <TableHead className="text-right">Grand Total (Rs)</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell>
                      {inv.status === 'approved' && <Badge variant="outline" className="text-blue-600 border-blue-600">Sent to Supplier</Badge>}
                      {inv.status === 'delivered' && <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Delivered</Badge>}
                      {inv.status === 'partially_delivered' && <Badge variant="outline" className="text-warning border-warning">Partial Delivery</Badge>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {inv.reviewedByName || "Accountant"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}`)} className="touch-target">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate(`/invoices/${inv.id}`)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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