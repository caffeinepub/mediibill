import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { InvoiceStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { useGetAllClients, useGetAllInvoices } from "../hooks/useQueries";
import { formatCurrency, formatDate, shortInvoiceId } from "../lib/formatters";

const STATUS_FILTERS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: InvoiceStatus.draft, label: "Draft" },
  { value: InvoiceStatus.sent, label: "Sent" },
  { value: InvoiceStatus.paid, label: "Paid" },
  { value: InvoiceStatus.overdue, label: "Overdue" },
];

export function InvoicesPage() {
  const { data: invoices, isLoading } = useGetAllInvoices();
  const { data: clients } = useGetAllClients();
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    "all",
  );

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  const filtered = (invoices ?? [])
    .filter((inv) => statusFilter === "all" || inv.status === statusFilter)
    .sort((a, b) => Number(b.issueDate - a.issueDate));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices?.length ?? 0} total invoices
          </p>
        </div>
        <Link to="/invoices/new">
          <Button data-ocid="invoices.create.primary_button" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as "all" | InvoiceStatus)}
      >
        <TabsList className="bg-muted/30 border border-border h-9">
          {STATUS_FILTERS.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              data-ocid={`invoices.${f.value}.tab`}
              className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {f.label}
              {f.value !== "all" && invoices && (
                <span className="ml-1.5 text-muted-foreground">
                  {invoices.filter((i) => i.status === f.value).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {isLoading ? (
          <div data-ocid="invoices.loading_state" className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="invoices.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {statusFilter !== "all"
                ? `No ${statusFilter} invoices`
                : "No invoices yet"}
            </p>
            {statusFilter === "all" && (
              <Link to="/invoices/new">
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="invoices.empty.create.button"
                  className="mt-3"
                >
                  Create your first invoice
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, index) => {
                  const client = clientMap.get(inv.clientId);
                  return (
                    <tr
                      key={inv.id}
                      data-ocid={`invoices.item.${index + 1}`}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/invoices/$id"
                          params={{ id: inv.id }}
                          className="font-mono text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          {shortInvoiceId(inv.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-foreground/80 truncate max-w-[160px] block">
                          {client?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(inv.issueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="number-cell text-sm font-semibold text-foreground">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/invoices/$id" params={{ id: inv.id }}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
