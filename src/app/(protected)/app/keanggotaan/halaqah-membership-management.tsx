"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Clock3, School, UserRoundPlus } from "lucide-react";
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
import { createOrMoveHalaqahMembershipAction } from "@/modules/memberships/application/actions";
import type {
  HalaqahMembershipItem,
  MembershipOption,
} from "@/modules/memberships/application/halaqah-membership-service";
import {
  createHalaqahMembershipSchema,
  type CreateHalaqahMembershipInput,
} from "@/modules/memberships/domain/halaqah-membership-schemas";

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

export function HalaqahMembershipManagement({
  canManage,
  halaqahs,
  memberships,
  students,
}: {
  canManage: boolean;
  halaqahs: MembershipOption[];
  memberships: HalaqahMembershipItem[];
  students: MembershipOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const form = useForm<CreateHalaqahMembershipInput>({
    resolver: zodResolver(createHalaqahMembershipSchema),
    defaultValues: emptyFormValues(),
  });
  const selectedStudentId = useWatch({
    control: form.control,
    name: "studentId",
  });
  const selectedMembership = memberships.find(
    (membership) =>
      membership.studentId === selectedStudentId &&
      membership.status === "ACTIVE" &&
      membership.validUntil === null,
  );

  function openCreateForm() {
    form.reset(emptyFormValues());
    setFormOpen(true);
  }

  function handleSubmit(values: CreateHalaqahMembershipInput) {
    startTransition(async () => {
      const result = await createOrMoveHalaqahMembershipAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setFormOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Operasional</p>
          <h1 className="text-2xl font-semibold">Keanggotaan Halaqah</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tempatkan santri pada halaqah dan simpan riwayat perpindahannya.
          </p>
        </div>
        {canManage ? (
          <Button size="lg" onClick={openCreateForm}>
            <UserRoundPlus aria-hidden="true" />
            Tempatkan Santri
          </Button>
        ) : null}
      </div>

      {memberships.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Santri</TableHead>
                      <TableHead>Halaqah</TableHead>
                      <TableHead>Masa berlaku</TableHead>
                      <TableHead className="pr-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((membership) => (
                      <TableRow key={membership.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{membership.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {membership.studentNumber}
                          </p>
                        </TableCell>
                        <TableCell>{membership.halaqahName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(membership.validFrom)}
                          {membership.validUntil
                            ? ` - ${formatDate(membership.validUntil)}`
                            : " - seterusnya"}
                        </TableCell>
                        <TableCell className="pr-4">
                          <MembershipStatusBadge status={membership.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:hidden">
            {memberships.map((membership) => (
              <Card key={membership.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{membership.studentName}</CardTitle>
                      <CardDescription>{membership.studentNumber}</CardDescription>
                    </div>
                    <MembershipStatusBadge status={membership.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    <School className="size-4 text-muted-foreground" aria-hidden="true" />
                    {membership.halaqahName}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(membership.validFrom)}
                    {membership.validUntil
                      ? ` - ${formatDate(membership.validUntil)}`
                      : " - seterusnya"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <School className="mb-3 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Belum ada santri di halaqah</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tempatkan santri aktif pada halaqah aktif untuk memulai persiapan setoran.
          </p>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) form.reset(emptyFormValues());
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Tempatkan Santri</DialogTitle>
            <DialogDescription>
              Jika santri masih aktif di halaqah lain, sistem akan menutup
              penempatan sebelumnya sehari sebelum tanggal mulai baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.studentId)}>
                <FieldLabel htmlFor="membership-student">Santri</FieldLabel>
                <Select
                  id="membership-student"
                  disabled={isPending || students.length === 0}
                  {...form.register("studentId")}
                >
                  <option value="">Pilih santri</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.label}
                    </option>
                  ))}
                </Select>
                <FieldError errors={[form.formState.errors.studentId]} />
              </Field>
              {selectedMembership ? (
                <div className="rounded-[8px] border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                  Saat ini santri berada di {selectedMembership.halaqahName}.
                </div>
              ) : null}
              <Field data-invalid={Boolean(form.formState.errors.halaqahId)}>
                <FieldLabel htmlFor="membership-halaqah">Halaqah</FieldLabel>
                <Select
                  id="membership-halaqah"
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
              <Field data-invalid={Boolean(form.formState.errors.validFrom)}>
                <FieldLabel htmlFor="membership-start">Tanggal mulai</FieldLabel>
                <Input
                  id="membership-start"
                  type="date"
                  disabled={isPending}
                  {...form.register("validFrom")}
                />
                <FieldError errors={[form.formState.errors.validFrom]} />
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
                  {isPending ? "Menyimpan..." : "Simpan Keanggotaan"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function emptyFormValues(): CreateHalaqahMembershipInput {
  return {
    studentId: "",
    halaqahId: "",
    validFrom: currentDateValue(),
  };
}

function MembershipStatusBadge({
  status,
}: {
  status: HalaqahMembershipItem["status"];
}) {
  if (status === "ACTIVE") {
    return <Badge><CircleCheck aria-hidden="true" />Aktif</Badge>;
  }

  return <Badge variant="secondary"><Clock3 aria-hidden="true" />Ditutup</Badge>;
}
