using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class Removingdeadcode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$XntYi9qo3sQxBEMfgBBkb.nT8vhw4Ky2lOMHyxYIIEztWSyvpU33O");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$3qmBklJIBoFmouV9jjSc7eiVKAqJ7q8c8/bqGJt3wE7bZwZ2GzTT2");
        }
    }
}
