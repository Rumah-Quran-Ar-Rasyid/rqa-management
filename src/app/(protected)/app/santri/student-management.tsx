"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  CheckCircle2,
  ContactRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UserMinus,
  UserRound,
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
import {
  changeStudentStatusAction,
  createStudentAction,
  updateStudentAction,
} from "@/modules/students/application/actions";
import type { StudentDirectoryItem } from "@/modules/students/application/student-service";
import { createStudentSchema } from "@/modules/students/domain/student-schemas";

type StudentFormInput = z.input<typeof createStudentSchema>;
type StudentFormValues = z.output<typeof createStudentSchema>;

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

export function StudentManagement({
  canManage,
  students,
}: {
  canManage: boolean;
  students: StudentDirectoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentDirectoryItem | null>(null);
  const [archiveTarget, setArchiveTarget] =
    useState<StudentDirectoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const form = useForm<StudentFormInput, unknown, StudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: getEmptyFormValues(),
  });

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const filteredStudents = students.filter((student) =>
    [
      student.studentNumber,
      student.fullName,
      student.preferredName ?? "",
      student.primaryGuardian?.fullName ?? "",
      student.primaryGuardian?.phone ?? "",
    ].some((value) => value.toLocaleLowerCase("id-ID").includes(normalizedQuery)),
  );

  function resetForm() {
    form.reset(getEmptyFormValues());
    setEditingStudent(null);
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(student: StudentDirectoryItem) {
    setEditingStudent(student);
    form.reset({
      studentNumber: student.studentNumber,
      fullName: student.fullName,
      preferredName: student.preferredName ?? "",
      joinedAt: student.joinedAt,
      guardianFullName: student.primaryGuardian?.fullName ?? "",
      guardianPhone: student.primaryGuardian?.phone ?? "",
      guardianEmail: student.primaryGuardian?.email ?? "",
      guardianRelationship: student.primaryGuardian?.relationship ?? "",
    });
    setFormOpen(true);
  }

  function handleSubmit(values: StudentFormValues) {
    startTransition(async () => {
      const result = editingStudent
        ? await updateStudentAction({ studentId: editingStudent.id, ...values })
        : await createStudentAction(values);

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
    student: StudentDirectoryItem,
    status: "ACTIVE" | "INACTIVE",
  ) {
    startTransition(async () => {
      const result = await changeStudentStatusAction({
        studentId: student.id,
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

  function archiveStudent() {
    if (!archiveTarget) {
      return;
    }

    startTransition(async () => {
      const result = await changeStudentStatusAction({
        studentId: archiveTarget.id,
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
            <h1 className="text-2xl font-semibold">Santri</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola identitas santri dan kontak wali utama.
            </p>
          </div>
          {canManage ? (
            <Button size="lg" onClick={openCreateForm}>
              <Plus aria-hidden="true" />
              Tambah Santri
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
            placeholder="Cari nama, nomor, atau wali"
            aria-label="Cari santri"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <UserRound className="size-4" aria-hidden="true" />
        {normalizedQuery
          ? `${filteredStudents.length} hasil ditemukan`
          : `${students.length} santri terdaftar`}
      </div>

      {filteredStudents.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Santri</TableHead>
                      <TableHead>Wali utama</TableHead>
                      <TableHead>Bergabung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.studentNumber}
                            {student.preferredName
                              ? ` · ${student.preferredName}`
                              : ""}
                          </p>
                        </TableCell>
                        <TableCell>
                          {student.primaryGuardian ? (
                            <>
                              <p className="text-sm font-medium">
                                {student.primaryGuardian.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.primaryGuardian.phone}
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Belum dicatat</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(student.joinedAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={student.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <StudentActions
                            canManage={canManage}
                            student={student}
                            onEdit={() => openEditForm(student)}
                            onStatusChange={(status) => changeStatus(student, status)}
                            onArchive={() => setArchiveTarget(student)}
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
            {filteredStudents.map((student) => (
              <Card key={student.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{student.fullName}</CardTitle>
                      <CardDescription>
                        {student.studentNumber}
                        {student.preferredName
                          ? ` · ${student.preferredName}`
                          : ""}
                      </CardDescription>
                    </div>
                    <StudentActions
                      canManage={canManage}
                      student={student}
                      onEdit={() => openEditForm(student)}
                      onStatusChange={(status) => changeStatus(student, status)}
                      onArchive={() => setArchiveTarget(student)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <StatusBadge status={student.status} />
                  {student.primaryGuardian ? (
                    <div className="flex items-start gap-2 text-sm">
                      <ContactRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{student.primaryGuardian.fullName}</p>
                        <p className="text-muted-foreground">
                          {student.primaryGuardian.relationship} · {student.primaryGuardian.phone}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <UserRound className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">
            {normalizedQuery ? "Santri tidak ditemukan" : "Belum ada santri"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {normalizedQuery
              ? "Coba gunakan nama, nomor santri, atau kontak wali lain."
              : "Tambah santri untuk melanjutkan penyiapan halaqah."}
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
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Ubah Santri" : "Tambah Santri"}
            </DialogTitle>
            <DialogDescription>
              Kontak wali utama dapat dicatat sekarang atau dilengkapi kemudian.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <p className="text-sm font-medium">Identitas santri</p>
              <Field data-invalid={Boolean(form.formState.errors.studentNumber)}>
                <FieldLabel htmlFor="student-number">Nomor santri</FieldLabel>
                <Input
                  id="student-number"
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("studentNumber")}
                />
                <FieldError errors={[form.formState.errors.studentNumber]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.fullName)}>
                <FieldLabel htmlFor="student-full-name">Nama lengkap</FieldLabel>
                <Input
                  id="student-full-name"
                  autoComplete="name"
                  disabled={isPending}
                  {...form.register("fullName")}
                />
                <FieldError errors={[form.formState.errors.fullName]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.preferredName)}>
                <FieldLabel htmlFor="student-preferred-name">Nama panggilan</FieldLabel>
                <Input
                  id="student-preferred-name"
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("preferredName")}
                />
                <FieldError errors={[form.formState.errors.preferredName]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.joinedAt)}>
                <FieldLabel htmlFor="student-joined-at">Tanggal bergabung</FieldLabel>
                <Input
                  id="student-joined-at"
                  type="date"
                  disabled={isPending}
                  {...form.register("joinedAt")}
                />
                <FieldError errors={[form.formState.errors.joinedAt]} />
              </Field>

              <div className="border-t pt-5">
                <p className="text-sm font-medium">Wali utama (opsional)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Isi seluruh data inti jika kontak wali akan dicatat.
                </p>
              </div>
              <Field data-invalid={Boolean(form.formState.errors.guardianFullName)}>
                <FieldLabel htmlFor="guardian-full-name">Nama wali</FieldLabel>
                <Input
                  id="guardian-full-name"
                  autoComplete="name"
                  disabled={isPending}
                  {...form.register("guardianFullName")}
                />
                <FieldError errors={[form.formState.errors.guardianFullName]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.guardianRelationship)}>
                <FieldLabel htmlFor="guardian-relationship">Hubungan dengan santri</FieldLabel>
                <Input
                  id="guardian-relationship"
                  placeholder="Contoh: Ibu"
                  autoComplete="off"
                  disabled={isPending}
                  {...form.register("guardianRelationship")}
                />
                <FieldError errors={[form.formState.errors.guardianRelationship]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.guardianPhone)}>
                <FieldLabel htmlFor="guardian-phone">Nomor telepon wali</FieldLabel>
                <Input
                  id="guardian-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={isPending}
                  {...form.register("guardianPhone")}
                />
                <FieldError errors={[form.formState.errors.guardianPhone]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.guardianEmail)}>
                <FieldLabel htmlFor="guardian-email">Email wali</FieldLabel>
                <Input
                  id="guardian-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isPending}
                  {...form.register("guardianEmail")}
                />
                <FieldError errors={[form.formState.errors.guardianEmail]} />
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
                    : editingStudent
                      ? "Simpan Perubahan"
                      : "Simpan Santri"}
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
            <AlertDialogTitle>Arsipkan santri?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget
                ? `${archiveTarget.fullName} tidak dapat diaktifkan atau diubah kembali.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={archiveStudent}>
              {isPending ? "Menyimpan..." : "Arsipkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getEmptyFormValues(): StudentFormInput {
  return {
    studentNumber: "",
    fullName: "",
    preferredName: "",
    joinedAt: currentDateValue(),
    guardianFullName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelationship: "",
  };
}

function StatusBadge({
  status,
}: {
  status: StudentDirectoryItem["status"];
}) {
  if (status === "ACTIVE") {
    return <Badge><CheckCircle2 aria-hidden="true" />Aktif</Badge>;
  }

  if (status === "INACTIVE") {
    return <Badge variant="secondary"><UserMinus aria-hidden="true" />Nonaktif</Badge>;
  }

  return <Badge variant="outline"><Archive aria-hidden="true" />Diarsipkan</Badge>;
}

function StudentActions({
  canManage,
  student,
  onEdit,
  onStatusChange,
  onArchive,
}: {
  canManage: boolean;
  student: StudentDirectoryItem;
  onEdit: () => void;
  onStatusChange: (status: "ACTIVE" | "INACTIVE") => void;
  onArchive: () => void;
}) {
  if (!canManage || student.status === "ARCHIVED") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Aksi untuk ${student.fullName}`}
          title={`Aksi untuk ${student.fullName}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aksi santri</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Ubah
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {student.status === "ACTIVE" ? (
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
