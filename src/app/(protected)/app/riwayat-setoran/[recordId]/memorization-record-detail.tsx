"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FilePenLine,
  History,
  MapPin,
  NotebookPen,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  correctMemorizationRecordAction,
  voidMemorizationRecordAction,
} from "@/modules/memorization/application/actions";
import type { MemorizationRecordDetail } from "@/modules/memorization/application/memorization-service";
import {
  correctMemorizationRecordSchema,
  type CorrectMemorizationRecordFormInput,
  type CorrectMemorizationRecordInput,
} from "@/modules/memorization/domain/memorization-schemas";

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

const FLUENCY_LABELS = {
  FLUENT: "Lancar",
  FAIRLY_FLUENT: "Cukup Lancar",
  LESS_FLUENT: "Kurang Lancar",
} as const;

const AUDIT_ACTION_LABELS = {
  CREATE: "Setoran dicatat",
  UPDATE: "Setoran dikoreksi",
  VOID: "Setoran dibatalkan",
} as const;

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

export function MemorizationRecordDetailView({
  record,
}: {
  record: MemorizationRecordDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidReasonError, setVoidReasonError] = useState("");
  const form = useForm<
    CorrectMemorizationRecordFormInput,
    unknown,
    CorrectMemorizationRecordInput
  >({
    resolver: zodResolver(correctMemorizationRecordSchema),
    defaultValues: correctionValues(record),
  });
  const selectedSurahNumber = useWatch({
    control: form.control,
    name: "surahNumber",
  });
  const selectedSurah = record.surahs.find(
    (surah) => surah.number === Number(selectedSurahNumber),
  );

  function closeCorrection() {
    setCorrectionOpen(false);
    form.reset(correctionValues(record));
  }

  function closeVoid() {
    setVoidOpen(false);
    setVoidReason("");
    setVoidReasonError("");
  }

  function handleCorrection(values: CorrectMemorizationRecordInput) {
    startTransition(async () => {
      const result = await correctMemorizationRecordAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      closeCorrection();
      router.refresh();
    });
  }

  function handleVoid(event: React.MouseEvent<HTMLButtonElement>) {
    const reason = voidReason.trim();

    if (!reason) {
      event.preventDefault();
      setVoidReasonError("Alasan pembatalan wajib diisi.");
      return;
    }

    event.preventDefault();
    startTransition(async () => {
      const result = await voidMemorizationRecordAction({
        recordId: record.id,
        reason,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      closeVoid();
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" title="Kembali">
            <Link href="/app" aria-label="Kembali ke Beranda">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Riwayat Setoran</p>
            <h1 className="text-2xl font-semibold">Detail Setoran</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.studentName} · {formatDate(record.submissionDate)}
            </p>
          </div>
        </div>
        <RecordActions
          canCorrect={record.canCorrect}
          canVoid={record.canVoid}
          onCorrect={() => setCorrectionOpen(true)}
          onVoid={() => setVoidOpen(true)}
        />
      </div>

      {record.recordStatus === "VOID" ? (
        <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>Setoran ini telah dibatalkan dan tidak dihitung dalam ringkasan akademik.</p>
        </div>
      ) : record.academicPeriodStatus !== "ACTIVE" ? (
        <div className="mb-5 flex items-start gap-3 rounded-[8px] border border-secondary bg-secondary/45 px-4 py-3 text-sm">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-secondary-foreground"
            aria-hidden="true"
          />
          <p>
            Periode <span className="font-medium">{record.academicPeriodName}</span>{" "}
            sedang ditutup. Koreksi atau pembatalan dapat dilakukan setelah Kepala
            membuka kembali periode.
          </p>
        </div>
      ) : null}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <NotebookPen className="size-5 text-primary" aria-hidden="true" />
                  Setoran Hafalan
                </CardTitle>
                <CardDescription>{record.academicPeriodName}</CardDescription>
              </div>
              <RecordStatusBadge status={record.recordStatus} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
            <DetailItem icon={UserRound} label="Santri" value={record.studentName} />
            <DetailItem icon={MapPin} label="Halaqah" value={record.halaqahName} />
            <DetailItem
              icon={BookOpenCheck}
              label="Setoran"
              value={`${CATEGORY_LABELS[record.submissionCategory]} · ${record.surahName} ${record.startVerse}-${record.endVerse}`}
            />
            <DetailItem
              icon={CheckCircle2}
              label="Kelancaran"
              value={FLUENCY_LABELS[record.fluencyPredicate]}
            />
            <DetailItem
              icon={CalendarDays}
              label="Tanggal setoran"
              value={formatDate(record.submissionDate)}
            />
            <DetailItem icon={UserRound} label="Pengajar" value={record.teacherName} />
            {record.pageNumber ? (
              <DetailItem
                icon={BookOpenCheck}
                label="Nomor halaman"
                value={String(record.pageNumber)}
              />
            ) : null}
          </CardContent>
          {record.teacherNote || record.nextTarget ? (
            <CardContent className="space-y-4 border-t pt-6 text-sm">
              {record.teacherNote ? (
                <div>
                  <p className="font-medium">Catatan Pengajar</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {record.teacherNote}
                  </p>
                </div>
              ) : null}
              {record.nextTarget ? (
                <div>
                  <p className="font-medium">Target Berikutnya</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {record.nextTarget}
                  </p>
                </div>
              ) : null}
            </CardContent>
          ) : null}
        </Card>

        <aside className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Informasi Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                <span>Dibuat {formatDateTime(record.createdAt)}</span>
              </div>
              {record.canViewAudit ? (
                <div className="flex items-center gap-3">
                  <History className="size-4 text-primary" aria-hidden="true" />
                  <span>{record.audits.length} riwayat perubahan</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {record.canViewAudit ? (
        <section className="mt-8" aria-labelledby="audit-heading">
          <div className="mb-4">
            <h2 id="audit-heading" className="text-lg font-semibold">
              Riwayat Perubahan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.canViewAuditDetails
                ? "Detail perubahan akademik pada setoran ini."
                : "Riwayat perubahan terbatas untuk setoran Anda."}
            </p>
          </div>
          <AuditHistory
            audits={record.audits}
            canViewAuditDetails={record.canViewAuditDetails}
          />
        </section>
      ) : null}

      <Dialog
        open={correctionOpen}
        onOpenChange={(open) => {
          if (!open) closeCorrection();
        }}
      >
        <DialogContent className="max-h-[min(46rem,calc(100svh-2rem))] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Koreksi Setoran</DialogTitle>
            <DialogDescription>
              Alasan koreksi akan tersimpan pada riwayat perubahan setoran.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCorrection)}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  data-invalid={Boolean(
                    form.formState.errors.submissionCategory,
                  )}
                >
                  <FieldLabel htmlFor="correction-category">Kategori</FieldLabel>
                  <Select
                    id="correction-category"
                    disabled={isPending}
                    {...form.register("submissionCategory")}
                  >
                    <option value="SABAQ">Sabaq</option>
                    <option value="SABQI">Sabqi</option>
                    <option value="MANZIL">Manzil</option>
                  </Select>
                  <FieldError
                    errors={[form.formState.errors.submissionCategory]}
                  />
                </Field>
                <Field
                  data-invalid={Boolean(form.formState.errors.fluencyPredicate)}
                >
                  <FieldLabel htmlFor="correction-fluency">Kelancaran</FieldLabel>
                  <Select
                    id="correction-fluency"
                    disabled={isPending}
                    {...form.register("fluencyPredicate")}
                  >
                    <option value="FLUENT">Lancar</option>
                    <option value="FAIRLY_FLUENT">Cukup Lancar</option>
                    <option value="LESS_FLUENT">Kurang Lancar</option>
                  </Select>
                  <FieldError errors={[form.formState.errors.fluencyPredicate]} />
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.surahNumber)}>
                <FieldLabel htmlFor="correction-surah">Surah</FieldLabel>
                <Select
                  id="correction-surah"
                  disabled={isPending}
                  {...form.register("surahNumber")}
                >
                  {record.surahs.map((surah) => (
                    <option key={surah.number} value={surah.number}>
                      {surah.label}
                    </option>
                  ))}
                </Select>
                {selectedSurah ? (
                  <p className="text-sm text-muted-foreground">
                    Surah ini terdiri dari {selectedSurah.verseCount} ayat.
                  </p>
                ) : null}
                <FieldError errors={[form.formState.errors.surahNumber]} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={Boolean(form.formState.errors.startVerse)}>
                  <FieldLabel htmlFor="correction-start-verse">Ayat awal</FieldLabel>
                  <Input
                    id="correction-start-verse"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    disabled={isPending}
                    {...form.register("startVerse")}
                  />
                  <FieldError errors={[form.formState.errors.startVerse]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.endVerse)}>
                  <FieldLabel htmlFor="correction-end-verse">Ayat akhir</FieldLabel>
                  <Input
                    id="correction-end-verse"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    disabled={isPending}
                    {...form.register("endVerse")}
                  />
                  <FieldError errors={[form.formState.errors.endVerse]} />
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.teacherNote)}>
                <FieldLabel htmlFor="correction-note">Catatan Pengajar</FieldLabel>
                <Textarea
                  id="correction-note"
                  disabled={isPending}
                  {...form.register("teacherNote")}
                />
                <FieldError errors={[form.formState.errors.teacherNote]} />
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.nextTarget)}>
                <FieldLabel htmlFor="correction-target">Target Berikutnya</FieldLabel>
                <Textarea
                  id="correction-target"
                  disabled={isPending}
                  {...form.register("nextTarget")}
                />
                <FieldError errors={[form.formState.errors.nextTarget]} />
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.pageNumber)}>
                <FieldLabel htmlFor="correction-page">Nomor halaman</FieldLabel>
                <Input
                  id="correction-page"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Opsional"
                  disabled={isPending}
                  {...form.register("pageNumber")}
                />
                <FieldError errors={[form.formState.errors.pageNumber]} />
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.reason)}>
                <FieldLabel htmlFor="correction-reason">Alasan Koreksi</FieldLabel>
                <Textarea
                  id="correction-reason"
                  placeholder="Jelaskan perbaikan yang dilakukan"
                  disabled={isPending}
                  {...form.register("reason")}
                />
                <FieldError errors={[form.formState.errors.reason]} />
              </Field>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={closeCorrection}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Koreksi"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={voidOpen}
        onOpenChange={(open) => {
          if (!open) closeVoid();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Setoran</AlertDialogTitle>
            <AlertDialogDescription>
              Setoran akan ditandai Dibatalkan dan tidak lagi dihitung dalam
              ringkasan akademik. Tindakan ini tidak menghapus riwayat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={Boolean(voidReasonError)}>
            <FieldLabel htmlFor="void-reason">Alasan Pembatalan</FieldLabel>
            <Textarea
              id="void-reason"
              value={voidReason}
              maxLength={500}
              disabled={isPending}
              onChange={(event) => {
                setVoidReason(event.target.value);
                if (voidReasonError) setVoidReasonError("");
              }}
            />
            <FieldError>{voidReasonError}</FieldError>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleVoid}
            >
              {isPending ? "Membatalkan..." : "Batalkan Setoran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecordActions({
  canCorrect,
  canVoid,
  onCorrect,
  onVoid,
}: {
  canCorrect: boolean;
  canVoid: boolean;
  onCorrect: () => void;
  onVoid: () => void;
}) {
  if (!canCorrect && !canVoid) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canCorrect ? (
        <Button onClick={onCorrect}>
          <FilePenLine aria-hidden="true" />
          Koreksi Setoran
        </Button>
      ) : null}
      {canVoid ? (
        <Button variant="destructive" onClick={onVoid}>
          <Trash2 aria-hidden="true" />
          Batalkan Setoran
        </Button>
      ) : null}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function RecordStatusBadge({ status }: { status: MemorizationRecordDetail["recordStatus"] }) {
  return status === "ACTIVE" ? (
    <Badge>Aktif</Badge>
  ) : (
    <Badge variant="destructive">Dibatalkan</Badge>
  );
}

function AuditHistory({
  audits,
  canViewAuditDetails,
}: {
  audits: MemorizationRecordDetail["audits"];
  canViewAuditDetails: boolean;
}) {
  if (audits.length === 0) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
        <History className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Belum ada riwayat perubahan</p>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="space-y-5">
        {audits.map((audit) => (
          <div key={audit.id} className="flex gap-3 border-b pb-5 last:border-b-0 last:pb-0">
            <History className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium">{AUDIT_ACTION_LABELS[audit.action]}</p>
              {canViewAuditDetails && audit.details.length > 0 ? (
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {audit.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
              {audit.reason ? (
                <p className="mt-2 text-sm leading-6">Alasan: {audit.reason}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {audit.performedByName} · {formatDateTime(audit.performedAt)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function correctionValues(
  record: MemorizationRecordDetail,
): CorrectMemorizationRecordFormInput {
  return {
    recordId: record.id,
    submissionCategory: record.submissionCategory,
    surahNumber: String(record.surahNumber),
    startVerse: String(record.startVerse),
    endVerse: String(record.endVerse),
    fluencyPredicate: record.fluencyPredicate,
    teacherNote: record.teacherNote ?? "",
    nextTarget: record.nextTarget ?? "",
    pageNumber: record.pageNumber ? String(record.pageNumber) : "",
    reason: "",
  };
}
