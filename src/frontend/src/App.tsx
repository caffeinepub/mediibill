import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { ClientsPage } from "./pages/ClientsPage";
import { CreateInvoicePage } from "./pages/CreateInvoicePage";
import { DashboardPage } from "./pages/DashboardPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { MedicinesPage } from "./pages/MedicinesPage";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AppLayout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients",
  component: ClientsPage,
});

const medicinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/medicines",
  component: MedicinesPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices",
  component: InvoicesPage,
});

const createInvoiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices/new",
  component: CreateInvoicePage,
});

function InvoiceDetailRouteComponent() {
  const { id } = invoiceDetailRoute.useParams();
  return <InvoiceDetailPage id={id} />;
}

const invoiceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices/$id",
  component: InvoiceDetailRouteComponent,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  clientsRoute,
  medicinesRoute,
  invoicesRoute,
  createInvoiceRoute,
  invoiceDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
