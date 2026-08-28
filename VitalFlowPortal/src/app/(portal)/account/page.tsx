"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  MapPin, 
  Shield, 
  Phone, 
  Mail, 
  Save, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  CreditCard,
  UserPlus,
  X,
  FileUp
} from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();
  
  const { data: profile, isLoading } = api.patient.getFullProfile.useQuery();
  const { data: insuranceProviders } = api.patient.getInsuranceProviders.useQuery();
  const { data: dependents, refetch: refetchDependents } = api.patient.getDependents.useQuery();
  const addDependent = api.patient.addDependent.useMutation({
    onSuccess: async () => {
      setDependentModalOpen(false);
      setDependentDocumentOpen(false);
      setDependentSuccess(true);
      await refetchDependents();
      setTimeout(() => setDependentSuccess(false), 3500);
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  
  const updateProfile = api.patient.updateFullProfile.useMutation({
    onSuccess: async () => {
      setSuccess(true);
      await utils.patient.getFullProfile.invalidate();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (e) => {
      setError(e.message);
      setTimeout(() => setError(""), 5000);
    }
  });

  const [formData, setFormData] = useState({
    email: "",
    image: null as string | null,
    tipoDocumentoCodigo: "DNI",
    dni: "",
    birthDate: "",
    name: "",
    gender: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
    insuranceProviderId: "",
    insurancePlanId: "",
    membershipNumber: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dependentModalOpen, setDependentModalOpen] = useState(false);
  const [dependentDocumentOpen, setDependentDocumentOpen] = useState(false);
  const [dependentSuccess, setDependentSuccess] = useState(false);
  const [dependentDocument, setDependentDocument] = useState<string | null>(null);
  const [dependentForm, setDependentForm] = useState({
    tipoDocumentoCodigo: "DNI",
    dni: "",
    name: "",
    birthDate: "",
    phoneNumber: "",
    address: "",
    insuranceProviderId: "",
    insurancePlanId: "",
    membershipNumber: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.user?.email || "",
        image: profile.user?.image || null,
        tipoDocumentoCodigo: profile.tipoDocumentoCodigo || "DNI",
        dni: profile.dni || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().slice(0, 10) : "",
        name: profile.user?.name || "",
        gender: profile.gender || "",
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        insuranceProviderId: profile.insuranceProviderId || "",
        insurancePlanId: profile.insurancePlanId || "",
        membershipNumber: profile.membershipNumber || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Seleccioná una imagen válida.");
      return;
    }
    if (file.size > 1_500_000) {
      setError("La foto debe pesar menos de 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const dependentProvider = insuranceProviders?.find((provider) => provider.id === dependentForm.insuranceProviderId);
  const dependentAge = dependentForm.birthDate ? (() => {
    const birth = new Date(`${dependentForm.birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
    return age;
  })() : null;

  const handleDependentDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Adjuntá una imagen o PDF válido.");
      return;
    }
    if (file.size > 6_000_000) {
      setError("El documento debe pesar menos de 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDependentDocument(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitDependent = () => {
    if (dependentAge !== null && dependentAge >= 16) {
      setError("No puede asociar este usuario. Crear una nueva cuenta.");
      return;
    }
    if (!dependentDocument) {
      setDependentDocumentOpen(true);
      return;
    }
    addDependent.mutate({ ...dependentForm, relationshipDocument: dependentDocument });
  };

  const selectedProvider = insuranceProviders?.find(p => p.id === formData.insuranceProviderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-blue-600"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Gestión de Perfil</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight font-outfit uppercase">Mi Cuenta</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Administra tus datos personales y cobertura médica.</p>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl active:scale-95 text-[10px] uppercase tracking-widest w-full md:w-auto"
          >
            <Edit3 className="w-4 h-4" />
            Editar Datos
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
             <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-4 bg-white text-slate-500 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-[10px] uppercase tracking-widest w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
          </div>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Perfil actualizado con éxito</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Foto y Básicos */}
        <div className="md:col-span-1 space-y-8">
            <div className="soft-card p-8 flex flex-col items-center text-center">
                <div className="relative group">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl overflow-hidden ring-8 ring-slate-50 transition-transform group-hover:scale-105 duration-500 italic">
                            {(formData.image || profile?.user?.image) ? (
                              <img src={formData.image || profile?.user?.image || ""} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            profile?.user?.name?.charAt(0) || "U"
                        )}
                    </div>
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 cursor-pointer rounded-2xl bg-blue-600 p-3 text-white shadow-xl transition-all hover:bg-blue-700">
                            <Camera className="w-4 h-4" />
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="sr-only" />
                        </label>
                    )}
                </div>
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-slate-900">{profile?.user?.name}</h3>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{profile?.tipoDocumentoCodigo || "DNI"}: {profile?.dni || 'No cargado'}</p>
                </div>
            </div>

            <div className="soft-card p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                    {isEditing ? (
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg bg-slate-50 p-1 text-xs font-bold focus:ring-1 focus:ring-blue-500" />
                    ) : <span className="text-xs font-bold">{profile?.user?.email}</span>}
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <Phone className="w-4 h-4" />
                    {isEditing ? (
                        <input 
                            type="text"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className="text-xs font-bold bg-slate-50 border-none rounded-lg w-full p-1 focus:ring-1 focus:ring-blue-500"
                        />
                    ) : (
                        <span className="text-xs font-bold">{profile?.phoneNumber || "Sin teléfono"}</span>
                    )}
                </div>
            </div>
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="md:col-span-2 space-y-8">
            {/* Datos Filiatorios & Ubicación */}
            <div className="soft-card p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <MapPin className="w-5 h-5 text-slate-900" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Datos de Contacto y Ubicación</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                        <input 
                      disabled
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
                        />
                    </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de documento</label>
                          <input disabled type="text" value={formData.tipoDocumentoCodigo} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm disabled:opacity-60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de documento</label>
                          <input disabled type="text" value={formData.dni} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm disabled:opacity-60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de nacimiento</label>
                          <input disabled type="date" value={formData.birthDate} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm disabled:opacity-60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sexo</label>
                          {isEditing ? (
                            <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20">
                            <option value="">Sin informar</option>
                            <option value="F">Femenino</option>
                            <option value="M">Masculino</option>
                            <option value="X">X / No binario</option>
                            </select>
                          ) : <input disabled type="text" value={formData.gender || "Sin informar"} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm disabled:opacity-60" />}
                        </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección</label>
                        <input 
                            disabled={!isEditing}
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudad</label>
                        <input 
                            disabled={!isEditing}
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Postal</label>
                        <input 
                            disabled={!isEditing}
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
                        />
                    </div>
                </div>
            </div>

            {/* Cobertura Médica */}
            <div className="soft-card p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <Shield className="w-5 h-5 text-slate-900" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Cobertura Médica</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obra Social / Prepaga</label>
                        <select 
                            disabled={!isEditing}
                            value={formData.insuranceProviderId}
                            onChange={(e) => setFormData({...formData, insuranceProviderId: e.target.value, insurancePlanId: ""})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 appearance-none"
                        >
                            <option value="">Seleccionar...</option>
                            {insuranceProviders?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</label>
                        <select 
                            disabled={!isEditing || !formData.insuranceProviderId}
                            value={formData.insurancePlanId}
                            onChange={(e) => setFormData({...formData, insurancePlanId: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 appearance-none"
                        >
                            <option value="">Seleccionar Plan...</option>
                            {selectedProvider?.plans.map(plan => (
                                <option key={plan.id} value={plan.id}>{plan.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Credencial / Afiliado</label>
                        <div className="relative">
                            <input 
                                disabled={!isEditing}
                                type="text"
                                value={formData.membershipNumber}
                                onChange={(e) => setFormData({...formData, membershipNumber: e.target.value})}
                                className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
                            />
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                {!isEditing && profile?.insurance && (
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{profile.insurance.name}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Plan {profile.plan?.name}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Activo</span>
                    </div>
                )}
            </div>
        </div>
      </form>

      <section className="soft-card p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Asociar Menores a Cargo a una cuenta Mayor</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">Gestioná el acceso de tus hijos o menores a cargo desde tu cuenta principal.</p>
          </div>
          <button type="button" onClick={() => { setError(""); setDependentModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            <UserPlus className="h-4 w-4" /> Agregar Familiar Menor de Edad
          </button>
        </div>
        {dependentSuccess && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">El menor fue asociado correctamente y quedó pendiente de revisión.</p>}
        {dependents && dependents.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{dependents.map((dependent) => <div key={dependent.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="font-bold text-slate-900">{dependent.name}</p><p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-600">{dependent.tipoDocumentoCodigo}: {dependent.dni}</p><p className="mt-2 text-xs text-slate-500">Estado: {dependent.status === "PENDING_REVIEW" ? "Pendiente de revisión" : dependent.status}</p></div>)}</div>}
      </section>

      {dependentModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Cuenta principal</p><h2 className="mt-2 text-2xl font-black text-slate-900">Agregar Familiar Menor de Edad</h2><p className="mt-2 text-sm text-slate-500">Completá los datos del menor para asociarlo a tu cuenta.</p></div><button type="button" onClick={() => setDependentModalOpen(false)} aria-label="Cerrar" className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Tipo de documento</span><select value={dependentForm.tipoDocumentoCodigo} onChange={(e) => setDependentForm({...dependentForm, tipoDocumentoCodigo: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option>DNI</option><option>PASAPORTE</option><option>LIBRETA_CIVICA</option><option>CEDULA_IDENTIDAD</option></select></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Número de documento</span><input value={dependentForm.dni} onChange={(e) => setDependentForm({...dependentForm, dni: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" required /></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Nombre y apellido</span><input value={dependentForm.name} onChange={(e) => setDependentForm({...dependentForm, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" required /></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Fecha de nacimiento</span><input type="date" value={dependentForm.birthDate} onChange={(e) => setDependentForm({...dependentForm, birthDate: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" required /></label>
              {dependentAge !== null && dependentAge >= 16 && <p className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-700">No puede asociar este usuario. Crear una nueva cuenta.</p>}
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Dirección</span><input value={dependentForm.address} onChange={(e) => setDependentForm({...dependentForm, address: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" required /></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Teléfono</span><input value={dependentForm.phoneNumber} onChange={(e) => setDependentForm({...dependentForm, phoneNumber: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" required /></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Obra Social / Prepaga</span><select value={dependentForm.insuranceProviderId} onChange={(e) => setDependentForm({...dependentForm, insuranceProviderId: e.target.value, insurancePlanId: ""})} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Seleccionar...</option>{insuranceProviders?.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
              <label className="space-y-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Plan</span><select value={dependentForm.insurancePlanId} onChange={(e) => setDependentForm({...dependentForm, insurancePlanId: e.target.value})} disabled={!dependentProvider} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Seleccionar...</option>{dependentProvider?.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
              <label className="space-y-2 md:col-span-2"><span className="block text-xs font-black uppercase tracking-widest text-slate-500">Número de afiliado</span><input value={dependentForm.membershipNumber} onChange={(e) => setDependentForm({...dependentForm, membershipNumber: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDependentModalOpen(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600">Cancelar</button><button type="button" disabled={dependentAge === null || dependentAge >= 16} onClick={() => setDependentDocumentOpen(true)} className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-300">Asociar Menor a cuenta Principal</button></div>
          </div>
        </div>
      )}

      {dependentDocumentOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Último paso</p><h2 className="mt-2 text-2xl font-black text-slate-900">Informá documento que garantice la relación con el menor</h2></div><button type="button" onClick={() => setDependentDocumentOpen(false)} aria-label="Cerrar" className="rounded-xl p-2 text-slate-400 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm leading-relaxed text-slate-600">Adjuntá una imagen o PDF que acredite el vínculo. El archivo quedará asociado para revisión.</p><label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-blue-300"><FileUp className="h-8 w-8 text-blue-600" /><span className="mt-3 text-xs font-black uppercase tracking-widest text-slate-600">Seleccionar documento</span><span className="mt-2 text-xs text-slate-400">PDF, JPG, PNG o WEBP hasta 6 MB</span><input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleDependentDocument} className="sr-only" /></label>{dependentDocument && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">Documento listo para adjuntar.</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDependentDocumentOpen(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600">Volver</button><button type="button" disabled={!dependentDocument || addDependent.isPending} onClick={submitDependent} className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-300">{addDependent.isPending ? "Asociando..." : "Asociar y enviar"}</button></div></div></div>
      )}
    </div>
  );
}
