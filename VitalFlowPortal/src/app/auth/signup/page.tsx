"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

type Plan = { id: string; name: string };
type Provider = { id: string; name: string; plans: Plan[] };
type ProvinceOption = {
  value: string;
  label: string;
  areaCode: string;
  cities: { value: string; label: string; postalCode: string }[];
};

const exampleProviders: Provider[] = [
  { id: "osde", name: "OSDE", plans: [{ id: "osde-basica", name: "Básica" }, { id: "osde-plus", name: "Plus" }, { id: "osde-oro", name: "Oro" }] },
  { id: "swiss-medical", name: "Swiss Medical", plans: [{ id: "swiss-standard", name: "Standard" }, { id: "swiss-oro", name: "Oro" }, { id: "swiss-platinum", name: "Platinum" }] },
  { id: "galeno", name: "Galeno", plans: [{ id: "galeno-club", name: "Club" }, { id: "galeno-elite", name: "Elite" }] },
  { id: "medicus", name: "Medicus", plans: [{ id: "medicus-100", name: "100" }, { id: "medicus-200", name: "200" }] },
];

const argentinaProvinces: ProvinceOption[] = [
  { value: "caba", label: "CABA", areaCode: "11", cities: [{ value: "caba", label: "CABA", postalCode: "C1040AA0" }, { value: "villa-crespo", label: "Villa Crespo", postalCode: "C1414" }, { value: "palermo", label: "Palermo", postalCode: "C1000" }] },
  { value: "bsas", label: "Buenos Aires", areaCode: "11", cities: [{ value: "la-plata", label: "La Plata", postalCode: "1900" }, { value: "mar-del-plata", label: "Mar del Plata", postalCode: "7600" }, { value: "bahia-blanca", label: "Bahía Blanca", postalCode: "8000" }] },
  { value: "cordoba", label: "Córdoba", areaCode: "351", cities: [{ value: "cordoba-capital", label: "Córdoba Capital", postalCode: "5000" }, { value: "rio-cuarto", label: "Río Cuarto", postalCode: "5800" }] },
  { value: "santa-fe", label: "Santa Fe", areaCode: "342", cities: [{ value: "santa-fe", label: "Santa Fe", postalCode: "3000" }, { value: "rosario", label: "Rosario", postalCode: "2000" }] },
  { value: "mendoza", label: "Mendoza", areaCode: "261", cities: [{ value: "mendoza-capital", label: "Mendoza Capital", postalCode: "5500" }, { value: "san-juan", label: "San Rafael", postalCode: "5600" }] },
  { value: "tucuman", label: "Tucumán", areaCode: "381", cities: [{ value: "san-miguel", label: "San Miguel de Tucumán", postalCode: "4000" }] },
  { value: "salta", label: "Salta", areaCode: "387", cities: [{ value: "salta-capital", label: "Salta Capital", postalCode: "4400" }] },
  { value: "neuquen", label: "Neuquén", areaCode: "299", cities: [{ value: "neuquen", label: "Neuquén", postalCode: "8300" }] },
  { value: "misiones", label: "Misiones", areaCode: "375", cities: [{ value: "posadas", label: "Posadas", postalCode: "3300" }] },
];

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function BasaBrandMark() {
  return (
    <div className="mx-auto mb-6 flex w-full justify-center">
      <img
        src="https://redbasa.com.ar/wp-content/uploads/2019/12/logo-redbasa-color-260x78.png"
        alt="RED BASA"
        className="h-auto w-[220px] max-w-full object-contain sm:w-[240px]"
      />
    </div>
  );
}

export default function SignUpPage() {
  const [providers, setProviders] = useState<Provider[]>(exampleProviders);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    dni: "",
    firstName: "",
    lastName: "",
    secondName: "",
    password: "",
    confirmPassword: "",
    phoneCountryCode: "+54",
    phoneAreaCode: "11",
    phoneNumber: "",
    province: "caba",
    city: "caba",
    postalCode: "C1040AA0",
    address: "",
    insuranceProviderId: "",
    insurancePlanId: "",
    membershipNumber: "",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/public/insurance-providers", { cache: "no-store" });
        const data = (await res.json()) as { providers?: Provider[]; error?: string };

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo cargar coberturas");
        }

        const nextProviders = data.providers && data.providers.length > 0 ? data.providers : exampleProviders;
        setProviders(nextProviders);
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setProviders(exampleProviders);
        }
      } finally {
        if (isMounted) {
          setLoadingProviders(false);
        }
      }
    };

    setLoadingProviders(false);
    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === form.insuranceProviderId),
    [providers, form.insuranceProviderId],
  );

  const selectedProvince = useMemo(
    () => argentinaProvinces.find((province) => province.value === form.province) ?? argentinaProvinces[0],
    [form.province],
  );

  const cityOptions = selectedProvince?.cities ?? [];

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "insuranceProviderId") {
        next.insurancePlanId = "";
      }

      if (field === "province") {
        const province = argentinaProvinces.find((item) => item.value === value) ?? argentinaProvinces[0];
        next.phoneAreaCode = province.areaCode;
        next.city = province.cities[0]?.value ?? "";
        next.postalCode = province.cities[0]?.postalCode ?? "";
      }

      if (field === "city") {
        const city = selectedProvince?.cities.find((item) => item.value === value);
        next.postalCode = city?.postalCode ?? next.postalCode;
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const normalizedDni = form.dni.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const password = form.password.trim();
    const phoneDigits = form.phoneNumber.replace(/\D/g, "");
    const validationErrors: Record<string, string> = {};

    if (!normalizedDni) validationErrors.dni = "Ingresá tu DNI.";
    else if (!/^\d{7,8}$/.test(normalizedDni)) validationErrors.dni = "El DNI debe tener entre 7 y 8 dígitos.";

    if (!firstName) validationErrors.firstName = "Ingresá tu nombre.";
    if (!lastName) validationErrors.lastName = "Ingresá tu apellido.";
    if (!form.address.trim()) validationErrors.address = "Ingresá tu dirección.";
    if (!form.province) validationErrors.province = "Seleccioná una provincia.";
    if (!form.city) validationErrors.city = "Seleccioná una ciudad.";
    if (!form.postalCode.trim()) validationErrors.postalCode = "Ingresá el código postal.";
    if (!form.insuranceProviderId) validationErrors.insuranceProviderId = "Elegí una prepaga o obra social.";
    if (!form.insurancePlanId) validationErrors.insurancePlanId = "Elegí un plan.";
    if (!password) validationErrors.password = "Ingresá una contraseña.";
    else if (!passwordPattern.test(password)) validationErrors.password = "La contraseña debe tener 8 caracteres, mayúscula, número y símbolo.";
    if (!form.confirmPassword) validationErrors.confirmPassword = "Confirmá tu contraseña.";
    else if (password !== form.confirmPassword) validationErrors.confirmPassword = "Las contraseñas no coinciden.";
    if (!phoneDigits) validationErrors.phoneNumber = "Ingresá tu teléfono.";
    else if (phoneDigits.length < 8 || phoneDigits.length > 12) validationErrors.phoneNumber = "El teléfono debe tener un número válido para Argentina.";

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Revisá los campos marcados en rojo.");
      return;
    }

    setSubmitting(true);
    try {
      const fullName = [form.firstName.trim(), form.secondName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: normalizedDni,
          password,
          name: fullName,
          phoneNumber: `${form.phoneCountryCode} ${form.phoneAreaCode} ${phoneDigits}`,
          address: form.address.trim(),
          city: form.city,
          postalCode: form.postalCode.trim(),
          province: form.province,
          insuranceProviderId: form.insuranceProviderId,
          insurancePlanId: form.insurancePlanId,
          membershipNumber: form.membershipNumber.trim(),
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setFieldErrors(data.fieldErrors);
          setError(data.message ?? "Revisá los campos marcados en rojo.");
          return;
        }
        throw new Error(data.error ?? data.message ?? "No se pudo crear la cuenta");
      }

      setSuccess("Cuenta creada. Ya podes iniciar sesion con tu DNI y contrasena.");
      setFieldErrors({});
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:flex md:items-center md:justify-center">
      <div className="mx-auto w-full max-w-[440px] rounded-3xl border border-slate-100 bg-white p-5 shadow-xl sm:p-8 md:max-w-[760px] md:p-10">
        <div className="mb-8 text-center">
          <BasaBrandMark />
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-600">Completa los datos de la seccion Cuenta para habilitar tu acceso al portal.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.dni ? "text-red-600" : "text-slate-600"}`}>DNI</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.dni ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.dni} onChange={(e) => onChange("dni", e.target.value.replace(/\D/g, "").slice(0, 8))} required />
              {fieldErrors.dni && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.dni}</p>}
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.lastName ? "text-red-600" : "text-slate-600"}`}>Apellido</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.lastName ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} required />
              {fieldErrors.lastName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.firstName ? "text-red-600" : "text-slate-600"}`}>Nombre</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.firstName ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} required />
              {fieldErrors.firstName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Segundo nombre</label>
              <input className="w-full rounded-xl border border-slate-200 px-4 py-3" value={form.secondName} onChange={(e) => onChange("secondName", e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.password ? "text-red-600" : "text-slate-600"}`}>Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full rounded-xl border px-4 py-3 pr-11 ${fieldErrors.password ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p> : <p className="mt-1 text-[11px] text-slate-500">Mínimo 8, mayúscula, número y símbolo.</p>}
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.confirmPassword ? "text-red-600" : "text-slate-600"}`}>Confirmar contrasena</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full rounded-xl border px-4 py-3 pr-11 ${fieldErrors.confirmPassword ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                  value={form.confirmPassword}
                  onChange={(e) => onChange("confirmPassword", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.phoneCountryCode ? "text-red-600" : "text-slate-600"}`}>Prefijo</label>
              <select className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.phoneCountryCode ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.phoneCountryCode} onChange={(e) => onChange("phoneCountryCode", e.target.value)}>
                <option value="+54">+54</option>
              </select>
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.province ? "text-red-600" : "text-slate-600"}`}>Provincia</label>
              <select className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.province ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.province} onChange={(e) => onChange("province", e.target.value)}>
                {argentinaProvinces.map((province) => (
                  <option key={province.value} value={province.value}>{province.label}</option>
                ))}
              </select>
              {fieldErrors.province && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.province}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Cod. area</label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3" value={form.phoneAreaCode} onChange={(e) => onChange("phoneAreaCode", e.target.value)}>
                <option value={selectedProvince.areaCode}>{selectedProvince.areaCode}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.phoneNumber ? "text-red-600" : "text-slate-600"}`}>Telefono</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.phoneNumber ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.phoneNumber} placeholder="Ej: 1551234567" onChange={(e) => onChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 12))} required />
              {fieldErrors.phoneNumber && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.phoneNumber}</p>}
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.address ? "text-red-600" : "text-slate-600"}`}>Direccion</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.address ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Calle y altura" required />
              {fieldErrors.address && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.address}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.city ? "text-red-600" : "text-slate-600"}`}>Ciudad</label>
              <select className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.city ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.city} onChange={(e) => onChange("city", e.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city.value} value={city.value}>{city.label}</option>
                ))}
              </select>
              {fieldErrors.city && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.city}</p>}
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.postalCode ? "text-red-600" : "text-slate-600"}`}>Codigo postal</label>
              <input className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.postalCode ? "border-red-500 bg-red-50" : "border-slate-200"}`} value={form.postalCode} onChange={(e) => onChange("postalCode", e.target.value)} required />
              {fieldErrors.postalCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.postalCode}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.insuranceProviderId ? "text-red-600" : "text-slate-600"}`}>Obra social / Prepaga</label>
              <select
                className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.insuranceProviderId ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                value={form.insuranceProviderId}
                onChange={(e) => onChange("insuranceProviderId", e.target.value)}
                disabled={loadingProviders && providers.length === 0}
              >
                <option value="">Seleccionar...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </select>
              {fieldErrors.insuranceProviderId && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.insuranceProviderId}</p>}
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${fieldErrors.insurancePlanId ? "text-red-600" : "text-slate-600"}`}>Plan</label>
              <select
                className={`w-full rounded-xl border px-4 py-3 ${fieldErrors.insurancePlanId ? "border-red-500 bg-red-50" : "border-slate-200"}`}
                value={form.insurancePlanId}
                onChange={(e) => onChange("insurancePlanId", e.target.value)}
                disabled={!selectedProvider || (loadingProviders && providers.length === 0)}
              >
                <option value="">Seleccionar...</option>
                {selectedProvider?.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              {fieldErrors.insurancePlanId && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.insurancePlanId}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Numero de afiliado</label>
            <input className="w-full rounded-xl border border-slate-200 px-4 py-3" value={form.membershipNumber} onChange={(e) => onChange("membershipNumber", e.target.value)} />
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          {success && <p className="text-sm font-bold text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            Volver al ingreso
          </Link>
        </div>
      </div>
    </main>
  );
}
