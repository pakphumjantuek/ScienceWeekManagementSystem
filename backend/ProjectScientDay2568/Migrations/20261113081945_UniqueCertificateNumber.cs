using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectScientDay2568.Migrations
{
    // เขียนเองเฉพาะส่วนที่เปลี่ยน: ห้ามเลขเกียรติบัตรซ้ำ (เลขมีปีต่อท้าย เช่น "50/2569")
    // ถ้ามีเลขซ้ำอยู่แล้วในฐานข้อมูล migration นี้จะล้ม ต้องแก้ข้อมูลที่ซ้ำก่อน
    public partial class UniqueCertificateNumber : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TeamCertificates_CertificateNumber",
                table: "TeamCertificates",
                column: "CertificateNumber",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeamCertificates_CertificateNumber",
                table: "TeamCertificates");
        }
    }
}
