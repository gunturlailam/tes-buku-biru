"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { switchOrg, getOrgId, getOrganizations } from "@/lib/auth";

export function OrgSwitcher() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const orgs = getOrganizations();
  const currentOrgId = getOrgId();
  const currentOrg = orgs.find((o) => String(o.organization_id) === currentOrgId) ?? orgs[0];

  if (orgs.length <= 1) return null;

  const handleSwitch = (orgId: number) => {
    switchOrg(orgId);
    qc.clear(); // clear semua query cache
    setOpen(false);
    router.refresh();
    window.location.reload(); // reload agar semua data fresh
  };

  return (
    <div className="relative px-2 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333333] transition-colors text-left"
      >
        <Building2 className="w-4 h-4 text-[#ffc900] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {currentOrg?.organization_name ?? "Pilih Organisasi"}
          </p>
          <p className="text-[10px] text-[#666666] capitalize">{currentOrg?.role}</p>
        </div>
        <ChevronDown className={cn("w-3 h-3 text-[#666666] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 mt-1 bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="px-3 py-2 text-[10px] font-bold text-[#666666] uppercase tracking-wider border-b border-[#333333]">
            Ganti Organisasi
          </p>
          {orgs.map((org) => {
            const isActive = String(org.organization_id) === currentOrgId;
            return (
              <button
                key={org.organization_id}
                onClick={() => handleSwitch(org.organization_id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] transition-colors",
                  isActive && "bg-[#2a2a2a]"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{org.organization_name}</p>
                  <p className="text-[10px] text-[#666666] capitalize">{org.role}</p>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-[#ffc900] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
