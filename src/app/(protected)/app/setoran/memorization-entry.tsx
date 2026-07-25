"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpenCheck,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  NotebookPen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createMemorizationRecordAction } from "@/modules/memorization/application/actions";
import type {
  MemorizationEntryContext,
  RecentMemorizationRecord,
} from "@/modules/memorization/application/memorization-service";
import {
  createMemorizationRecordSchema,
  type CreateMemorizationRecordFormInput,
  type CreateMemorizationRecordInput,
} from "@/modules/memorization/domain/memorization-schemas";

const CATEGORY_LABELS = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function MemorizationEntry({
  activePeriod,
  halaqahs,
  recentRecords,
  submissionDate,
  surahs,
}: MemorizationEntryContext) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDuplicateOverride, setShowDuplicateOverride] = useState(false);
  const form = useForm<
    CreateMemorizationRecordFormInput,
    unknown,
    CreateMemorizationRecordInput
  >({
    resolver: zodResolver(createMemorizationRecordSchema),
    defaultValues: emptyFormValues(),
  });
  const selectedHalaqahId = useWatch({
    control: form.control,
    name: "halaqahId",
  });
  const selectedSurahNumber = useWatch({
    control: form.control,
    name: "surahNumber",
  });
  const selectedHalaqah = halaqahs.find(
    (halaqah) => halaqah.id === selectedHalaqahId,
  );
  const selectedSurah = surahs.find(
    (surah) => surah.number === Number(selectedSurahNumber),
  );
  const canSubmit = Boolean(activePeriod && selectedHalaqah?.students.length);

  function handleSubmit(values: CreateMemorizationRecordInput) {
    startTransition(async () => {
      const result = await createMemorizationRecordAction(values);

      if (!result.success) {
        toast.error(result.message);
        if (result.requiresDuplicateOverride) {
          setShowDuplicateOverride(true);
        }
        return;
      }

      toast.success(result.message);
      form.reset(emptyFormValues());
      setShowDuplicateOverride(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-primary">Setoran Hari Ini</p>
        <h1 className="text-2xl font-semibold">Catat Setoran</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(submissionDate)}
          {activePeriod ? ` · ${activePeriod.name}` : " · Periode belum aktif"}
        </p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <NotebookPen className="size-5 text-primary" aria-hidden="true" />
              Setoran Hafalan
            </CardTitle>
            <CardDescription>
              Satu setoran untuk satu surah. Untuk surah lain, simpan sebagai setoran baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!activePeriod ? (
              <EmptyState
                icon={<CalendarDays className="size-5" aria-hidden="true" />}
                title="Belum ada periode aktif"
                description="Setoran dapat dicatat setelah Admin mengaktifkan periode pembelajaran."
              />
            ) : halaqahs.length === 0 ? (
              <EmptyState
                icon={<BookOpenCheck className="size-5" aria-hidden="true" />}
                title="Belum ada halaqah yang diampu"
                description="Minta Admin menetapkan Anda pada halaqah aktif terlebih dahulu."
              />
            ) : (
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <FieldGroup>
                  <Field data-invalid={Boolean(form.formState.errors.halaqahId)}>
                    <FieldLabel htmlFor="record-halaqah">Halaqah</FieldLabel>
                    <Select
                      id="record-halaqah"
                      disabled={isPending}
                      {...form.register("halaqahId", {
                        onChange: () => form.setValue("studentId", ""),
                      })}
                    >
                      <option value="">Pilih halaqah</option>
                      {halaqahs.map((halaqah) => (
                        <option key={halaqah.id} value={halaqah.id}>
                          {halaqah.label}
                        </option>
                      ))}
                    </Select>
                    <FieldError errors={[form.formState.errors.halaqahId]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.studentId)}>
                    <FieldLabel htmlFor="record-student">Santri</FieldLabel>
                    <Select
                      id="record-student"
                      disabled={isPending || !selectedHalaqah}
                      {...form.register("studentId")}
                    >
                      <option value="">
                        {selectedHalaqah ? "Pilih santri" : "Pilih halaqah terlebih dahulu"}
                      </option>
                      {selectedHalaqah?.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.label}
                        </option>
                      ))}
                    </Select>
                    {selectedHalaqah && selectedHalaqah.students.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada santri aktif pada halaqah ini.
                      </p>
                    ) : null}
                    <FieldError errors={[form.formState.errors.studentId]} />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      data-invalid={Boolean(
                        form.formState.errors.submissionCategory,
                      )}
                    >
                      <FieldLabel htmlFor="record-category">Kategori</FieldLabel>
                      <Select
                        id="record-category"
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
                      data-invalid={Boolean(
                        form.formState.errors.fluencyPredicate,
                      )}
                    >
                      <FieldLabel htmlFor="record-fluency">Kelancaran</FieldLabel>
                      <Select
                        id="record-fluency"
                        disabled={isPending}
                        {...form.register("fluencyPredicate")}
                      >
                        <option value="FLUENT">Lancar</option>
                        <option value="FAIRLY_FLUENT">Cukup Lancar</option>
                        <option value="LESS_FLUENT">Kurang Lancar</option>
                      </Select>
                      <FieldError
                        errors={[form.formState.errors.fluencyPredicate]}
                      />
                    </Field>
                  </div>

                  <Field data-invalid={Boolean(form.formState.errors.surahNumber)}>
                    <FieldLabel htmlFor="record-surah">Surah</FieldLabel>
                    <Select
                      id="record-surah"
                      disabled={isPending}
                      {...form.register("surahNumber")}
                    >
                      <option value="">Pilih surah</option>
                      {surahs.map((surah) => (
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
                      <FieldLabel htmlFor="record-start-verse">Ayat awal</FieldLabel>
                      <Input
                        id="record-start-verse"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        disabled={isPending}
                        {...form.register("startVerse")}
                      />
                      <FieldError errors={[form.formState.errors.startVerse]} />
                    </Field>
                    <Field data-invalid={Boolean(form.formState.errors.endVerse)}>
                      <FieldLabel htmlFor="record-end-verse">Ayat akhir</FieldLabel>
                      <Input
                        id="record-end-verse"
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
                    <FieldLabel htmlFor="record-note">Catatan Pengajar</FieldLabel>
                    <Textarea
                      id="record-note"
                      placeholder="Catatan untuk perkembangan hafalan"
                      disabled={isPending}
                      {...form.register("teacherNote")}
                    />
                    <FieldError errors={[form.formState.errors.teacherNote]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.nextTarget)}>
                    <FieldLabel htmlFor="record-target">Target Berikutnya</FieldLabel>
                    <Textarea
                      id="record-target"
                      placeholder="Target setoran atau murojaah berikutnya"
                      disabled={isPending}
                      {...form.register("nextTarget")}
                    />
                    <FieldError errors={[form.formState.errors.nextTarget]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.pageNumber)}>
                    <FieldLabel htmlFor="record-page">Nomor halaman</FieldLabel>
                    <Input
                      id="record-page"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      placeholder="Opsional"
                      disabled={isPending}
                      {...form.register("pageNumber")}
                    />
                    <FieldError errors={[form.formState.errors.pageNumber]} />
                  </Field>

                  {showDuplicateOverride ? (
                    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <div className="flex items-start gap-2">
                        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium">Setoran serupa ditemukan</p>
                          <p className="mt-1">
                            Konfirmasi dan tulis alasan sebelum menyimpan setoran ini.
                          </p>
                        </div>
                      </div>
                      <label className="mt-3 flex min-h-11 items-center gap-3 font-medium">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          disabled={isPending}
                          {...form.register("duplicateOverride")}
                        />
                        Saya tetap ingin menyimpan setoran ini
                      </label>
                      <div className="mt-3">
                        <Field
                          data-invalid={Boolean(
                            form.formState.errors.duplicateOverrideReason,
                          )}
                        >
                          <FieldLabel htmlFor="record-duplicate-reason">
                            Alasan
                          </FieldLabel>
                          <Textarea
                            id="record-duplicate-reason"
                            placeholder="Jelaskan alasan pencatatan ulang"
                            disabled={isPending}
                            {...form.register("duplicateOverrideReason")}
                          />
                          <FieldError
                            errors={[
                              form.formState.errors.duplicateOverrideReason,
                            ]}
                          />
                        </Field>
                      </div>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isPending || !canSubmit}
                  >
                    {isPending ? "Menyimpan..." : "Simpan Setoran"}
                  </Button>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                <span>{formatDate(submissionDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpenCheck className="size-4 text-primary" aria-hidden="true" />
                <span>{activePeriod?.name ?? "Periode belum aktif"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CircleCheck className="size-4 text-primary" aria-hidden="true" />
                <span>{halaqahs.length} halaqah diampu</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Setoran Terbaru</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat setoran yang Anda catat terakhir kali.
          </p>
        </div>
        <RecentRecords records={recentRecords} />
      </section>
    </>
  );
}

function RecentRecords({ records }: { records: RecentMemorizationRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
        <Clock3 className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Belum ada setoran</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Setoran yang disimpan akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Card className="border py-0 shadow-sm">
          <CardContent className="px-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-4">Santri</TableHead>
                  <TableHead>Setoran</TableHead>
                  <TableHead>Kelancaran</TableHead>
                  <TableHead className="pr-4">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.halaqahName}
                      </p>
                    </TableCell>
                    <TableCell>
                      {CATEGORY_LABELS[record.submissionCategory]} · {record.surahName} {record.startVerse}-{record.endVerse}
                    </TableCell>
                    <TableCell>
                      <FluencyBadge predicate={record.fluencyPredicate} />
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {formatDate(record.submissionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3 md:hidden">
        {records.map((record) => (
          <Card key={record.id} size="sm" className="border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{record.studentName}</CardTitle>
                  <CardDescription>{record.halaqahName}</CardDescription>
                </div>
                <FluencyBadge predicate={record.fluencyPredicate} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p>
                {CATEGORY_LABELS[record.submissionCategory]} · {record.surahName} {record.startVerse}-{record.endVerse}
              </p>
              <p className="text-muted-foreground">
                {formatDate(record.submissionDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function EmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-[8px] border border-dashed bg-muted/20 px-5 text-center">
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FluencyBadge({
  predicate,
}: {
  predicate: RecentMemorizationRecord["fluencyPredicate"];
}) {
  if (predicate === "FLUENT") {
    return <Badge><CircleCheck aria-hidden="true" />Lancar</Badge>;
  }

  if (predicate === "FAIRLY_FLUENT") {
    return <Badge variant="secondary">Cukup Lancar</Badge>;
  }

  return <Badge variant="outline">Kurang Lancar</Badge>;
}

function emptyFormValues(): CreateMemorizationRecordFormInput {
  return {
    halaqahId: "",
    studentId: "",
    submissionCategory: "SABAQ",
    surahNumber: "",
    startVerse: "",
    endVerse: "",
    fluencyPredicate: "FLUENT",
    teacherNote: "",
    nextTarget: "",
    pageNumber: "",
    duplicateOverride: false,
    duplicateOverrideReason: "",
  };
}
