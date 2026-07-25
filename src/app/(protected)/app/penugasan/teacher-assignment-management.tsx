"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleCheck,
  Clock3,
  Plus,
  UserRoundCheck,
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  closeTeacherAssignmentAction,
  createTeacherAssignmentAction,
} from "@/modules/assignments/application/actions";
import type {
  AssignmentOption,
  TeacherAssignmentItem,
} from "@/modules/assignments/application/teacher-assignment-service";
import {
  createTeacherAssignmentSchema,
  type CreateTeacherAssignmentFormInput,
  type CreateTeacherAssignmentInput,
} from "@/modules/assignments/domain/teacher-assignment-schemas";

function currentDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function TeacherAssignmentManagement({
  assignments,
  canManage,
  halaqahs,
  teachers,
}: {
  assignments: TeacherAssignmentItem[];
  canManage: boolean;
  halaqahs: AssignmentOption[];
  teachers: AssignmentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<TeacherAssignmentItem | null>(null);
  const [closeDate, setCloseDate] = useState(currentDateValue());
  const [closeError, setCloseError] = useState("");
  const form = useForm<
    CreateTeacherAssignmentFormInput,
    unknown,
    CreateTeacherAssignmentInput
  >({
    resolver: zodResolver(createTeacherAssignmentSchema),
    defaultValues: getEmptyFormValues(),
  });

  function openCreateForm() {
    form.reset(getEmptyFormValues());
    setFormOpen(true);
  }

  function handleCreate(values: CreateTeacherAssignmentInput) {
    startTransition(async () => {
      const result = await createTeacherAssignmentAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setFormOpen(false);
      router.refresh();
    });
  }

  function openCloseDialog(assignment: TeacherAssignmentItem) {
    setCloseTarget(assignment);
    setCloseDate(
      assignment.validFrom > currentDateValue()
        ? assignment.validFrom
        : currentDateValue(),
    );
    setCloseError("");
  }

  function closeAssignment(event: React.MouseEvent<HTMLButtonElement>) {
    if (!closeTarget) {
      return;
    }

    if (!closeDate || closeDate < closeTarget.validFrom) {
      event.preventDefault();
      setCloseError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    startTransition(async () => {
      const result = await closeTeacherAssignmentAction({
        assignmentId: closeTarget.id,
        validUntil: closeDate,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setCloseTarget(null);
    });
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Operasional</p>
          <h1 className="text-2xl font-semibold">Penugasan Pengajar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tetapkan Pengajar pada halaqah beserta masa berlakunya.
          </p>
        </div>
        {canManage ? (
          <Button size="lg" onClick={openCreateForm}>
            <Plus aria-hidden="true" />
            Tetapkan Pengajar
          </Button>
        ) : null}
      </div>

      {assignments.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Halaqah</TableHead>
                      <TableHead>Pengajar</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Masa berlaku</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="pl-4 font-medium">
                          {assignment.halaqahName}
                        </TableCell>
                        <TableCell>{assignment.teacherName}</TableCell>
                        <TableCell>
                          <AssignmentTypeBadge type={assignment.assignmentType} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(assignment.validFrom)}
                          {assignment.validUntil
                            ? ` - ${formatDate(assignment.validUntil)}`
                            : " - seterusnya"}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {canManage && assignment.validUntil === null ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCloseDialog(assignment)}
                            >
                              Akhiri
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:hidden">
            {assignments.map((assignment) => (
              <Card key={assignment.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{assignment.halaqahName}</CardTitle>
                      <CardDescription>{assignment.teacherName}</CardDescription>
                    </div>
                    <AssignmentTypeBadge type={assignment.assignmentType} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(assignment.validFrom)}
                    {assignment.validUntil
                      ? ` - ${formatDate(assignment.validUntil)}`
                      : " - seterusnya"}
                  </p>
                  {canManage && assignment.validUntil === null ? (
                    <Button
                      variant="outline"
                      onClick={() => openCloseDialog(assignment)}
                    >
                      Akhiri Penugasan
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <UserRoundCheck className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Belum ada penugasan Pengajar</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tetapkan Pengajar aktif pada halaqah aktif untuk memulai persiapan setoran.
          </p>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) form.reset(getEmptyFormValues());
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Tetapkan Pengajar</DialogTitle>
            <DialogDescription>
              Pengajar Pengganti wajib memiliki tanggal selesai.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.halaqahId)}>
                <FieldLabel htmlFor="assignment-halaqah">Halaqah</FieldLabel>
                <Select
                  id="assignment-halaqah"
                  disabled={isPending || halaqahs.length === 0}
                  {...form.register("halaqahId")}
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
              <Field data-invalid={Boolean(form.formState.errors.teacherUserId)}>
                <FieldLabel htmlFor="assignment-teacher">Pengajar</FieldLabel>
                <Select
                  id="assignment-teacher"
                  disabled={isPending || teachers.length === 0}
                  {...form.register("teacherUserId")}
                >
                  <option value="">Pilih Pengajar</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.label}
                    </option>
                  ))}
                </Select>
                <FieldError errors={[form.formState.errors.teacherUserId]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.assignmentType)}>
                <FieldLabel htmlFor="assignment-type">Peran Pengajar</FieldLabel>
                <Select
                  id="assignment-type"
                  disabled={isPending}
                  {...form.register("assignmentType")}
                >
                  <option value="PRIMARY">Pengajar Utama</option>
                  <option value="ASSISTANT">Pengajar Pendamping</option>
                  <option value="SUBSTITUTE">Pengajar Pengganti</option>
                </Select>
                <FieldError errors={[form.formState.errors.assignmentType]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.validFrom)}>
                <FieldLabel htmlFor="assignment-start">Tanggal mulai</FieldLabel>
                <Input
                  id="assignment-start"
                  type="date"
                  disabled={isPending}
                  {...form.register("validFrom")}
                />
                <FieldError errors={[form.formState.errors.validFrom]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.validUntil)}>
                <FieldLabel htmlFor="assignment-end">Tanggal selesai</FieldLabel>
                <Input
                  id="assignment-end"
                  type="date"
                  disabled={isPending}
                  {...form.register("validUntil")}
                />
                <FieldError errors={[form.formState.errors.validUntil]} />
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
                  {isPending ? "Menyimpan..." : "Simpan Penugasan"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={closeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCloseTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akhiri penugasan?</AlertDialogTitle>
            <AlertDialogDescription>
              {closeTarget
                ? `${closeTarget.teacherName} tidak lagi bertugas di ${closeTarget.halaqahName} setelah tanggal yang dipilih.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={Boolean(closeError)}>
            <FieldLabel htmlFor="assignment-close-date">Tanggal selesai</FieldLabel>
            <Input
              id="assignment-close-date"
              type="date"
              value={closeDate}
              disabled={isPending}
              onChange={(event) => {
                setCloseDate(event.target.value);
                if (closeError) setCloseError("");
              }}
            />
            <FieldError>{closeError}</FieldError>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={closeAssignment}>
              {isPending ? "Menyimpan..." : "Akhiri Penugasan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getEmptyFormValues(): CreateTeacherAssignmentFormInput {
  return {
    halaqahId: "",
    teacherUserId: "",
    assignmentType: "PRIMARY",
    validFrom: currentDateValue(),
    validUntil: "",
  };
}

function AssignmentTypeBadge({
  type,
}: {
  type: TeacherAssignmentItem["assignmentType"];
}) {
  if (type === "PRIMARY") {
    return <Badge><CircleCheck aria-hidden="true" />Pengajar Utama</Badge>;
  }

  if (type === "ASSISTANT") {
    return <Badge variant="secondary">Pendamping</Badge>;
  }

  return <Badge variant="outline"><Clock3 aria-hidden="true" />Pengganti</Badge>;
}
