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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Client } from "../backend.d";
import {
  useCreateClient,
  useDeleteClient,
  useGetAllClients,
  useUpdateClient,
} from "../hooks/useQueries";

const emptyClient = (): Omit<Client, "id"> => ({
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
});

export function ClientsPage() {
  const { data: clients, isLoading } = useGetAllClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = (clients ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.taxId.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingClient(null);
    setForm(emptyClient());
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxId: client.taxId,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient.mutateAsync({ ...editingClient, ...form });
        toast.success("Client updated");
      } else {
        const id = crypto.randomUUID();
        await createClient.mutateAsync({ id, ...form });
        toast.success("Client created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save client");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteClient.mutateAsync(deleteId);
      toast.success("Client deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete client");
    }
  }

  const isSaving = createClient.isPending || updateClient.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients?.length ?? 0} business clients
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-ocid="clients.add.primary_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="clients.search_input"
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {isLoading ? (
          <div data-ocid="clients.loading_state" className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="clients.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No clients match your search" : "No clients yet"}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={openCreate}
                data-ocid="clients.empty.add.button"
                className="mt-3"
              >
                Add your first client
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Tax ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, index) => (
                  <tr
                    key={client.id}
                    data-ocid={`clients.item.${index + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-sm truncate max-w-[180px]">
                        {client.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-muted-foreground text-xs">
                        {client.contactPerson}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-muted-foreground text-xs font-mono">
                        {client.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-muted-foreground text-xs font-mono">
                        {client.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-muted-foreground text-xs font-mono">
                        {client.taxId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(client)}
                          data-ocid={`clients.edit_button.${index + 1}`}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(client.id)}
                          data-ocid={`clients.delete_button.${index + 1}`}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="clients.dialog"
          className="max-w-md bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editingClient ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">Company Name *</Label>
                <Input
                  id="client-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Pharma Corp Ltd."
                  data-ocid="clients.name.input"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-contact">Contact Person *</Label>
                <Input
                  id="client-contact"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPerson: e.target.value }))
                  }
                  placeholder="John Smith"
                  data-ocid="clients.contact.input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client-email">Email *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="billing@company.com"
                    data-ocid="clients.email.input"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-phone">Phone *</Label>
                  <Input
                    id="client-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+1 555 0100"
                    data-ocid="clients.phone.input"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-address">Address</Label>
                <Input
                  id="client-address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="123 Medical Drive, Suite 400"
                  data-ocid="clients.address.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-taxid">Tax ID</Label>
                <Input
                  id="client-taxid"
                  value={form.taxId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, taxId: e.target.value }))
                  }
                  placeholder="EIN-XX-XXXXXXX"
                  data-ocid="clients.taxid.input"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="clients.dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ocid="clients.dialog.submit_button"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingClient ? "Save Changes" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent
          data-ocid="clients.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The client and all associated data
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="clients.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="clients.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
