import { useState } from "react";
import { MatchResultList } from "../../Match/pages/MatchResultList";
import StaffTeamCheckin from "./StaffTeamCheckin";
import StaffTeamStatus from "./StaffTeamStatus";
import { withStaffAuth } from "../../../HOC";

const StaffMatchTabsRov = () => {
  const [activeTab, setActiveTab] = useState<"result" | "team" | "team-status">(
    "team-status",
  );

  const tabs: Array<{
    key: "result" | "team" | "team-status";
    label: string;
  }> = [
    { key: "team-status", label: "ทีมที่สมัครแข่งขัน (สิทธิ์เจ้าหน้าที่)" },
    { key: "team", label: "เช็คอินแล้ว (สิทธิ์เจ้าหน้าที่)" },
    { key: "result", label: "รายการแข่งขัน" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/60 font-sarabun text-slate-900">
      {/* Tabs Header */}
      <div className=" top-0 z-10 border-b border-slate-300/80 bg-slate-50/95 shadow-sm backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-5">
          <div className="rounded-2xl border border-slate-300/80 bg-white px-4 py-4 shadow-sm md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-indigo-800">
                  จัดการทีมแข่งขัน ROV (เจ้าหน้าที่)
                </h1>
              </div>

              <div className="inline-flex w-full rounded-xl border border-slate-300 bg-slate-100 p-1 md:w-auto">
                {tabs.map((tab) => {
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all md:flex-none md:px-5 md:text-base ${
                        active
                          ? "bg-indigo-800 text-white shadow-sm"
                          : "text-slate-700 hover:bg-white"
                      }`}
                      aria-pressed={active}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="w-full py-5">
        {activeTab === "result" && <MatchResultList />}
        {activeTab === "team" && <StaffTeamCheckin />}
        {activeTab === "team-status" && <StaffTeamStatus />}
      </div>
    </div>
  );
};

export default withStaffAuth(StaffMatchTabsRov);
