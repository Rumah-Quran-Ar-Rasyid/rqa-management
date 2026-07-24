"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UsersRound,
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
  FieldDescription,
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
import type { RoleCode } from "@/generated/prisma/enums";
import {
  changeUserRoleAction,
  changeUserStatusAction,
  createTeacherAction,
} from "@/modules/users/application/actions";
import type { UserDirectoryItem } from "@/modules/users/application/user-service";
import { canChangeUserStatus } from "@/modules/users/domain/user-management-policy";
import { createTeacherSchema } from "@/modules/users/domain/user-schemas";

const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: "Admin",
  HEAD: "Kepala",
  TEACHER: "Pengajar",
};

const STATUS_LABELS = {
  ACTIVE: "Aktif",
  INVITED: "Belum aktif",
  SUSPENDED: "Ditangguhkan",
  INACTIVE: "Nonaktif",
} as const;

const teacherFormSchema = createTeacherSchema
  .extend({
    passwordConfirmation: z.string().min(1, "Ulangi kata sandi awal."),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Konfirmasi kata sandi belum sama.",
    path: ["passwordConfirmation"],
  });

type TeacherFormValues = z.output<typeof teacherFormSchema>;
type TeacherFormInput = z.input<typeof teacherFormSchema>;

type Confirmation =
  | {
      kind: "status";
      user: UserDirectoryItem;
      status: "ACTIVE" | "INACTIVE";
    }
  | {
      kind: "role";
      user: UserDirectoryItem;
      role: RoleCode;
      operation: "ASSIGN" | "REVOKE";
    };

export function UsersManagement({
  actorId,
  actorRoles,
  canCreate,
  manageableRoles,
  users,
}: {
  actorId: string;
  actorRoles: RoleCode[];
  canCreate: boolean;
  manageableRoles: RoleCode[];
  users: UserDirectoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<UserDirectoryItem | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const form = useForm<TeacherFormInput, unknown, TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  function handleCreate(values: TeacherFormValues) {
    const input = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    startTransition(async () => {
      const result = await createTeacherAction(input);

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

  function confirmChange() {
    if (!confirmation) {
      return;
    }

    startTransition(async () => {
      const result =
        confirmation.kind === "status"
          ? await changeUserStatusAction({
              userId: confirmation.user.id,
              status: confirmation.status,
            })
          : await changeUserRoleAction({
              userId: confirmation.user.id,
              role: confirmation.role,
              operation: confirmation.operation,
            });

      if (result.success) {
        toast.success(result.message);
        setRoleUser(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setConfirmation(null);
    });
  }

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.phone ?? ""].some((value) =>
      value.toLocaleLowerCase("id-ID").includes(normalizedQuery),
    ),
  );

  return (
    <>
      <div className="mb-7 flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Operasional</p>
          <h1 className="text-2xl font-semibold">Pengguna</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola akun Admin, Kepala, dan Pengajar.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, email, atau telepon"
              aria-label="Cari pengguna"
              className="pl-9"
            />
          </div>
          {canCreate ? (
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Tambah Pengajar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <UsersRound className="size-4" aria-hidden="true" />
        {normalizedQuery
          ? `${filteredUsers.length} hasil ditemukan`
          : `${users.length} pengguna terdaftar`}
      </div>

      {filteredUsers.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border py-0 shadow-sm">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="pl-4">Pengguna</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <RoleBadges roles={user.roles} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <UserActions
                            actorId={actorId}
                            actorRoles={actorRoles}
                            manageableRoles={manageableRoles}
                            user={user}
                            onManageRoles={() => setRoleUser(user)}
                            onChangeStatus={(status) =>
                              setConfirmation({ kind: "status", user, status })
                            }
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
            {filteredUsers.map((user) => (
              <Card key={user.id} size="sm" className="border shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{user.name}</CardTitle>
                      <CardDescription className="truncate">
                        {user.email}
                      </CardDescription>
                    </div>
                    <UserActions
                      actorId={actorId}
                      actorRoles={actorRoles}
                      manageableRoles={manageableRoles}
                      user={user}
                      onManageRoles={() => setRoleUser(user)}
                      onChangeStatus={(status) =>
                        setConfirmation({ kind: "status", user, status })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <RoleBadges roles={user.roles} />
                  <StatusBadge status={user.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 flex min-h-36 flex-col items-center justify-center rounded-[8px] border border-dashed bg-card px-4 text-center">
          <p className="font-medium">Pengguna tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba gunakan nama, email, atau nomor telepon lain.
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
            <DialogTitle>Tambah Pengajar</DialogTitle>
            <DialogDescription>
              Akun baru akan langsung aktif dengan role Pengajar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="teacher-name">Nama lengkap</FieldLabel>
                <Input
                  id="teacher-name"
                  autoComplete="name"
                  disabled={isPending}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.email)}>
                <FieldLabel htmlFor="teacher-email">Email</FieldLabel>
                <Input
                  id="teacher-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isPending}
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.phone)}>
                <FieldLabel htmlFor="teacher-phone">Nomor telepon</FieldLabel>
                <Input
                  id="teacher-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={isPending}
                  {...form.register("phone")}
                />
                <FieldDescription>Opsional.</FieldDescription>
                <FieldError errors={[form.formState.errors.phone]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.password)}>
                <FieldLabel htmlFor="teacher-password">
                  Kata sandi awal
                </FieldLabel>
                <Input
                  id="teacher-password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...form.register("password")}
                />
                <FieldDescription>Minimal 12 karakter.</FieldDescription>
                <FieldError errors={[form.formState.errors.password]} />
              </Field>
              <Field
                data-invalid={Boolean(form.formState.errors.passwordConfirmation)}
              >
                <FieldLabel htmlFor="teacher-password-confirmation">
                  Ulangi kata sandi awal
                </FieldLabel>
                <Input
                  id="teacher-password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  disabled={isPending}
                  {...form.register("passwordConfirmation")}
                />
                <FieldError
                  errors={[form.formState.errors.passwordConfirmation]}
                />
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isPending}>
                  <UserCheck aria-hidden="true" />
                  {isPending ? "Menyimpan..." : "Simpan Pengajar"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleUser !== null} onOpenChange={() => setRoleUser(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Kelola Role</DialogTitle>
            <DialogDescription>
              {roleUser?.name ?? "Pengguna"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {manageableRoles.map((role) => {
              const assigned = roleUser?.roles.includes(role) ?? false;

              return (
                <div
                  key={role}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{ROLE_LABELS[role]}</p>
                    <p className="text-sm text-muted-foreground">
                      {assigned ? "Role aktif" : "Belum diberikan"}
                    </p>
                  </div>
                  <Button
                    variant={assigned ? "outline" : "default"}
                    onClick={() => {
                      if (!roleUser) return;
                      setConfirmation({
                        kind: "role",
                        user: roleUser,
                        role,
                        operation: assigned ? "REVOKE" : "ASSIGN",
                      });
                    }}
                    disabled={isPending}
                  >
                    {assigned ? "Cabut" : "Berikan"}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-10 items-center justify-center rounded-[8px] bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{confirmationTitle(confirmation)}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDescription(confirmation)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={isDestructive(confirmation) ? "destructive" : "default"}
              disabled={isPending}
              onClick={confirmChange}
            >
              {isPending ? "Menyimpan..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UserActions({
  actorId,
  actorRoles,
  manageableRoles,
  user,
  onManageRoles,
  onChangeStatus,
}: {
  actorId: string;
  actorRoles: RoleCode[];
  manageableRoles: RoleCode[];
  user: UserDirectoryItem;
  onManageRoles: () => void;
  onChangeStatus: (status: "ACTIVE" | "INACTIVE") => void;
}) {
  const canChangeStatus = canChangeUserStatus({
    actorId,
    actorRoles,
    targetId: user.id,
    targetRoles: user.roles,
  });

  if (!canChangeStatus && manageableRoles.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title={`Aksi untuk ${user.name}`}
          aria-label={`Aksi untuk ${user.name}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aksi pengguna</DropdownMenuLabel>
        {manageableRoles.length > 0 ? (
          <DropdownMenuItem onSelect={onManageRoles}>
            <ShieldCheck aria-hidden="true" />
            Kelola role
          </DropdownMenuItem>
        ) : null}
        {manageableRoles.length > 0 && canChangeStatus ? (
          <DropdownMenuSeparator />
        ) : null}
        {canChangeStatus ? (
          <DropdownMenuItem
            variant={user.status === "ACTIVE" ? "destructive" : "default"}
            onSelect={() =>
              onChangeStatus(
                user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              )
            }
          >
            {user.status === "ACTIVE" ? (
              <UserMinus aria-hidden="true" />
            ) : (
              <UserCheck aria-hidden="true" />
            )}
            {user.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleBadges({ roles }: { roles: RoleCode[] }) {
  if (roles.length === 0) {
    return <span className="text-sm text-muted-foreground">Belum ada role</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Badge key={role} variant="outline">
          {ROLE_LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: UserDirectoryItem["status"] }) {
  return (
    <Badge variant={status === "ACTIVE" ? "secondary" : "outline"}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function confirmationTitle(confirmation: Confirmation | null) {
  if (!confirmation) return "Konfirmasi perubahan";

  if (confirmation.kind === "status") {
    return confirmation.status === "ACTIVE"
      ? "Aktifkan pengguna?"
      : "Nonaktifkan pengguna?";
  }

  return confirmation.operation === "ASSIGN"
    ? `Berikan role ${ROLE_LABELS[confirmation.role]}?`
    : `Cabut role ${ROLE_LABELS[confirmation.role]}?`;
}

function confirmationDescription(confirmation: Confirmation | null) {
  if (!confirmation) return "";

  if (confirmation.kind === "status") {
    return confirmation.status === "ACTIVE"
      ? `${confirmation.user.name} dapat kembali masuk setelah diaktifkan.`
      : `${confirmation.user.name} akan langsung keluar dari semua sesi aktif.`;
  }

  return confirmation.operation === "ASSIGN"
    ? `${confirmation.user.name} akan memperoleh akses ${ROLE_LABELS[confirmation.role]}.`
    : `${confirmation.user.name} akan kehilangan akses ${ROLE_LABELS[confirmation.role]}.`;
}

function isDestructive(confirmation: Confirmation | null) {
  return (
    confirmation?.kind === "status"
      ? confirmation.status === "INACTIVE"
      : confirmation?.operation === "REVOKE"
  );
}
