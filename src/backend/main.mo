import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type Client = {
    id : Text;
    name : Text;
    contactPerson : Text;
    email : Text;
    phone : Text;
    address : Text;
    taxId : Text;
  };

  module Client {
    public func compare(client1 : Client, client2 : Client) : Order.Order {
      Text.compare(client1.id, client2.id);
    };
  };

  let clients = Map.empty<Text, Client>();

  type Medicine = {
    id : Text;
    name : Text;
    sku : Text;
    category : Text;
    unitPrice : Float;
    unitOfMeasure : Text;
  };

  module Medicine {
    public func compare(medicine1 : Medicine, medicine2 : Medicine) : Order.Order {
      Text.compare(medicine1.id, medicine2.id);
    };
  };

  let medicines = Map.empty<Text, Medicine>();

  public type InvoiceStatus = {
    #draft;
    #sent;
    #paid;
    #overdue;
  };

  type InvoiceLineItem = {
    medicineId : Text;
    quantity : Nat;
    unitPrice : Float;
    lineTotal : Float;
  };

  module InvoiceLineItem {
    public func compare(item1 : InvoiceLineItem, item2 : InvoiceLineItem) : Order.Order {
      Text.compare(item1.medicineId, item2.medicineId);
    };
  };

  type Invoice = {
    id : Text;
    clientId : Text;
    issueDate : Time.Time;
    dueDate : Time.Time;
    status : InvoiceStatus;
    lineItems : [InvoiceLineItem];
    subTotal : Float;
    taxRate : Float;
    taxAmount : Float;
    totalAmount : Float;
  };

  module Invoice {
    public func compare(invoice1 : Invoice, invoice2 : Invoice) : Order.Order {
      Text.compare(invoice1.id, invoice2.id);
    };
  };

  let invoices = Map.empty<Text, Invoice>();

  type Payment = {
    invoiceId : Text;
    paymentDate : Time.Time;
    amount : Float;
    notes : Text;
  };

  module Payment {
    public func compare(payment1 : Payment, payment2 : Payment) : Order.Order {
      Text.compare(payment1.invoiceId, payment2.invoiceId);
    };
  };

  let payments = Map.empty<Text, Payment>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Client Management
  public shared ({ caller }) func createClient(client : Client) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create clients");
    };
    clients.add(client.id, client);
  };

  public query ({ caller }) func getClient(id : Text) : async Client {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };
    switch (clients.get(id)) {
      case (null) { Runtime.trap("Client does not exist") };
      case (?client) { client };
    };
  };

  public shared ({ caller }) func updateClient(client : Client) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update clients");
    };
    switch (clients.get(client.id)) {
      case (null) { Runtime.trap("Client does not exist") };
      case (?_) {
        clients.add(client.id, client);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete clients");
    };
    if (not clients.containsKey(id)) {
      Runtime.trap("Client does not exist");
    };
    clients.remove(id);
  };

  public query ({ caller }) func getAllClients() : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };
    clients.values().toArray().sort();
  };

  // Medicine Management
  public shared ({ caller }) func createMedicine(medicine : Medicine) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create medicines");
    };
    medicines.add(medicine.id, medicine);
  };

  public query ({ caller }) func getMedicine(id : Text) : async Medicine {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicines");
    };
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine does not exist") };
      case (?medicine) { medicine };
    };
  };

  public shared ({ caller }) func updateMedicine(medicine : Medicine) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update medicines");
    };
    switch (medicines.get(medicine.id)) {
      case (null) { Runtime.trap("Medicine does not exist") };
      case (?_) {
        medicines.add(medicine.id, medicine);
      };
    };
  };

  public shared ({ caller }) func deleteMedicine(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete medicines");
    };
    if (not medicines.containsKey(id)) {
      Runtime.trap("Medicine does not exist");
    };
    medicines.remove(id);
  };

  public query ({ caller }) func getAllMedicines() : async [Medicine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicines");
    };
    medicines.values().toArray().sort();
  };

  // Invoice Management
  public shared ({ caller }) func createInvoice(invoice : Invoice) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };
    invoices.add(invoice.id, invoice);
  };

  public query ({ caller }) func getInvoice(id : Text) : async Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    switch (invoices.get(id)) {
      case (null) { Runtime.trap("Invoice does not exist") };
      case (?invoice) { invoice };
    };
  };

  public shared ({ caller }) func updateInvoice(invoice : Invoice) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update invoices");
    };
    switch (invoices.get(invoice.id)) {
      case (null) { Runtime.trap("Invoice does not exist") };
      case (?_) {
        invoices.add(invoice.id, invoice);
      };
    };
  };

  public shared ({ caller }) func deleteInvoice(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete invoices");
    };
    if (not invoices.containsKey(id)) {
      Runtime.trap("Invoice does not exist");
    };
    invoices.remove(id);
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.values().toArray().sort();
  };

  public shared ({ caller }) func updateInvoiceStatus(invoiceId : Text, status : InvoiceStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update invoice status");
    };
    switch (invoices.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice does not exist") };
      case (?invoice) {
        let updatedInvoice = {
          invoice with
          status
        };
        invoices.add(invoiceId, updatedInvoice);
      };
    };
  };

  // Payment Management
  public shared ({ caller }) func recordPayment(payment : Payment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record payments");
    };
    switch (invoices.get(payment.invoiceId)) {
      case (null) { Runtime.trap("Invoice does not exist") };
      case (?invoice) {
        payments.add(payment.invoiceId, payment);
        let updatedInvoice = { invoice with status = #paid };
        invoices.add(payment.invoiceId, updatedInvoice);
      };
    };
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    payments.values().toArray().sort();
  };

  // Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async {
    totalInvoices : Nat;
    totalRevenue : Float;
    pendingAmount : Float;
    paidCount : Nat;
    overdueCount : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };

    var totalRevenue : Float = 0.0;
    var pendingAmount : Float = 0.0;
    var paidCount : Nat = 0;
    var overdueCount : Nat = 0;

    for (invoice in invoices.values()) {
      switch (invoice.status) {
        case (#paid) {
          totalRevenue += invoice.totalAmount;
          paidCount += 1;
        };
        case (#overdue) {
          pendingAmount += invoice.totalAmount;
          overdueCount += 1;
        };
        case (#sent or #draft) {
          pendingAmount += invoice.totalAmount;
        };
      };
    };

    {
      totalInvoices = invoices.size();
      totalRevenue;
      pendingAmount;
      paidCount;
      overdueCount;
    };
  };

  // Sample Data Seeding
  let sampleDataSeeded = Set.empty<Text>();

  public shared ({ caller }) func seedSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can seed sample data");
    };

    let seedKey = "sampleData";
    if (sampleDataSeeded.contains(seedKey)) {
      Runtime.trap("Sample data already seeded");
    };

    // Sample Clients
    let client1 : Client = {
      id = "1";
      name = "Pharmacy A";
      contactPerson = "John Doe";
      email = "john@pharmacy.com";
      phone = "1234567890";
      address = "123 Main St";
      taxId = "123456789";
    };

    let client2 : Client = {
      id = "2";
      name = "Hospital B";
      contactPerson = "Jane Smith";
      email = "jane@hospital.com";
      phone = "9876543210";
      address = "456 Elm St";
      taxId = "987654321";
    };

    clients.add(client1.id, client1);
    clients.add(client2.id, client2);

    // Sample Medicines
    let medicine1 : Medicine = {
      id = "1";
      name = "Aspirin";
      sku = "ASP100";
      category = "Pain Relief";
      unitPrice = 10.0;
      unitOfMeasure = "Box";
    };

    let medicine2 : Medicine = {
      id = "2";
      name = "Cough Syrup";
      sku = "COU200";
      category = "Cough";
      unitPrice = 15.0;
      unitOfMeasure = "Bottle";
    };

    medicines.add(medicine1.id, medicine1);
    medicines.add(medicine2.id, medicine2);

    // Sample Invoices
    let invoice1 : Invoice = {
      id = "1";
      clientId = "1";
      issueDate = 1711488000;
      dueDate = 1714099200;
      status = #sent;
      lineItems = [{
        medicineId = "1";
        quantity = 2;
        unitPrice = 10.0;
        lineTotal = 20.0;
      }];
      subTotal = 20.0;
      taxRate = 0.1;
      taxAmount = 2.0;
      totalAmount = 22.0;
    };

    invoices.add(invoice1.id, invoice1);

    sampleDataSeeded.add(seedKey);
  };
};
