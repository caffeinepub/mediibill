# MediiBill - Medicine B2B Billing Platform

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Dashboard**: Overview of total invoices, pending payments, paid invoices, and revenue summary.
- **Client Management**: Add, view, edit, and delete business clients (pharmacies, hospitals, clinics).
- **Product/Medicine Catalog**: Manage medicine inventory with name, SKU, unit price, and category.
- **Invoice Creation**: Create invoices for clients with line items (medicines, quantities, unit prices), auto-calculated subtotal, tax, and total.
- **Invoice List**: View all invoices with status (Draft, Sent, Paid, Overdue), filter by status and client.
- **Invoice Detail View**: View full invoice with line items, client info, issue date, due date, and payment status.
- **Payment Recording**: Mark invoices as paid with payment date and notes.
- **Sample Data**: Pre-populated sample clients, medicines, and invoices for demonstration.

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan
1. Backend (Motoko):
   - Data models: Client, Medicine, InvoiceItem, Invoice, Payment
   - CRUD for Clients: createClient, getClients, updateClient, deleteClient
   - CRUD for Medicines: createMedicine, getMedicines, updateMedicine, deleteMedicine
   - Invoice management: createInvoice, getInvoices, getInvoiceById, updateInvoiceStatus, deleteInvoice
   - Payment recording: recordPayment, getPaymentsByInvoice
   - Dashboard stats: getDashboardStats (total invoices, revenue, pending amount)
   - Sample data seeding on first load

2. Frontend (React + TypeScript):
   - Sidebar navigation: Dashboard, Clients, Medicines, Invoices
   - Dashboard page with KPI cards and recent invoices table
   - Clients page with list, add/edit modal
   - Medicines page with catalog list, add/edit modal
   - Invoices page with filterable list and status badges
   - Invoice detail/view page with print-friendly layout
   - Create Invoice page with dynamic line item builder
   - Mark as Paid dialog
