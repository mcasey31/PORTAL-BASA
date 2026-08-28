"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const MEMBER_COOKIE = "portal_member_id";

export function FamilyMemberSelector() {
  const utils = api.useUtils();
  const { data: members, isLoading } = api.patient.getFamilyMembers.useQuery();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!members?.length) return;
    const saved = window.localStorage.getItem(MEMBER_COOKIE);
    const selected = members.some((member) => member.id === saved) && saved ? saved : members[0]?.id ?? "";
    setSelectedId(selected);
    document.cookie = `${MEMBER_COOKIE}=${selected}; path=/; max-age=2592000; samesite=lax`;
    window.localStorage.setItem(MEMBER_COOKIE, selected);
  }, [members]);

  const handleChange = (value: string) => {
    setSelectedId(value);
    window.localStorage.setItem(MEMBER_COOKIE, value);
    document.cookie = `${MEMBER_COOKIE}=${value}; path=/; max-age=2592000; samesite=lax`;
    window.dispatchEvent(new CustomEvent("portal-member-changed", { detail: value }));
    void utils.health.getAppointments.invalidate();
    void utils.health.getDashboardSummary.invalidate();
    void utils.health.getMedicalHistory.invalidate();
  };

  return (
    <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 shadow-sm sm:px-4">
      <Users className="h-4 w-4 shrink-0 text-[#28716e]" />
      <span className="hidden text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:inline">Integrante</span>
      <select aria-label="Seleccionar integrante" value={selectedId} onChange={(event) => handleChange(event.target.value)} disabled={isLoading || !members?.length} className="min-w-0 max-w-[150px] bg-transparent text-xs font-bold text-slate-800 outline-none sm:max-w-[220px]">
        {members?.map((member) => <option key={member.id} value={member.id}>{member.memberType === "PRINCIPAL" ? `${member.name} (Titular)` : member.name}</option>)}
      </select>
    </label>
  );
}