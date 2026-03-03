import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  useGetAllClients,
  useGetAllInvoices,
  useGetDashboardStats,
  useSeedSampleData,
} from "../hooks/useQueries";
import { formatCurrency, formatDate, shortInvoiceId } from "../lib/formatters";

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: invoices, isLoading: invoicesLoading } = useGetAllInvoices();
  const { data: clients } = useGetAllClients();
  const seedMutation = useSeedSampleData();

  const {
    isPending: seedPending,
    isSuccess: seedSuccess,
    mutate: seedMutate,
  } = seedMutation;

  // Seed on first load if empty
  const trySeed = useCallback(() => {
    if (invoices && invoices.length === 0 && !seedPending && !seedSuccess) {
      seedMutate();
    }
  }, [invoices, seedPending, seedSuccess, seedMutate]);

  useEffect(() => {
    trySeed();
  }, [trySeed]);

  const recentInvoices = invoices
    ? [...invoices]
        .sort((a, b) => Number(b.issueDate - a.issueDate))
        .slice(0, 8)
    : [];

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  const kpiCards = [
    {
      title: "Total Invoices",
      value: statsLoading ? null : Number(stats?.totalInvoices ?? 0),
      icon: FileText,
      format: (v: number) => v.toString(),
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
      ocid: "dashboard.total_invoices.card",
    },
    {
      title: "Total Revenue",
      value: statsLoading ? null : (stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      format: (v: number) => formatCurrency(v),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      ocid: "dashboard.total_revenue.card",
    },
    {
      title: "Pending Amount",
      value: statsLoading ? null : (stats?.pendingAmount ?? 0),
      icon: DollarSign,
      format: (v: number) => formatCurrency(v),
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      ocid: "dashboard.pending_amount.card",
    },
    {
      title: "Overdue",
      value: statsLoading ? null : Number(stats?.overdueCount ?? 0),
      icon: AlertTriangle,
      format: (v: number) => v.toString(),
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      ocid: "dashboard.overdue.card",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your billing operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            data-ocid={card.ocid}
            className={`border ${card.bg} bg-card`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                    {card.title}
                  </p>
                  {card.value === null ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p
                      className={`text-2xl font-mono font-bold ${card.color} tracking-tight`}
                    >
                      {card.format(card.value)}
                    </p>
                  )}
                </div>
                <div
                  className={`p-2 rounded-lg border ${card.bg} flex-shrink-0`}
                >
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seed loading indicator */}
      {seedMutation.isPending && (
        <div
          data-ocid="dashboard.loading_state"
          className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg px-4 py-2.5 border border-border"
        >
          <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          Loading sample data...
        </div>
      )}

      {/* Recent Invoices */}
      <Card className="border border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base font-semibold">
            Recent Invoices
          </CardTitle>
          <Link
            to="/invoices"
            data-ocid="dashboard.invoices.link"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesLoading ? (
            <div
              data-ocid="dashboard.invoices.loading_state"
              className="p-4 space-y-3"
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recentInvoices.length === 0 ? (
            <div
              data-ocid="dashboard.invoices.empty_state"
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <FileText className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
              <Link
                to="/invoices/new"
                data-ocid="dashboard.create_invoice.link"
                className="mt-2 text-xs text-primary hover:underline"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Client
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Due Date
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv, index) => {
                    const client = clientMap.get(inv.clientId);
                    return (
                      <tr
                        key={inv.id}
                        data-ocid={`dashboard.invoice.item.${index + 1}`}
                        className="border-b border-border/60 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
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
                          <span className="text-foreground/80 text-xs truncate max-w-[140px] block">
                            {client?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-muted-foreground text-xs font-mono">
                            {formatDate(inv.dueDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="number-cell text-xs text-foreground font-semibold">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground/50">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
