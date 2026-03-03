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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Pill, Plus, Search, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Medicine } from "../backend.d";
import {
  useCreateMedicine,
  useDeleteMedicine,
  useGetAllMedicines,
  useUpdateMedicine,
} from "../hooks/useQueries";
import { formatCurrency } from "../lib/formatters";

const CATEGORIES = [
  "Analgesics",
  "Antibiotics",
  "Antifungals",
  "Antivirals",
  "Cardiovascular",
  "Dermatology",
  "Diabetes",
  "Gastrointestinal",
  "Immunology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Pulmonology",
  "Vitamins & Supplements",
  "Other",
];

const UOM_OPTIONS = [
  "tablet",
  "capsule",
  "vial",
  "bottle",
  "box",
  "pack",
  "strip",
  "ml",
  "g",
  "mg",
  "unit",
];

const emptyMedicine = (): Omit<Medicine, "id"> => ({
  name: "",
  sku: "",
  category: "",
  unitPrice: 0,
  unitOfMeasure: "tablet",
});

export function MedicinesPage() {
  const { data: medicines, isLoading } = useGetAllMedicines();
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const deleteMedicine = useDeleteMedicine();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyMedicine());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = (medicines ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingMed(null);
    setForm(emptyMedicine());
    setDialogOpen(true);
  }

  function openEdit(med: Medicine) {
    setEditingMed(med);
    setForm({
      name: med.name,
      sku: med.sku,
      category: med.category,
      unitPrice: med.unitPrice,
      unitOfMeasure: med.unitOfMeasure,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingMed) {
        await updateMedicine.mutateAsync({ ...editingMed, ...form });
        toast.success("Medicine updated");
      } else {
        const id = crypto.randomUUID();
        await createMedicine.mutateAsync({ id, ...form });
        toast.success("Medicine added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save medicine");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMedicine.mutateAsync(deleteId);
      toast.success("Medicine deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete medicine");
    }
  }

  const isSaving = createMedicine.isPending || updateMedicine.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Medicine Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {medicines?.length ?? 0} products in catalog
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-ocid="medicines.add.primary_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="medicines.search_input"
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {isLoading ? (
          <div data-ocid="medicines.loading_state" className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="medicines.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Pill className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No medicines match your search" : "No medicines yet"}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={openCreate}
                data-ocid="medicines.empty.add.button"
                className="mt-3"
              >
                Add your first medicine
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    UOM
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((med, index) => (
                  <tr
                    key={med.id}
                    data-ocid={`medicines.item.${index + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-sm truncate max-w-[200px]">
                        {med.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                        {med.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">
                        {med.unitOfMeasure}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="number-cell text-sm font-semibold text-foreground">
                        {formatCurrency(med.unitPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(med)}
                          data-ocid={`medicines.edit_button.${index + 1}`}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(med.id)}
                          data-ocid={`medicines.delete_button.${index + 1}`}
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
          data-ocid="medicines.dialog"
          className="max-w-md bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {editingMed ? "Edit Medicine" : "Add Medicine"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Name *</Label>
              <Input
                id="med-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Amoxicillin 500mg"
                data-ocid="medicines.name.input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-sku">SKU *</Label>
                <Input
                  id="med-sku"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  placeholder="AMX-500-CAP"
                  data-ocid="medicines.sku.input"
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-price">Unit Price (USD) *</Label>
                <Input
                  id="med-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      unitPrice: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  data-ocid="medicines.price.input"
                  className="font-mono"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  required
                >
                  <SelectTrigger
                    data-ocid="medicines.category.select"
                    className="bg-input border-border"
                  >
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit of Measure *</Label>
                <Select
                  value={form.unitOfMeasure}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, unitOfMeasure: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="medicines.uom.select"
                    className="bg-input border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UOM_OPTIONS.map((uom) => (
                      <SelectItem key={uom} value={uom}>
                        {uom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="medicines.dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ocid="medicines.dialog.submit_button"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMed ? "Save Changes" : "Add Medicine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent
          data-ocid="medicines.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this medicine from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="medicines.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="medicines.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMedicine.isPending ? (
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
