"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  History,
  LockKeyhole,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  activateAcademicPeriodAction,
  closeAcademicPeriodAction,
  createAcademicPeriodAction,
  reopenAcademicPeriodAction,
} from "@/modules/periods/application/actions";
import type {
  AcademicPeriodDirectoryItem,
} from "@/modules/periods/application/academic-period-service";
import {
  createAcademicPeriodSchema,
  type CreateAcademicPeriodInput,
} from "@/modules/periods/domain/academic-period-schemas";

const STATUS_LABELS = {
  PLANNED: "Direncanakan",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
} as const;

const AUDIT_ACTION_LABELS: Record<string, string> = {
  PERIOD_CREATED: "Periode dibuat",
  PERIOD_ACTIVATED: "Periode diaktifkan",
  PERIOD_CLOSED: "Periode ditutup",
  PERIOD_REOPENED: "Periode dibuka kembali",
};

type PeriodAction = "activate" | "close" | "reopen";

type Confirmation = {
  action: PeriodAction;
  period: AcademicPeriodDirectoryItem;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function actionTitle(action: PeriodAction) {
  if (action === "activate") return "Aktifkan periode";
  if (action === "close") return "Tutup periode";
  return "Buka kembali periode";
}

function actionDescription(action: PeriodAction, name: string) {
  if (action === "activate") {
    return `Periode ${name} akan menjadi periode aktif.`;
  }

  if (action === "close") {
    return `Setoran baru dan koreksi pada periode ${name} akan ditolak sampai periode dibuka kembali.`;
  }

  return `Periode ${name} akan aktif kembali. Tutup kembali setelah perubahan data selesai.`;
}

export function AcademicPeriodManagement({
  canCreate,
  canActivate,
  canClose,
  canReopen,
  periods,
}: {
  canCreate: boolean;
  canActivate: boolean;
  canClose: boolean;
  canReopen: boolean;
  periods: AcademicPeriodDirectoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [historyPeriod, setHistoryPeriod] =
    useState<AcademicPeriodDirectoryItem | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const form = useForm<CreateAcademicPeriodInput>({
    resolver: zodResolver(createAcademicPeriodSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
    },
  });

  const reopenedActivePeriod = periods.find(
    (period) => period.status === "ACTIVE" && period.wasReopened,
  );

  function resetConfirmation() {
    setConfirmation(null);
    setReason("");
    setReasonError("");
  }

  function handleCreate(values: CreateAcademicPeriodInput) {
    startTransition(async () => {
      const result = await createAcademicPeriodAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      setCreateOpen(false);
      router.refresh();
    });
  }

  function confirmAction() {
    if (!confirmation) {
      return;
    }

    const requiresReason = confirmation.action !== "activate";
    const trimmedReason = reason.trim();

    if (requiresReason && !trimmedReason) {
      setReasonError("Alasan wajib diisi.");
      return;
    }

    startTransition(async () => {
      const result =
        confirmation.action === "activate"
          ? await activateAcademicPeriodAction({
              periodId: confirmation.period.id,
            })
          : confirmation.action === "close"
            ? await closeAcademicPeriodAction({
                periodId: confirmation.period.id,
                reason: trimmedReason,
              })
            : await reopenAcademicPeriodAction({
                periodId: confirmation.period.id,
                reason: trimmedReason,
              });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      resetConfirmation();
    });
  }

  function handleConfirmationAction(event: React.MouseEvent<HTMLButtonElement>) {
    const requiresReason = confirmation?.action !== "activate";

    if (requiresReason && !reason.trim()) {
      event.preventDefault();
      setReasonError("Alasan wajib diisi.");
      return;
    }

    confirmAction();
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Operasional</p>
          <h1 className="text-2xl font-semibold">Periode Pembelajaran</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur periode yang digunakan untuk pencatatan hafalan.
          </p>
        </div>
        {canCreate ? (
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Tambah Periode
          </Button>
        ) : null}
      </div>

      {reopenedActivePeriod ? (
        <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-secondary bg-secondary/45 px-4 py-3 text-sm">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-secondary-foreground"
            aria-hidden="true"
          />
          <p>
            <span className="font-medium">{reopenedActivePeriod.name}</span>{" "}
            sedang dibuka kembali. Tutup periode setelah perubahan data selesai.
          </p>
        </div>
      ) : null}

      {periods.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Periode</TableHead>
                      <TableHead>Rentang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="pl-4 font-medium">
                          {period.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={period.status} />
                            {period.wasReopened && period.status === "ACTIVE" ? (
                              <Badge variant="secondary">Dibuka kembali</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <PeriodActions
                            canActivate={canActivate}
                            canClose={canClose}
                            canReopen={canReopen}
                            period={period}
                            onAction={(action) => setConfirmation({ action, period })}
                            onHistory={() => setHistoryPeriod(period)}
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
            {periods.map((period) => (
              <Card key={period.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{period.name}</CardTitle>
                      <CardDescription>
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </CardDescription>
                    </div>
                    <StatusBadge status={period.status} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {period.wasReopened && period.status === "ACTIVE" ? (
                    <Badge variant="secondary">Dibuka kembali</Badge>
                  ) : null}
                  <PeriodActions
                    canActivate={canActivate}
                    canClose={canClose}
                    canReopen={canReopen}
                    period={period}
                    onAction={(action) => setConfirmation({ action, period })}
                    onHistory={() => setHistoryPeriod(period)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <CalendarDays className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Belum ada periode pembelajaran</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Buat periode terlebih dahulu sebelum menyiapkan halaqah dan setoran.
          </p>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Tambah Periode</DialogTitle>
            <DialogDescription>
              Periode baru dibuat dengan status Direncanakan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="period-name">Nama periode</FieldLabel>
                <Input
                  id="period-name"
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.startDate)}>
                <FieldLabel htmlFor="period-start-date">Tanggal mulai</FieldLabel>
                <Input
                  id="period-start-date"
                  type="date"
                  disabled={isPending}
                  {...form.register("startDate")}
                />
                <FieldError errors={[form.formState.errors.startDate]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.endDate)}>
                <FieldLabel htmlFor="period-end-date">Tanggal selesai</FieldLabel>
                <Input
                  id="period-end-date"
                  type="date"
                  disabled={isPending}
                  {...form.register("endDate")}
                />
                <FieldError errors={[form.formState.errors.endDate]} />
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setCreateOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Periode"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) resetConfirmation();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation ? actionTitle(confirmation.action) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation
                ? actionDescription(confirmation.action, confirmation.period.name)
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmation && confirmation.action !== "activate" ? (
            <Field data-invalid={Boolean(reasonError)}>
              <FieldLabel htmlFor="period-transition-reason">Alasan</FieldLabel>
              <Textarea
                id="period-transition-reason"
                value={reason}
                maxLength={500}
                disabled={isPending}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (reasonError) setReasonError("");
                }}
              />
              <FieldError>{reasonError}</FieldError>
            </Field>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleConfirmationAction}
            >
              {isPending ? "Menyimpan..." : confirmation ? actionTitle(confirmation.action) : "Simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={historyPeriod !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryPeriod(null);
        }}
      >
        <DialogContent className="max-h-[min(42rem,calc(100svh-2rem))] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Riwayat Periode</DialogTitle>
            <DialogDescription>{historyPeriod?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {historyPeriod?.history.map((entry) => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {AUDIT_ACTION_LABELS[entry.action] ?? "Perubahan periode"}
                    </p>
                    {entry.previousStatus || entry.nextStatus ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.previousStatus
                          ? STATUS_LABELS[entry.previousStatus]
                          : "Belum ditentukan"}{" "}
                        {" ke "}
                        {entry.nextStatus
                          ? STATUS_LABELS[entry.nextStatus]
                          : "Belum ditentukan"}
                      </p>
                    ) : null}
                    {entry.reason ? (
                      <p className="mt-2 text-sm leading-6">{entry.reason}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.performedByName} · {formatDateTime(entry.performedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({
  status,
}: {
  status: AcademicPeriodDirectoryItem["status"];
}) {
  if (status === "ACTIVE") {
    return <Badge><CheckCircle2 aria-hidden="true" />Aktif</Badge>;
  }

  if (status === "CLOSED") {
    return <Badge variant="outline"><LockKeyhole aria-hidden="true" />Ditutup</Badge>;
  }

  return <Badge variant="secondary">Direncanakan</Badge>;
}

function PeriodActions({
  canActivate,
  canClose,
  canReopen,
  period,
  onAction,
  onHistory,
}: {
  canActivate: boolean;
  canClose: boolean;
  canReopen: boolean;
  period: AcademicPeriodDirectoryItem;
  onAction: (action: PeriodAction) => void;
  onHistory: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={onHistory}>
        <History aria-hidden="true" />
        Riwayat
      </Button>
      {period.status === "PLANNED" && canActivate ? (
        <Button size="sm" variant="outline" onClick={() => onAction("activate")}>
          <Play aria-hidden="true" />
          Aktifkan
        </Button>
      ) : null}
      {period.status === "ACTIVE" && canClose ? (
        <Button size="sm" variant="outline" onClick={() => onAction("close")}>
          <LockKeyhole aria-hidden="true" />
          Tutup
        </Button>
      ) : null}
      {period.status === "CLOSED" && canReopen ? (
        <Button size="sm" variant="outline" onClick={() => onAction("reopen")}>
          <RotateCcw aria-hidden="true" />
          Buka kembali
        </Button>
      ) : null}
    </div>
  );
}
