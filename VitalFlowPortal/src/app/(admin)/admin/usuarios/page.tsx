"use client";

import { Loader2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";

const initialForm = { name: "", email: "", username: "", password: "", role: "STAFF" as const };

export default function BackofficeUsersPage() {
  const utils = api.useUtils();
  const { data: users, isLoading, error } = api.staff.listBackofficeUsers.useQuery();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const createUser = api.staff.createBackofficeUser.useMutation({
    onSuccess: async () => {
      await utils.staff.listBackofficeUsers.invalidate();
      setForm(initialForm);
      setMessage("Usuario creado. Ya puede ingresar al Back Office.");
    },
    onError: (mutationError) => setMessage(mutationError.message),
  });

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Administración</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Usuarios Backoffice</h1>
        <p className="mt-2 text-sm text-slate-500">Cuentas habilitadas para revisar documentación y operar el Back Office.</p>
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form onSubmit={(event) => { event.preventDefault(); setMessage(""); createUser.mutate(form); }} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><UserPlus className="h-5 w-5 text-indigo-600" /><h2 className="font-bold text-slate-900">Crear usuario</h2></div>
          <Field label="Nombre completo" value={form.name} onChange={(value) => updateField("name", value)} />
          <Field label="Email (opcional)" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
          <Field label="Usuario" value={form.username} onChange={(value) => updateField("username", value)} />
          <Field label="Contraseña inicial" type="password" minLength={8} value={form.password} onChange={(value) => updateField("password", value)} />
          <label className="block text-xs font-bold text-slate-700">Rol
            <select value={form.role} onChange={(event) => updateField("role", event.target.value)} className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          {message && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
          <button type="submit" disabled={createUser.isPending} className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear usuario
          </button>
        </form>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-6"><Users className="h-5 w-5 text-indigo-600" /><h2 className="font-bold text-slate-900">Usuarios habilitados</h2></div>
          {isLoading ? <p className="p-6 text-sm text-slate-500">Cargando usuarios...</p> : error ? <p className="p-6 text-sm text-red-700">No tenés permisos para administrar usuarios.</p> : (
            <div className="divide-y divide-slate-100">
              {users?.map((user) => <div key={user.id} className="flex items-center justify-between gap-4 p-5">
                <div><p className="font-bold text-slate-900">{user.name ?? user.username}</p><p className="text-xs text-slate-500">{user.username}{user.email ? ` · ${user.email}` : ""}</p></div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" />{user.role}</span>
              </div>)}
              {!users?.length && <p className="p-6 text-sm text-slate-500">No hay usuarios Backoffice registrados.</p>}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function Field({ label, type = "text", minLength, value, onChange }: { label: string; type?: string; minLength?: number; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-bold text-slate-700">{label}<input required={label !== "Email (opcional)"} type={type} minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></label>;
}