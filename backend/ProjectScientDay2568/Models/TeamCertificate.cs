using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ProjectScientDay2568.Models
{
    // เลขมีปีต่อท้าย ("50/2569") จึงห้ามซ้ำทั้งตาราง — ฐานข้อมูลกันเลขซ้ำอีกชั้นเผื่อกดออกเลขพร้อมกัน
    [Index(nameof(CertificateNumber), IsUnique = true)]
    public class TeamCertificate
    {
        [Key]
        public int CertificateID { get; set; }

        public int TeamID { get; set; }
        [ForeignKey("TeamID")]
        public Team Team { get; set; }

        [Required]
        [MaxLength(255)]
        public string? CertificateNumber { get; set; } // เช่น กจ.331/2568
        public string? CertificateName { get; set; } // เช่น กจ.331/2568

        public DateTime IssuedDate { get; set; } = DateTime.Now;
    }
}
