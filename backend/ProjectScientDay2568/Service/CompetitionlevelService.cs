using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ProjectScientDay2568.Data;
using ProjectScientDay2568.Models;
using ProjectScientDay2568.Models.Dtos.Team;
using static ProjectScientDay2568.Utility.SD;

namespace ProjectScientDay2568.Service
{
    // ยังดาวน์โหลดเกียรติบัตรไม่ได้ (ข้อความแสดงให้ผู้ใช้เห็นได้ตรง ๆ)
    public class CertificateNotReadyException : InvalidOperationException
    {
        public CertificateNotReadyException(string message) : base(message) { }
    }

    public class CompetitionlevelService : ICompetitionlevelService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CompetitionlevelService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<CompetitionLevelDto>> GetCompetitionLevelListAsync(int competitionYearID)
        {
            var competitionLevels = await _context.CompetitionLevels
                                            .Where(p => p.CompetitionYearID == competitionYearID)
                                            .Include(p => p.EducationLevel)
                                            .Include(p => p.CompetitionYear).ThenInclude(y => y.Competition)
                                            .AsNoTracking().ToListAsync();
            var result = _mapper.Map<List<CompetitionLevelDto>>(competitionLevels);
            for (var i = 0; i < result.Count; i++)
            {
                result[i].AdvisorCount = competitionLevels[i].CompetitionYear?.AdvisorCount ?? 1;
                result[i].RegistrationMode = competitionLevels[i].CompetitionYear?.RegistrationMode ?? "team";
            }
            return result;
        }

        public async Task<CompetitionLevelDto> GetCompetitionLevelByIdAsync(int id)
        {
            var competitionLevels = await _context.CompetitionLevels
                .Include(x => x.CompetitionYear).ThenInclude(y => y.Competition)
                .FirstOrDefaultAsync(x => x.CompetitionLevelID == id);
            if (competitionLevels == null)
            {
                throw new KeyNotFoundException($"competitionLevels with ID {id} not found.");
            }
            var result = _mapper.Map<CompetitionLevelDto>(competitionLevels);
            result.AdvisorCount = competitionLevels.CompetitionYear?.AdvisorCount ?? 1;
            result.RegistrationMode = competitionLevels.CompetitionYear?.RegistrationMode ?? "team";
            return result;
        }

        public async Task<CompetitionLevelDto> CreateCompetitionLevel(CompetitionLevelDto competitionLevelDto)
        {
            if (competitionLevelDto == null)
            {
                throw new ArgumentNullException(nameof(competitionLevelDto), "competitionLevelDto cannot be null.");
            }

            var competitionLevel = _mapper.Map<CompetitionLevel>(competitionLevelDto);

            await _context.CompetitionLevels.AddAsync(competitionLevel);
            await _context.SaveChangesAsync();

            return _mapper.Map<CompetitionLevelDto>(competitionLevelDto);
        }

        public async Task<CompetitionLevelDto> UpdateCompetitionLevel(int id, CompetitionLevelDto competitionLevelDto)
        {
            if (competitionLevelDto == null)
            {
                throw new ArgumentNullException(nameof(competitionLevelDto), "competitionLevel cannot be null.");
            }

            var competitionLevelToUpdate = await _context.CompetitionLevels.FindAsync(id);
            if (competitionLevelToUpdate == null)
            {
                throw new KeyNotFoundException($"competitionLevel with ID {id} not found.");
            }

            _mapper.Map(competitionLevelDto, competitionLevelToUpdate);

            await _context.SaveChangesAsync();
            return _mapper.Map<CompetitionLevelDto>(competitionLevelToUpdate);
        }

        public async Task DeleteCompetitionLevel(int id)
        {
            var competitionLevel = await _context.CompetitionLevels.FindAsync(id);

            if (competitionLevel == null) throw new KeyNotFoundException("competitionLevel not found");

            _context.CompetitionLevels.Remove(competitionLevel);
            await _context.SaveChangesAsync();
        }

        //รันเลขเกียรติบัตรของทีมในระดับชั้นนั้น ๆ
        public async Task<List<TeamCertificateDto>> GenerateTeamCertificatesNumberByLevel(
            int competitionLevelId, bool forceRebuild = false, CancellationToken ct = default)
        {
            var level = await _context.CompetitionLevels
                .Include(cl => cl.CompetitionYear).ThenInclude(cy => cy.Year)
                .SingleOrDefaultAsync(cl => cl.CompetitionLevelID == competitionLevelId, ct)
                ?? throw new InvalidOperationException("ไม่พบระดับชั้น");

            var yearId = level.CompetitionYear.Year.YearID;
            var yearNumber = level.CompetitionYear.Year.YearNumber;

            var config = await _context.CertificateConfigs
                .AsTracking()
                .FirstOrDefaultAsync(c => c.YearID == yearId, ct)
                ?? throw new InvalidOperationException("ยังไม่ได้ตั้งค่าเกียรติบัตรสำหรับปีนี้");

            // ทีมที่ควรได้เลข: เช็คอินแล้ว เรียงตามรหัสทีม (ไม่สนรางวัล) ลำดับคงที่ทุกครั้ง
            var teamIds = await _context.Teams
                .Where(t => t.Status == TeamStatus.CheckedIn && t.CompetitionLevelID == competitionLevelId)
                .OrderBy(t => t.TeamID)
                .Select(t => t.TeamID)
                .ToListAsync(ct);

            // ถ้ายังไม่มีทีม → คืนว่าง และไม่แตะเลข
            if (teamIds.Count == 0)
                return new List<TeamCertificateDto>();

            // เริ่มทรานแซกชันความเข้มสูง (กันกดออกเลขพร้อมกันแล้วได้เลขซ้ำ)
            await using var tx = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable, ct);

            var existing = await _context.TeamCertificates
                .Where(tc => teamIds.Contains(tc.TeamID))
                .ToListAsync(ct);
            var certByTeam = existing
                .GroupBy(c => c.TeamID)
                .ToDictionary(g => g.Key, g => g.OrderBy(c => c.CertificateID).First());

            var certName = (config.CertificateName ?? string.Empty).Trim();
            var changed = false;

            if (forceRebuild)
            {
                // จัดเลขใหม่ตามลำดับรหัสทีม โดยใช้ "ชุดเลขเดิม" ของทีมในระดับนี้ (เลขไม่หาย ไม่ขยับไปท้ายปี)
                // ทีมที่ยังไม่มีเลขจะได้เลขต่อท้ายปีในขั้นถัดไป
                var pool = certByTeam.Values
                    .Select(c => ParseRunning(c.CertificateNumber))
                    .Where(n => n.HasValue).Select(n => n!.Value)
                    .OrderBy(n => n)
                    .ToList();
                var teamsWithCert = teamIds.Where(certByTeam.ContainsKey).ToList();
                if (pool.Count == teamsWithCert.Count)
                {
                    for (var i = 0; i < teamsWithCert.Count; i++)
                    {
                        var cert = certByTeam[teamsWithCert[i]];
                        var number = $"{pool[i]}/{yearNumber}";
                        if (cert.CertificateNumber != number)
                        {
                            cert.CertificateNumber = number;
                            changed = true;
                        }
                        cert.CertificateName = certName;
                    }
                }
            }

            // ทีมที่ยังไม่มีเลข → เลขถัดไปของทั้งปี (ทีมที่มีเลขแล้วคงเลขเดิม ใบที่พิมพ์ไปแล้วจะไม่ผิด)
            var missing = teamIds.Where(id => !certByTeam.ContainsKey(id)).ToList();
            if (missing.Count > 0)
            {
                var existingNumbersInYear = await _context.TeamCertificates
                    .Where(tc => tc.Team.CompetitionLevel.CompetitionYear.Year.YearID == yearId)
                    .Select(tc => tc.CertificateNumber)
                    .ToListAsync(ct);
                var maxExisting = existingNumbersInYear.Select(ParseRunning).Max() ?? 0;

                // ไม่แก้ config.StartNumber ในฐานข้อมูล: เลขถัดไป = max(StartNumber, เลขสูงสุดที่ออกแล้ว + 1)
                var runningNumber = Math.Max(config.StartNumber, maxExisting + 1);
                foreach (var teamId in missing)
                {
                    var cert = new TeamCertificate
                    {
                        TeamID = teamId,
                        CertificateNumber = $"{runningNumber++}/{yearNumber}",
                        CertificateName = certName,
                        IssuedDate = DateTime.UtcNow
                    };
                    _context.TeamCertificates.Add(cert);
                    certByTeam[teamId] = cert;
                }
                changed = true;
            }

            if (changed || forceRebuild || !level.IsCertificateNumberGenerated)
            {
                level.IsCertificateNumberGenerated = true;
                await _context.SaveChangesAsync(ct);
            }
            await tx.CommitAsync(ct);

            // คืนเลขของทุกทีมในระดับนี้ ตามลำดับรหัสทีม
            return _mapper.Map<List<TeamCertificateDto>>(teamIds.Select(id => certByTeam[id]).ToList());
        }

        /// <summary>
        /// เรียกก่อนสร้าง PDF เกียรติบัตร: เกียรติบัตรทุกใบที่ดาวน์โหลดได้ต้องมีเลข
        /// - ระดับชั้นยังไม่ปิด (ยังไม่ออกเลข) → ห้ามดาวน์โหลด
        /// - ทีมมีเลขแล้ว → ผ่าน
        /// - ทีมยังไม่มีเลขและยังไม่เช็คอิน → ห้ามดาวน์โหลด
        /// - ทีมเช็คอินหลังปิดกิจกรรม (ยังไม่มีเลข) → ออกเลขถัดไปของปีให้อัตโนมัติ
        /// </summary>
        public async Task EnsureCertificateNumberForDownloadAsync(int teamId, CancellationToken ct = default)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Where(t => t.TeamID == teamId)
                .Select(t => new
                {
                    t.TeamID,
                    t.Status,
                    t.CompetitionLevelID,
                    Generated = t.CompetitionLevel != null && t.CompetitionLevel.IsCertificateNumberGenerated,
                    HasNumber = t.TeamCertificates.Any(c => c.CertificateNumber != null && c.CertificateNumber != ""),
                })
                .SingleOrDefaultAsync(ct)
                ?? throw new KeyNotFoundException($"Team with ID {teamId} not found.");

            if (!team.Generated)
                throw new CertificateNotReadyException("ยังไม่เปิดให้ดาวน์โหลดเกียรติบัตร กรุณารอผู้ดูแลระบบปิดการแข่งขันก่อน");
            if (team.HasNumber)
                return;
            if (team.Status != TeamStatus.CheckedIn || team.CompetitionLevelID == null)
                throw new CertificateNotReadyException("ทีมนี้ยังไม่ได้ลงทะเบียนเข้างาน จึงยังไม่มีเกียรติบัตร");

            // ออกเลขเฉพาะทีมที่ยังไม่มีในระดับนี้ (ทีมที่มีเลขแล้วไม่ถูกเปลี่ยน)
            await GenerateTeamCertificatesNumberByLevel(team.CompetitionLevelID.Value, ct: ct);
        }

        /// <summary>
        /// รายการเลขเกียรติบัตรที่ออกแล้วในปี เรียงตามเลข เป็น CSV (UTF-8 มี BOM เปิดใน Excel ภาษาไทยไม่เพี้ยน)
        /// </summary>
        public async Task<byte[]> ExportCertificateStatusCsvAsync(int yearId, CancellationToken ct = default)
        {
            if (!await _context.Years.AnyAsync(y => y.YearID == yearId, ct))
                throw new KeyNotFoundException($"ไม่พบปี ID {yearId}");

            var rows = await CertificateStatusQuery(_context, yearId).ToListAsync(ct);

            static string Esc(string? s) =>
                string.IsNullOrEmpty(s) ? "" : s.IndexOfAny(new[] { ',', '"', '\n', '\r' }) >= 0 ? $"\"{s.Replace("\"", "\"\"")}\"" : s;

            static string StatusText(TeamStatus s) => s switch
            {
                TeamStatus.Registered => "ลงทะเบียน",
                TeamStatus.Verified => "ยืนยันแล้ว",
                TeamStatus.ProjectRevision => "รอแก้ไขโครงงาน",
                TeamStatus.CheckedIn => "เช็คอินแล้ว",
                TeamStatus.Disqualified => "ถูกตัดสิทธิ์",
                _ => s.ToString(),
            };

            // เฉพาะทีมที่มีเลขแล้ว 1 แถวต่อ 1 เลข เรียงตามเลขรัน (เลขรูปแบบผิดไว้ท้ายสุด)
            var numbered = rows
                .SelectMany(r => r.Numbers.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => (Row: r, Number: n!.Trim())))
                .OrderBy(x => ParseRunning(x.Number) ?? int.MaxValue)
                .ThenBy(x => x.Number, StringComparer.Ordinal)
                .ToList();

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("ลำดับ,เลขเกียรติบัตร,กิจกรรม,ระดับชั้น,รหัสทีม,โรงเรียน,ชื่อโครงงาน,สถานะทีม");
            var i = 0;
            foreach (var (r, number) in numbered)
            {
                sb.AppendLine(string.Join(",",
                    ++i, Esc(number), Esc(r.Competition), Esc(r.Level), r.TeamID, Esc(r.School), Esc(r.ProjectName),
                    StatusText(r.Status)));
            }

            return System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        public record CertificateStatusRow(int TeamID, string? Competition, string? Level, bool LevelClosed,
            string? School, string? ProjectName, TeamStatus Status, List<string?> Numbers);

        public static IQueryable<CertificateStatusRow> CertificateStatusQuery(ApplicationDbContext db, int yearId) =>
            db.Teams
                .AsNoTracking()
                .Where(t => t.CompetitionLevel != null && t.CompetitionLevel.CompetitionYear!.YearID == yearId)
                .OrderBy(t => t.CompetitionLevel!.CompetitionYearID)
                .ThenBy(t => t.CompetitionLevelID)
                .ThenBy(t => t.TeamID)
                .Select(t => new CertificateStatusRow(
                    t.TeamID,
                    t.CompetitionLevel!.CompetitionYear!.Competition!.CompetitionName,
                    t.CompetitionLevel.EducationLevel != null ? t.CompetitionLevel.EducationLevel.LevelName : "",
                    t.CompetitionLevel.IsCertificateNumberGenerated,
                    t.schools != null ? t.schools.school_name : "",
                    t.ProjectName,
                    t.Status,
                    t.TeamCertificates!.Select(c => c.CertificateNumber).ToList()));

        // "52/2569" → 52 (รูปแบบผิดคืน null)
        internal static int? ParseRunning(string? number)
        {
            if (string.IsNullOrWhiteSpace(number)) return null;
            var slash = number.IndexOf('/');
            if (slash <= 0) return null;
            return int.TryParse(number[..slash], out var n) ? n : null;
        }
    }
}
