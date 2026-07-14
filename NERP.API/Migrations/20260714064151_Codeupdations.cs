using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class Codeupdations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$7.QyV1pWUrEmcpRQRvYxz.27HPZOdk8p8pmcWudGcdkpDbZ59D1S.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$BVFFoAy8CH6s9wqgpL5cx.mjAfEt.kdNyVsCwvQ8qtyZOKTNWSvpu");
        }
    }
}
