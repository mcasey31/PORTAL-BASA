"use client";

import { useState } from "react";
import { 
    Card, 
    CardContent 
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
    Pill, 
    Calendar, 
    Download, 
    QrCode,
    Search,
    AlertCircle,
    CheckCircle2,
    UserCircle,
    ChevronRight
} from "lucide-react";

export function PrescriptionsContent() {
    const [search, setSearch] = useState("");
    
    // Mock de recetas para el prototipo
    const prescriptions = [
        {
            id: "RX-90210",
            medication: "Amoxicilina 500mg",
            instructions: "1 comprimido cada 8 horas por 7 días",
            prescribedBy: "Dra. Valeria Sánchez",
            date: "10 Abr 2026",
            expires: "10 May 2026",
            status: "active",
            pharmacyNotes: "Presentar receta digital en farmacia vinculada."
        },
        {
            id: "RX-88432",
            medication: "Ibuprofeno 600mg",
            instructions: "1 comprimido cada 12 horas si presenta dolor",
            prescribedBy: "Dr. Roberto Gómez",
            date: "15 Mar 2026",
            expires: "15 Abr 2026",
            status: "expired",
            pharmacyNotes: "Vencida el 15/04/2026"
        }
    ];

    return (
        <div className="space-y-7 animate-in slide-in-from-bottom-2 duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950 uppercase italic">Recetas Médicas</h2>
                    <p className="text-slate-500 mt-1 font-bold text-sm">Gestiona tus prescripciones vigentes con validación institucional.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 transition-colors focus-within:border-slate-900">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar medicamento o doctor..." 
                        className="bg-transparent border-none outline-none text-sm text-slate-900 w-56 placeholder:text-slate-300 font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {prescriptions.map((rx) => (
                    <Card key={rx.id} className={`bg-white border border-slate-200 shadow-sm group relative overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${rx.status === 'expired' ? 'opacity-75 grayscale-[0.35]' : ''}`}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center border ${
                                        rx.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                        <Pill className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate font-black text-lg text-slate-950" title={rx.medication}>{rx.medication}</h3>
                                        <p className="mt-1 truncate text-sm font-medium text-slate-500">{rx.prescribedBy}</p>
                                    </div>
                                </div>
                                <Badge className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${rx.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {rx.status === 'active' ? 'Vigente' : 'Consumida'}
                                </Badge>
                            </div>
                            <p className="mt-5 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">{rx.instructions}</p>

                            <div className="mt-5 border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
                                    <span className="flex min-w-0 items-center gap-2 truncate"><Calendar className="h-4 w-4 shrink-0 text-slate-400" />Disponible a partir de {rx.date}</span>
                                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default PrescriptionsContent;
