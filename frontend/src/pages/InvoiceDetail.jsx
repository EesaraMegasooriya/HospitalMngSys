import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:5050/api";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${id}`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch invoice");

        const po = data.po;

        // Group individual items into a clean Category Summary for the invoice
        const summaryMap = {};
        (po.items || []).forEach((item) => {
          const catName = item.categoryName || "Uncategorized";
          // Use revised pricing if accountant updated it
          const itemTotal = item.revisedTotal !== null ? Number(item.revisedTotal) : Number(item.totalPrice);
          
          if (!summaryMap[catName]) summaryMap[catName] = 0;
          summaryMap[catName] += itemTotal;
        });

        const summaryArray = Object.keys(summaryMap).map((catName, idx) => ({
          id: idx + 1,
          name: catName,
          total: Math.round(summaryMap[catName] * 100) / 100,
        }));

        setCategorySummary(summaryArray);
        setInvoice(po);
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading invoice details...</span>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-12 text-muted-foreground">Invoice not found.</div>;
  }

  const grandTotal = invoice.revisedTotal !== null ? Number(invoice.revisedTotal) : Number(invoice.originalTotal);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate("/invoices")} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-heading-md font-bold text-foreground">INVOICE</h1>
            <p className="text-muted-foreground text-sm">Gampaha District General Hospital</p>
          </div>

          <div className="flex justify-between items-start pt-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">To</p>
              <p className="font-semibold text-body">Manager,</p>
              <p className="text-muted-foreground">Multi Purpose Co-operative Society Ltd,</p>
              <p className="text-muted-foreground">Gampaha.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Invoice Details</p>
              <p className="text-body"><span className="font-semibold">Bill No:</span> {invoice.billNumber}</p>
              <p className="text-body"><span className="font-semibold">Date:</span> {invoice.poDate || invoice.date}</p>
              <p className="text-body"><span className="font-semibold">Status:</span> <span className="uppercase text-primary">{invoice.status}</span></p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Invoice Description (Category)</TableHead>
                <TableHead className="text-right">Total Price (Rs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorySummary.map((cs) => (
                <TableRow key={cs.id}>
                  <TableCell className="text-muted-foreground">{cs.id}</TableCell>
                  <TableCell className="font-medium">{cs.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {cs.total > 0 ? `Rs. ${cs.total.toLocaleString()}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center print:bg-transparent print:border-t-2 print:border-b-2 print:border-x-0 print:rounded-none">
            <p className="text-sm text-primary font-medium print:text-black">GRAND TOTAL</p>
            <p className="text-2xl font-bold text-primary print:text-black">Rs. {grandTotal.toLocaleString()}</p>
          </div>

          <Separator className="print:hidden" />

          <div className="text-center text-sm text-muted-foreground pt-8 space-y-4">
            <div className="flex justify-between mt-16 px-8">
               <div className="space-y-2 text-center">
                  <div className="border-t border-dashed w-48 border-gray-400"></div>
                  <p className="font-semibold text-black">Prepared By</p>
                  <p className="text-xs">{invoice.createdByName || "Subject Clerk"}</p>
               </div>
               <div className="space-y-2 text-center">
                  <div className="border-t border-dashed w-48 border-gray-400"></div>
                  <p className="font-semibold text-black">Approved By</p>
                  <p className="text-xs">{invoice.reviewedByName || "Accountant"}</p>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;