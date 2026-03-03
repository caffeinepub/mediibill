import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import {
  useDeleteInvoice,
  useGetAllClients,
  useGetAllMedicines,
  useGetInvoice,
  useRecordPayment,
  useUpdateInvoiceStatus,
} from "../hooks/useQueries";
import {
  dateInputToTime,
  formatCurrency,
  formatDate,
  shortInvoiceId,
} from "../lib/formatters";

const ALL_STATUSES = [
  InvoiceStatus.draft,
  InvoiceStatus.sent,
  InvoiceStatus.paid,
  InvoiceStatus.overdue,
];

interface InvoiceDetailPageProps {
  id: string;
}

export function InvoiceDetailPage({ id }: InvoiceDetailPageProps) {
  const navigate = useNavigate();
  const { data: invoice, isLoading: invLoading } = useGetInvoice(id);
  const { data: clients } = useGetAllClients();
  const { data: medicines } = useGetAllMedicines();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const recordPayment = useRecordPayment();

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payNotes, setPayNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const client = clients?.find((c) => c.id === invoice?.clientId);
  const medicineMap = new Map(medicines?.map((m) => [m.id, m]) ?? []);

  async function handleMarkPaid() {
    if (!invoice) return;
    try {
      await Promise.all([
        recordPayment.mutateAsync({
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          paymentDate: dateInputToTime(payDate),
          notes: payNotes,
        }),
        updateStatus.mutateAsync({
          invoiceId: invoice.id,
          status: InvoiceStatus.paid,
        }),
      ]);
      toast.success("Invoice marked as paid");
      setPayDialogOpen(false);
    } catch {
      toast.error("Failed to record payment");
    }
  }

  async function handleStatusChange(status: InvoiceStatus) {
    if (!invoice) return;
    try {
      await updateStatus.mutateAsync({ invoiceId: invoice.id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    try {
      await deleteInvoice.mutateAsync(invoice.id);
      toast.success("Invoice deleted");
      navigate({ to: "/invoices" });
    } catch {
      toast.error("Failed to delete invoice");
    }
  }

  if (invLoading) {
    return (
      <div data-ocid="invoice_detail.loading_state" className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div
        data-ocid="invoice_detail.error_state"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <p className="text-sm text-muted-foreground">Invoice not found</p>
        <Link to="/invoices">
          <Button variant="outline" size="sm" className="mt-3">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const isProcessing = updateStatus.isPending || recordPayment.isPending;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/invoices">
            <Button
              variant="ghost"
              size="icon"
              data-ocid="invoice_detail.back.button"
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight font-mono">
                {shortInvoiceId(invoice.id)}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Issued {formatDate(invoice.issueDate)} · Due{" "}
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status !== InvoiceStatus.paid && (
            <Button
              onClick={() => setPayDialogOpen(true)}
              data-ocid="invoice_detail.mark_paid.primary_button"
              className="gap-2"
              size="sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark as Paid
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-ocid="invoice_detail.status.dropdown_menu"
                className="gap-1.5"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Edit Status
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_STATUSES.filter((s) => s !== invoice.status).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="capitalize"
                >
                  Set as {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            data-ocid="invoice_detail.delete.delete_button"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Invoice Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client Info */}
          {client && (
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {client.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.contactPerson}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {client.email}
                    </p>
                    {client.address && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.address}
                      </p>
                    )}
                    {client.taxId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Tax ID: {client.taxId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-xs font-mono text-foreground/80">
                      {client.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border border-border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="text-sm font-mono font-medium">
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-mono font-medium">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="border border-border bg-card">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <h3 className="font-display font-semibold text-sm">
                  Line Items
                </h3>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Medicine
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, i) => {
                      const med = medicineMap.get(item.medicineId);
                      return (
                        <tr
                          key={`${item.medicineId}-${i}`}
                          data-ocid={`invoice_detail.line_item.${i + 1}`}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-foreground/90 text-sm">
                              {med?.name ?? item.medicineId}
                            </div>
                            {med && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                {med.sku} · {med.unitOfMeasure}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="number-cell text-sm">
                              {Number(item.quantity)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="number-cell text-sm text-muted-foreground">
                              {formatCurrency(item.unitPrice)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="number-cell text-sm font-semibold">
                              {formatCurrency(item.lineTotal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Totals */}
        <div>
          <Card className="border border-border bg-card sticky top-20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display font-semibold text-sm mb-2">
                Invoice Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="number-cell font-medium">
                    {formatCurrency(invoice.subTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({invoice.taxRate}%)
                  </span>
                  <span className="number-cell text-muted-foreground">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="number-cell text-2xl font-bold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark as Paid Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent
          data-ocid="invoice_detail.pay.dialog"
          className="max-w-sm bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">Payment Date</Label>
              <Input
                id="pay-date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                data-ocid="invoice_detail.pay_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-notes">Notes (optional)</Label>
              <Textarea
                id="pay-notes"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Payment reference, method, etc."
                data-ocid="invoice_detail.pay_notes.textarea"
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="number-cell font-bold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
              data-ocid="invoice_detail.pay.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={recordPayment.isPending || updateStatus.isPending}
              data-ocid="invoice_detail.pay.confirm_button"
            >
              {recordPayment.isPending || updateStatus.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          data-ocid="invoice_detail.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {shortInvoiceId(invoice.id)}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="invoice_detail.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="invoice_detail.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoice.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
