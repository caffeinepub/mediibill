import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Medicine {
    id: string;
    sku: string;
    unitOfMeasure: string;
    name: string;
    category: string;
    unitPrice: number;
}
export interface Payment {
    invoiceId: string;
    notes: string;
    paymentDate: Time;
    amount: number;
}
export interface Invoice {
    id: string;
    issueDate: Time;
    status: InvoiceStatus;
    lineItems: Array<InvoiceLineItem>;
    clientId: string;
    dueDate: Time;
    subTotal: number;
    totalAmount: number;
    taxAmount: number;
    taxRate: number;
}
export interface Client {
    id: string;
    taxId: string;
    name: string;
    contactPerson: string;
    email: string;
    address: string;
    phone: string;
}
export interface UserProfile {
    name: string;
}
export interface InvoiceLineItem {
    lineTotal: number;
    quantity: bigint;
    unitPrice: number;
    medicineId: string;
}
export enum InvoiceStatus {
    paid = "paid",
    sent = "sent",
    overdue = "overdue",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClient(client: Client): Promise<void>;
    createInvoice(invoice: Invoice): Promise<void>;
    createMedicine(medicine: Medicine): Promise<void>;
    deleteClient(id: string): Promise<void>;
    deleteInvoice(id: string): Promise<void>;
    deleteMedicine(id: string): Promise<void>;
    getAllClients(): Promise<Array<Client>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllMedicines(): Promise<Array<Medicine>>;
    getAllPayments(): Promise<Array<Payment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(id: string): Promise<Client>;
    getDashboardStats(): Promise<{
        overdueCount: bigint;
        totalRevenue: number;
        pendingAmount: number;
        paidCount: bigint;
        totalInvoices: bigint;
    }>;
    getInvoice(id: string): Promise<Invoice>;
    getMedicine(id: string): Promise<Medicine>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordPayment(payment: Payment): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedSampleData(): Promise<void>;
    updateClient(client: Client): Promise<void>;
    updateInvoice(invoice: Invoice): Promise<void>;
    updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void>;
    updateMedicine(medicine: Medicine): Promise<void>;
}
