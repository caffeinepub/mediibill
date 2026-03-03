import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Calculator, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { InvoiceStatus } from "../backend.d";
import type { InvoiceLineItem } from "../backend.d";
import {
  useCreateInvoice,
  useGetAllClients,
  useGetAllMedicines,
} from "../hooks/useQueries";
import { dateInputToTime, formatCurrency } from "../lib/formatters";

interface LineItemForm {
  _key: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultDueDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { data: clients } = useGetAllClients();
  const { data: medicines } = useGetAllMedicines();
  const createInvoice = useCreateInvoice();

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(getTodayStr());
  const [dueDate, setDueDate] = useState(getDefaultDueDateStr());
  const [taxRate, setTaxRate] = useState(10);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      _key: crypto.randomUUID(),
      medicineId: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
    },
  ]);

  const medicineMap = useMemo(
    () => new Map(medicines?.map((m) => [m.id, m]) ?? []),
    [medicines],
  );

  function updateLineItem(
    index: number,
    field: Exclude<keyof LineItemForm, "_key">,
    value: string | number,
  ) {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "medicineId") {
          const med = medicineMap.get(value as string);
          updated.unitPrice = med?.unitPrice ?? 0;
          updated.lineTotal = updated.quantity * updated.unitPrice;
        } else if (field === "quantity") {
          updated.lineTotal = Number(value) * updated.unitPrice;
        }
        return updated;
      }),
    );
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        medicineId: "",
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
      },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subTotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const taxAmount = subTotal * (taxRate / 100);
  const totalAmount = subTotal + taxAmount;

  async function handleSave(status: InvoiceStatus) {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (lineItems.length === 0 || lineItems.every((li) => !li.medicineId)) {
      toast.error("Please add at least one line item");
      return;
    }

    const validItems = lineItems.filter((li) => li.medicineId);

    try {
      const id = crypto.randomUUID();
      const invoiceLineItems: InvoiceLineItem[] = validItems.map((li) => ({
        medicineId: li.medicineId,
        quantity: BigInt(li.quantity),
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
      }));

      await createInvoice.mutateAsync({
        id,
        clientId,
        status,
        issueDate: dateInputToTime(issueDate),
        dueDate: dateInputToTime(dueDate),
        lineItems: invoiceLineItems,
        subTotal,
        taxAmount,
        taxRate,
        totalAmount,
      });

      toast.success(
        status === InvoiceStatus.draft
          ? "Invoice saved as draft"
          : "Invoice sent",
      );
      navigate({ to: "/invoices" });
    } catch {
      toast.error("Failed to create invoice");
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/invoices">
          <Button
            variant="ghost"
            size="icon"
            data-ocid="create_invoice.back.button"
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            New Invoice
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client & Dates */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold">
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger
                    data-ocid="create_invoice.client.select"
                    className="bg-input border-border"
                  >
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="issue-date">Issue Date *</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    data-ocid="create_invoice.issue_date.input"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due-date">Due Date *</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    data-ocid="create_invoice.due_date.input"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) =>
                    setTaxRate(Number.parseFloat(e.target.value) || 0)
                  }
                  data-ocid="create_invoice.tax_rate.input"
                  className="font-mono w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                Line Items
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                data-ocid="create_invoice.add_line_item.button"
                className="gap-1.5 h-7 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items yet. Add a medicine to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    <div className="col-span-5">Medicine</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1" />
                  </div>
                  {lineItems.map((item, index) => (
                    <div
                      key={item._key}
                      data-ocid={`create_invoice.line_item.${index + 1}`}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <Select
                          value={item.medicineId}
                          onValueChange={(v) =>
                            updateLineItem(index, "medicineId", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-input border-border">
                            <SelectValue placeholder="Select medicine..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(medicines ?? []).map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <span className="truncate">{m.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "quantity",
                              Number.parseInt(e.target.value) || 1,
                            )
                          }
                          className="h-8 text-xs text-center font-mono"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="number-cell text-xs text-muted-foreground">
                          {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="number-cell text-xs font-semibold text-foreground">
                          {formatCurrency(item.lineTotal)}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(index)}
                          data-ocid={`create_invoice.remove_line_item.${index + 1}`}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="border border-border bg-card sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="number-cell font-medium">
                    {formatCurrency(subTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Tax ({taxRate}%)
                  </span>
                  <span className="number-cell text-muted-foreground">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="number-cell text-xl font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => handleSave(InvoiceStatus.sent)}
                  disabled={createInvoice.isPending}
                  data-ocid="create_invoice.send.primary_button"
                  className="w-full"
                >
                  {createInvoice.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(InvoiceStatus.draft)}
                  disabled={createInvoice.isPending}
                  data-ocid="create_invoice.save_draft.secondary_button"
                  className="w-full"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
