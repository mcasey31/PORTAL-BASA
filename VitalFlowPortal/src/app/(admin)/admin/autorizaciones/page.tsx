"use client";

import { useState } from "react";
import { Check, ExternalLink, FileText, Search, Users, X } from "lucide-react";
import { api } from "~/trpc/react";

type Tab = "accounts" | "documents";

export default function BasaAuthorizationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [search, setSearch] = useState("");
  const [documentToReview, setDocumentToReview] = useState<{ name: string; document: string } | null>(null);
  const utils = api.useUtils();
  const { data: accounts = [], isLoading, error } = api.staff.getAuthorizationAccounts.useQuery(search ? { search } : undefined);
  const validateDependent = api.staff.validateDependent.useMutation({
    onSuccess: () => void utils.staff.getAuthorizationAccounts.invalidate(),
  });
  const pendingDocuments = accounts.flatMap((account) => account.dependentsAsPrincipal
    .filter((dependent) => dependent.status === "PENDING_REVIEW")
    .map((dependent) => ({ ...dependent, principalName: account.user.name ?? "Titular", principalDni: account.dni ?? "Sin DNI" })));

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <header>
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Portal Staff BASA</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Autorizaciones BASA</h1>
        <p className="mt-2 text-sm text-slate-500">Validación de integrantes y documentación enviada desde las cuentas del portal.</p>
      </header>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={activeTab === "accounts"} onClick={() => setActiveTab("accounts")}>Cuentas / Integrantes</TabButton>
        <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")}>Documentación <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{pendingDocuments.length}</span></TabButton>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por DNI, titular o integrante" className="w-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-500" />
      </div>

      {isLoading ? <p className="py-12 text-sm text-slate-500">Cargando cuentas...</p> : error ? <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.data?.code === "UNAUTHORIZED" ? "La sesión venció. Iniciá sesión nuevamente para consultar documentación." : error.data?.code === "FORBIDDEN" ? "Tu cuenta no tiene permisos de Staff o Administrador para consultar documentación." : "No se pudieron cargar las cuentas. Revisá la conexión e intentá nuevamente."}</p> : activeTab === "accounts" ? (
        <div className="space-y-4">
          {accounts.map((account) => (
            <article key={account.id} className="border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-base font-black text-slate-900">{account.user.name ?? "Titular sin nombre"}</p><p className="text-xs font-bold text-slate-500">{account.tipoDocumentoCodigo}: {account.dni ?? "Sin DNI"}</p></div>
                <span className="text-xs font-bold text-slate-400">{account.dependentsAsPrincipal.length} integrante{account.dependentsAsPrincipal.length === 1 ? "" : "s"}</span>
              </div>
              {account.dependentsAsPrincipal.length > 0 ? account.dependentsAsPrincipal.map((dependent) => <DependentRow key={dependent.id} dependent={dependent} onReview={() => setDocumentToReview({ name: dependent.name, document: dependent.relationshipDocument })} onValidate={(status) => validateDependent.mutate({ dependentId: dependent.id, status })} isUpdating={validateDependent.isPending} />) : <p className="p-5 text-sm text-slate-500">Esta cuenta no tiene integrantes asociados.</p>}
            </article>
          ))}
          {accounts.length === 0 && <p className="py-12 text-sm text-slate-500">No se encontraron cuentas para la búsqueda.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-175 text-left text-sm"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400"><tr><th className="px-5 py-4">Titular</th><th className="px-5 py-4">Integrante</th><th className="px-5 py-4">Documento</th><th className="px-5 py-4">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">
            {pendingDocuments.map((dependent) => <tr key={dependent.id}><td className="px-5 py-4"><p className="font-bold text-slate-900">{dependent.principalName}</p><p className="text-xs text-slate-500">DNI {dependent.principalDni}</p></td><td className="px-5 py-4"><p className="font-bold text-slate-900">{dependent.name}</p><p className="text-xs text-slate-500">{dependent.tipoDocumentoCodigo} {dependent.dni}</p></td><td className="px-5 py-4"><button onClick={() => setDocumentToReview({ name: dependent.name, document: dependent.relationshipDocument })} className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800"><FileText className="h-4 w-4" /> Revisar</button></td><td className="px-5 py-4"><ValidationActions onValidate={(status) => validateDependent.mutate({ dependentId: dependent.id, status })} isUpdating={validateDependent.isPending} /></td></tr>)}
            {pendingDocuments.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-500">No hay documentos pendientes de validar.</td></tr>}
          </tbody></table>
        </div>
      )}

      {documentToReview && <DocumentModal name={documentToReview.name} document={documentToReview.document} onClose={() => setDocumentToReview(null)} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`px-4 py-3 text-xs font-black uppercase tracking-wider ${active ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-400 hover:text-slate-700"}`}>{children}</button>; }
function DependentRow({ dependent, onReview, onValidate, isUpdating }: { dependent: { name: string; dni: string; tipoDocumentoCodigo: string; status: "PENDING_REVIEW" | "ACTIVE" | "REJECTED"; relationshipDocument: string }; onReview: () => void; onValidate: (status: "ACTIVE" | "REJECTED") => void; isUpdating: boolean }) { return <div className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><Users className="h-4 w-4 text-slate-400" /><div><p className="font-bold text-slate-900">{dependent.name}</p><p className="text-xs text-slate-500">{dependent.tipoDocumentoCodigo}: {dependent.dni}</p></div></div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={dependent.status} />{dependent.status === "PENDING_REVIEW" && <><button onClick={onReview} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><FileText className="h-4 w-4" /> Documento</button><ValidationActions onValidate={onValidate} isUpdating={isUpdating} /></>}</div></div>; }
function StatusBadge({ status }: { status: "PENDING_REVIEW" | "ACTIVE" | "REJECTED" }) { const labels = { PENDING_REVIEW: "Pendiente de validar", ACTIVE: "Validado", REJECTED: "Rechazado" }; const colors = { PENDING_REVIEW: "bg-amber-100 text-amber-800", ACTIVE: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-800" }; return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${colors[status]}`}>{labels[status]}</span>; }
function ValidationActions({ onValidate, isUpdating }: { onValidate: (status: "ACTIVE" | "REJECTED") => void; isUpdating: boolean }) { return <div className="flex gap-2"><button disabled={isUpdating} onClick={() => onValidate("ACTIVE")} className="inline-flex items-center gap-1 bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Validar</button><button disabled={isUpdating} onClick={() => onValidate("REJECTED")} className="inline-flex items-center gap-1 border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Rechazar</button></div>; }
function DocumentModal({ name, document, onClose }: { name: string; document: string; onClose: () => void }) { const isPdf = document.startsWith("data:application/pdf"); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="font-black text-slate-900">Documento de {name}</h2><button onClick={onClose} className="p-2 text-slate-500"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">{isPdf ? <iframe src={document} title={`Documento de ${name}`} className="h-[70vh] w-full bg-white" /> : <img src={document} alt={`Documento de ${name}`} className="mx-auto max-h-[70vh] max-w-full object-contain" />}</div></div></div>; }