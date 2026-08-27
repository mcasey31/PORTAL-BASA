"use client";

import React, { useState, useEffect } from "react";
import { 
    Search, 
    X, 
    Check, 
    Calendar, 
    Clock, 
    MapPin, 
    Stethoscope, 
    User,
    Loader2,
    CalendarCheck2
} from "lucide-react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function NewAppointmentFlow({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [mode, setMode] = useState<"search" | "quick" | "filtered">("search");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedServicio, setSelectedServicio] = useState("");
    const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
    const [selectedPractica, setSelectedPractica] = useState("");
    const [selectedProfesional, setSelectedProfesional] = useState("");
    const [selectedCenterSingle, setSelectedCenterSingle] = useState("");
    const [selectedServicioCascade, setSelectedServicioCascade] = useState("");
    const [selectedProfesionalCascade, setSelectedProfesionalCascade] = useState("");
    const [quickCenterId, setQuickCenterId] = useState("");
    const [quickServicioId, setQuickServicioId] = useState("");
    const [quickProfesionalId, setQuickProfesionalId] = useState("");
    const [buscarEnabled, setBuscarEnabled] = useState(false);
    const [searchContext, setSearchContext] = useState<"none" | "quick" | "search" | "filtered">("none");
    const [quickSearchPending, setQuickSearchPending] = useState(false);

    // ── Datos del HIS ─────────────────────────────────────────────────────
    const { data: selectores, isLoading: loadingSelectores } = api.health.getSelectores.useQuery(undefined, {
        enabled: isOpen,
        staleTime: 60_000,
    });

    const { data: slots, isLoading: isSearching, refetch: doSearch } = api.health.searchAvailableSlots.useQuery(
        {
            centroIds: selectedCenters,
            servicioId: selectedServicio,
            practicaId: selectedPractica || undefined,
            profesionalId: selectedProfesional || undefined,
        },
        {
            enabled: buscarEnabled && selectedCenters.length > 0 && !!selectedServicio,
            staleTime: 0,
        }
    );

    const { data: cascadeSlots, isLoading: isSearchingCascade, refetch: doCascadeSearch } = api.health.searchAvailableSlotsCascade.useQuery(
        {
            centroId: selectedCenterSingle,
            servicioId: selectedServicioCascade,
            profesionalId: selectedProfesionalCascade || undefined,
        },
        {
            enabled: false,
            staleTime: 0,
        }
    );

    const { data: quickSlots, isLoading: isSearchingQuick, refetch: doQuickSearch } = api.health.searchAvailableSlotsCascade.useQuery(
        {
            centroId: quickCenterId,
            servicioId: quickServicioId,
            profesionalId: quickProfesionalId || undefined,
        },
        {
            enabled: false,
            staleTime: 0,
        }
    );

    // Servicios disponibles en los centros seleccionados
    const serviciosDisponibles = selectores?.servicios ?? [];

    const normalizeText = (value: string) =>
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const matchesSearchTerm = (term: string, candidate: string) => {
        const parts = normalizeText(term).split(/\s+/).filter(Boolean);
        if (parts.length === 0) return false;
        const normalizedCandidate = normalizeText(candidate);
        return parts.every((part) => normalizedCandidate.includes(part));
    };

    const normalizedSearch = normalizeText(searchTerm);
    const quickMatches = normalizedSearch.length < 2 ? [] : [
        ...(selectores?.centros ?? []).filter((c) => matchesSearchTerm(searchTerm, `centro ${c.nombre}`)).map((c) => ({
            type: "centro" as const,
            id: c.id,
            label: c.nombre,
        })),
        ...(selectores?.servicios ?? []).filter((s) => matchesSearchTerm(searchTerm, `servicio especialidad ${s.nombre}`)).map((s) => ({
            type: "servicio" as const,
            id: s.id,
            label: s.nombre,
        })),
        ...(selectores?.profesionales ?? []).filter((p) => matchesSearchTerm(searchTerm, `medico doctor ${p.nombre}`)).map((p) => ({
            type: "medico" as const,
            id: p.id,
            label: p.nombre,
        })),
    ].slice(0, 8);

    // Centros que tienen el servicio seleccionado
    const centrosDisponibles = selectores?.centros.filter(c =>
        !selectedServicio || selectores.servicios.find(s => s.id === selectedServicio)?.centroIds.includes(c.id)
    ) ?? [];

    const serviciosPorCentro = selectores?.servicios.filter((s) =>
        !selectedCenterSingle || s.centroIds.includes(selectedCenterSingle)
    ) ?? [];

    const profesionalesPorCentroServicio = selectores?.profesionales.filter((p) => {
        if (!selectedCenterSingle || !selectedServicioCascade) return false;
        return p.centroIds.includes(selectedCenterSingle) && p.servicioIds.includes(selectedServicioCascade);
    }) ?? [];

    // Prácticas del servicio seleccionado
    const practicasDisponibles = selectores?.practicas.filter(p => p.servicioId === selectedServicio) ?? [];

    // Profesionales del servicio seleccionado
    const profesionalesDisponibles = selectores?.profesionales.filter(p =>
        p.servicioIds.includes(selectedServicio)
    ) ?? [];

    // Reset cuando cambia el servicio
    useEffect(() => {
        setSelectedCenters([]);
        setSelectedPractica("");
        setSelectedProfesional("");
        setBuscarEnabled(false);
    }, [selectedServicio]);

    useEffect(() => {
        setSelectedServicioCascade("");
        setSelectedProfesionalCascade("");
    }, [selectedCenterSingle]);

    useEffect(() => {
        setSelectedProfesionalCascade("");
    }, [selectedServicioCascade]);

    useEffect(() => {
        if (!quickSearchPending) return;
        if (!quickCenterId || !quickServicioId) {
            setQuickSearchPending(false);
            return;
        }

        void doQuickSearch().finally(() => {
            setBuscarEnabled(true);
            setSearchContext("quick");
            setQuickSearchPending(false);
        });
    }, [quickSearchPending, quickCenterId, quickServicioId, doQuickSearch]);

    // Reset al cambiar de modo
    useEffect(() => {
        setSelectedServicio("");
        setSearchTerm("");
        setBuscarEnabled(false);
        setSearchContext("none");
    }, [mode]);

    const handleFilteredSearch = async () => {
        await doSearch();
        setBuscarEnabled(true);
        setSearchContext("filtered");
    };

    const runCascadeSearch = async () => {
        await doCascadeSearch();
        setBuscarEnabled(true);
        setSearchContext("search");
    };

    const runQuickSearch = async () => {
        if (!normalizedSearch) {
            setBuscarEnabled(true);
            setSearchContext("quick");
            return;
        }

        const centerIds = new Set<string>();
        const serviceIds = new Set<string>();
        const professionalIds = new Set<string>();

        for (const c of selectores?.centros ?? []) {
            if (matchesSearchTerm(searchTerm, `centro ${c.nombre}`)) centerIds.add(c.id);
        }
        for (const s of selectores?.servicios ?? []) {
            if (matchesSearchTerm(searchTerm, `servicio especialidad ${s.nombre}`)) {
                serviceIds.add(s.id);
                s.centroIds.forEach((id) => centerIds.add(id));
            }
        }
        for (const p of selectores?.profesionales ?? []) {
            if (matchesSearchTerm(searchTerm, `medico doctor ${p.nombre}`)) {
                professionalIds.add(p.id);
                p.centroIds.forEach((id) => centerIds.add(id));
                p.servicioIds.forEach((id) => serviceIds.add(id));
            }
        }

        const selectedCenter = Array.from(centerIds)[0] ?? "";
        const selectedService = Array.from(serviceIds)[0] ?? "";
        const selectedDoctor = Array.from(professionalIds)[0] ?? "";

        if (!selectedCenter || !selectedService) {
            setBuscarEnabled(true);
            setSearchContext("quick");
            return;
        }

        setQuickCenterId(selectedCenter);
        setQuickServicioId(selectedService);
        setQuickProfesionalId(selectedDoctor);
        setQuickSearchPending(true);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedServicio("");
        setSelectedCenters([]);
        setSelectedPractica("");
        setSelectedProfesional("");
        setSelectedCenterSingle("");
        setSelectedServicioCascade("");
        setSelectedProfesionalCascade("");
        setQuickCenterId("");
        setQuickServicioId("");
        setQuickProfesionalId("");
        setBuscarEnabled(false);
        setSearchContext("none");
        setQuickSearchPending(false);
    };

    const displayedSlots = searchContext === "quick"
        ? quickSlots
        : searchContext === "search"
            ? cascadeSlots
            : slots;

    const searchingNow = searchContext === "quick"
        ? isSearchingQuick
        : searchContext === "search"
            ? isSearchingCascade
            : isSearching;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Solicitar Nuevo Turno</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización directa con HIS</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {/* Mode Selector */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                        <button 
                            onClick={() => setMode("search")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "search" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            Busqueda
                        </button>
                        <button 
                            onClick={() => setMode("quick")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "quick" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            Búsqueda Rápida
                        </button>
                        <button 
                            onClick={() => setMode("filtered")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "filtered" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            Filtros Avanzados
                        </button>
                    </div>

                    {/* Mode Content */}
                    <div className="grid lg:grid-cols-12 gap-10">
                        {/* Filters Column */}
                        <div className="lg:col-span-5 space-y-6">
                            {mode === "quick" ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Especialidad, Centro o Médico</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Ej: Clínica Médica, Dr. Peper..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {quickMatches.length > 0 && (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-2 space-y-1">
                                            {quickMatches.map((match) => (
                                                <button
                                                    key={`${match.type}-${match.id}`}
                                                    onClick={() => setSearchTerm(match.label)}
                                                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                                                >
                                                    <p className="text-xs font-bold text-slate-900">{match.label}</p>
                                                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{match.type}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={runQuickSearch}
                                        disabled={!searchTerm.trim() || isSearchingQuick || quickSearchPending}
                                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {isSearchingQuick || quickSearchPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Buscar por texto"}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-2">Usá <strong>Filtros Avanzados</strong> para seleccionar especialidad, centro y horarios disponibles en tiempo real desde el HIS.</p>
                                </div>
                            ) : mode === "search" ? (
                                <div className="space-y-6 animate-in slide-in-from-left-2 duration-500">
                                    {loadingSelectores ? (
                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cargando datos del HIS...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">1. Centro</label>
                                                <select
                                                    value={selectedCenterSingle}
                                                    onChange={(e) => setSelectedCenterSingle(e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Selecciona Centro</option>
                                                    {(selectores?.centros ?? []).map((c) => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">2. Servicio</label>
                                                <select
                                                    value={selectedServicioCascade}
                                                    onChange={(e) => setSelectedServicioCascade(e.target.value)}
                                                    disabled={!selectedCenterSingle}
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="">Selecciona Servicio</option>
                                                    {serviciosPorCentro.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">3. Médico (opcional)</label>
                                                <select
                                                    value={selectedProfesionalCascade}
                                                    onChange={(e) => setSelectedProfesionalCascade(e.target.value)}
                                                    disabled={!selectedCenterSingle || !selectedServicioCascade}
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="">Todos</option>
                                                    {profesionalesPorCentroServicio.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                onClick={runCascadeSearch}
                                                disabled={!selectedCenterSingle || !selectedServicioCascade || isSearchingCascade}
                                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                {isSearchingCascade ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Buscar turnos"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-left-2 duration-500">
                                    {loadingSelectores ? (
                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cargando datos del HIS...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Especialidad/Servicio */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">1. Especialidad</label>
                                                <select 
                                                    value={selectedServicio}
                                                    onChange={(e) => setSelectedServicio(e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Selecciona Especialidad</option>
                                                    {serviciosDisponibles.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Centros disponibles */}
                                            {selectedServicio && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">2. Centro Médicos Disponibles</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {centrosDisponibles.map(center => (
                                                            <button 
                                                                key={center.id}
                                                                onClick={() => {
                                                                    setSelectedCenters(prev =>
                                                                        prev.includes(center.id)
                                                                            ? prev.filter(id => id !== center.id)
                                                                            : [...prev, center.id]
                                                                    );
                                                                }}
                                                                className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedCenters.includes(center.id) ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"}`}
                                                            >
                                                                <div className="flex items-center gap-3 text-left">
                                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedCenters.includes(center.id) ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                                                                        <MapPin className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-900">{center.nombre}</p>
                                                                </div>
                                                                {selectedCenters.includes(center.id) && <Check className="h-4 w-4 text-blue-600" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button onClick={() => setSelectedCenters(centrosDisponibles.map(c => c.id))}
                                                            className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">
                                                            Seleccionar Todos
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button onClick={() => setSelectedCenters([])}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                                                            Ninguno
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Práctica */}
                                            {selectedServicio && practicasDisponibles.length > 0 && (
                                                <div className="space-y-2 animate-in fade-in duration-500">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">3. Práctica</label>
                                                    <select 
                                                        value={selectedPractica}
                                                        onChange={(e) => setSelectedPractica(e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Todas las prácticas</option>
                                                        {practicasDisponibles.map(p => (
                                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Profesional (opcional) */}
                                            {selectedServicio && profesionalesDisponibles.length > 0 && (
                                                <div className="space-y-2 animate-in fade-in duration-500">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">4. Profesional (opcional)</label>
                                                    <select 
                                                        value={selectedProfesional}
                                                        onChange={(e) => setSelectedProfesional(e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Cualquier profesional</option>
                                                        {profesionalesDisponibles.map(p => (
                                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <button 
                                        onClick={handleFilteredSearch}
                                        disabled={!selectedServicio || selectedCenters.length === 0 || isSearching}
                                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Buscar Agendas Disponibles"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Results Column */}
                        <div className="lg:col-span-7">
                            <div className="bg-slate-50/50 rounded-[2rem] p-8 h-full min-h-[400px] border border-slate-100 flex flex-col">
                                {buscarEnabled && displayedSlots && displayedSlots.length > 0 ? (
                                    <div className="space-y-6">
                                        {(() => {
                                            const availableSlots = displayedSlots.filter((s) => s.status === "available");
                                            return (
                                                <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Próximos Turnos Disponibles</h4>
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{availableSlots.length} slots</span>
                                        </div>
                                        {availableSlots.slice(0, 8).map((slot, i) => {
                                            const slotDate = new Date(slot.start);
                                            return (
                                            <div key={slot.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all animate-in slide-in-from-bottom-4 duration-500 group" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                            <CalendarCheck2 className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter mb-1">{slot.professional.name}</p>
                                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{slot.reason}</p>
                                                            <div className="flex items-center gap-4 mt-4">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-xs font-bold text-slate-500">{format(slotDate, "dd/MM/yyyy", { locale: es })}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-xs font-bold text-slate-900">{format(slotDate, "HH:mm")}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                <MapPin className="h-3 w-3 text-slate-300" />
                                                                <span className="text-[10px] font-medium text-slate-400">{slot.facility.name} • {slot.professional.specialty}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                                        Confirmar
                                                    </button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                                            Mostrando los primeros {Math.min(8, availableSlots.length)} de {availableSlots.length} turnos disponibles
                                        </p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : buscarEnabled && !searchingNow ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                        <p className="text-sm font-bold text-slate-500">No hay turnos disponibles en agendas y bloques activos para esta búsqueda.</p>
                                        <p className="text-xs text-slate-400 mt-2">Intentá cambiar centro, servicio o médico y buscá nuevamente.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                        <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6">
                                            {searchingNow ? <Loader2 className="h-10 w-10 text-blue-400 animate-spin" /> : <Stethoscope className="h-10 w-10 text-slate-200" />}
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Buscador de Turnos</h4>
                                        <p className="text-xs text-slate-400 font-medium max-w-[240px] mt-2">Completa los campos de la izquierda para ver las agendas disponibles en tiempo real desde el HIS.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Datos en tiempo real desde HIS VitalFlow
                    </p>
                </div>
            </div>
        </div>
    );
}
