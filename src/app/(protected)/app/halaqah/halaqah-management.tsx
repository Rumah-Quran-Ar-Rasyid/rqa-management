"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  School,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  changeHalaqahStatusAction,
  createHalaqahAction,
  updateHalaqahAction,
} from "@/modules/halaqahs/application/actions";
import type { HalaqahDirectoryItem } from "@/modules/halaqahs/application/halaqah-service";
import { createHalaqahSchema } from "@/modules/halaqahs/domain/halaqah-schemas";

type HalaqahFormInput = z.input<typeof createHalaqahSchema>;
type HalaqahFormValues = z.output<typeof createHalaqahSchema>;

export function HalaqahManagement({
  canManage,
  halaqahs,
}: {
  canManage: boolean;
  halaqahs: HalaqahDirectoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHalaqah, setEditingHalaqah] =
    useState<HalaqahDirectoryItem | null>(null);
  const [archiveTarget, setArchiveTarget] =
    useState<HalaqahDirectoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const form = useForm<HalaqahFormInput, unknown, HalaqahFormValues>({
    resolver: zodResolver(createHalaqahSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const filteredHalaqahs = halaqahs.filter((halaqah) =>
    [halaqah.name, halaqah.description ?? ""].some((value) =>
      value.toLocaleLowerCase("id-ID").includes(normalizedQuery),
    ),
  );

  function resetForm() {
    form.reset();
    setEditingHalaqah(null);
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(halaqah: HalaqahDirectoryItem) {
    setEditingHalaqah(halaqah);
    form.reset({
      name: halaqah.name,
      description: halaqah.description ?? "",
    });
    setFormOpen(true);
  }

  function handleSubmit(values: HalaqahFormValues) {
    startTransition(async () => {
      const result = editingHalaqah
        ? await updateHalaqahAction({
            halaqahId: editingHalaqah.id,
            ...values,
          })
        : await createHalaqahAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setFormOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function changeStatus(
    halaqah: HalaqahDirectoryItem,
    status: "ACTIVE" | "INACTIVE",
  ) {
    startTransition(async () => {
      const result = await changeHalaqahStatusAction({
        halaqahId: halaqah.id,
        status,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function archiveHalaqah() {
    if (!archiveTarget) {
      return;
    }

    startTransition(async () => {
      const result = await changeHalaqahStatusAction({
        halaqahId: archiveTarget.id,
        status: "ARCHIVED",
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setArchiveTarget(null);
    });
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Operasional</p>
            <h1 className="text-2xl font-semibold">Halaqah</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola kelompok belajar Rumah Qur’an Ar-Rasyid.
            </p>
          </div>
          {canManage ? (
            <Button size="lg" onClick={openCreateForm}>
              <Plus aria-hidden="true" />
              Tambah Halaqah
            </Button>
          ) : null}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama atau keterangan"
            aria-label="Cari halaqah"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <School className="size-4" aria-hidden="true" />
        {normalizedQuery
          ? `${filteredHalaqahs.length} hasil ditemukan`
          : `${halaqahs.length} halaqah terdaftar`}
      </div>

      {filteredHalaqahs.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Halaqah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHalaqahs.map((halaqah) => (
                      <TableRow key={halaqah.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{halaqah.name}</p>
                          {halaqah.description ? (
                            <p className="mt-0.5 max-w-xl truncate text-xs text-muted-foreground">
                              {halaqah.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={halaqah.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <HalaqahActions
                            canManage={canManage}
                            halaqah={halaqah}
                            onEdit={() => openEditForm(halaqah)}
                            onStatusChange={(status) => changeStatus(halaqah, status)}
                            onArchive={() => setArchiveTarget(halaqah)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:hidden">
            {filteredHalaqahs.map((halaqah) => (
              <Card key={halaqah.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{halaqah.name}</CardTitle>
                      {halaqah.description ? (
                        <CardDescription className="mt-1 line-clamp-2">
                          {halaqah.description}
                        </CardDescription>
                      ) : null}
                    </div>
                    <HalaqahActions
                      canManage={canManage}
                      halaqah={halaqah}
                      onEdit={() => openEditForm(halaqah)}
                      onStatusChange={(status) => changeStatus(halaqah, status)}
                      onArchive={() => setArchiveTarget(halaqah)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <StatusBadge status={halaqah.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <School className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">
            {normalizedQuery ? "Halaqah tidak ditemukan" : "Belum ada halaqah"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {normalizedQuery
              ? "Coba gunakan nama atau keterangan lain."
              : "Tambah halaqah untuk menyiapkan kelompok belajar."}
          </p>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {editingHalaqah ? "Ubah Halaqah" : "Tambah Halaqah"}
            </DialogTitle>
            <DialogDescription>
              {editingHalaqah
                ? "Perubahan disimpan pada riwayat operasional."
                : "Halaqah baru langsung berstatus Aktif."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="halaqah-name">Nama halaqah</FieldLabel>
                <Input
                  id="halaqah-name"
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.description)}>
                <FieldLabel htmlFor="halaqah-description">Keterangan</FieldLabel>
                <Textarea
                  id="halaqah-description"
                  maxLength={1000}
                  disabled={isPending}
                  {...form.register("description")}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Menyimpan..."
                    : editingHalaqah
                      ? "Simpan Perubahan"
                      : "Simpan Halaqah"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan halaqah?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget
                ? `${archiveTarget.name} tidak dapat diaktifkan atau diubah kembali.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={archiveHalaqah}>
              {isPending ? "Menyimpan..." : "Arsipkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusBadge({
  status,
}: {
  status: HalaqahDirectoryItem["status"];
}) {
  if (status === "ACTIVE") {
    return <Badge><CheckCircle2 aria-hidden="true" />Aktif</Badge>;
  }

  if (status === "INACTIVE") {
    return <Badge variant="secondary"><UserMinus aria-hidden="true" />Nonaktif</Badge>;
  }

  return <Badge variant="outline"><Archive aria-hidden="true" />Diarsipkan</Badge>;
}

function HalaqahActions({
  canManage,
  halaqah,
  onEdit,
  onStatusChange,
  onArchive,
}: {
  canManage: boolean;
  halaqah: HalaqahDirectoryItem;
  onEdit: () => void;
  onStatusChange: (status: "ACTIVE" | "INACTIVE") => void;
  onArchive: () => void;
}) {
  if (!canManage || halaqah.status === "ARCHIVED") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Aksi untuk ${halaqah.name}`}
          title={`Aksi untuk ${halaqah.name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aksi halaqah</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {halaqah.status === "ACTIVE" ? (
          <DropdownMenuItem onSelect={() => onStatusChange("INACTIVE")}>
            <UserMinus aria-hidden="true" />
            Nonaktifkan
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onStatusChange("ACTIVE")}>
            <CheckCircle2 aria-hidden="true" />
            Aktifkan
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={onArchive}>
          <Archive aria-hidden="true" />
          Arsipkan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
