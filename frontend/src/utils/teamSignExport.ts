import type { Team } from "../features/Team/type";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getTeamName = (team: Team) => {
  const ordinal = team.nameOrdinal && team.nameOrdinal !== 0 ? ` ${team.nameOrdinal}` : "";
  return team.teamName || `${team.school_name ?? "ทีม"}${ordinal}`;
};

/** Opens a browser print dialog with one landscape A4 sign per team. */
export const exportTeamSigns = (teams: Team[], title?: string) => {
  if (!teams.length) return false;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const signs = teams
    .map(
      (team) => `
        <section class="sign">
          <p class="label">รหัสทีม</p>
          <div class="team-code">${escapeHtml(team.teamNumberInLevel ?? team.teamID ?? "-")}</div>
          <div class="divider"></div>
          <p class="label">ชื่อทีม</p>
          <h1>${escapeHtml(getTeamName(team))}</h1>
        </section>`,
    )
    .join("");

  printWindow.document.write(`<!doctype html>
    <html lang="th"><head><meta charset="utf-8" /><title>${escapeHtml(title || "ป้ายชื่อทีม")}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "Sarabun", "TH Sarabun New", Arial, sans-serif; color: #0f172a; }
      .sign { width: 100%; height: 180mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; break-after: page; page-break-after: always; border: 3px solid #1d4ed8; padding: 12mm 18mm; }
      .sign:last-child { break-after: auto; page-break-after: auto; }
      .label { margin: 0; color: #1e40af; font-size: 11mm; font-weight: 700; }
      .team-code { margin: 1mm 0 4mm; font-family: Arial, sans-serif; font-size: 42mm; line-height: 1; font-weight: 800; letter-spacing: 1.5mm; color: #111827; }
      .divider { width: 80%; border-top: 1.5mm solid #93c5fd; margin: 2mm 0 7mm; }
      h1 { margin: 2mm 0 0; font-size: 25mm; line-height: 1.15; font-weight: 800; overflow-wrap: anywhere; }
      @media screen { body { background: #e2e8f0; padding: 12px; } .sign { background: white; margin: 0 auto 12px; } }
    </style></head><body>${signs}
    <script>window.onload = () => { window.focus(); window.print(); };</script>
    </body></html>`);
  printWindow.document.close();
  return true;
};
