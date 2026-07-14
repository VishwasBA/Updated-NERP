using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class NewUpdateProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$BVFFoAy8CH6s9wqgpL5cx.mjAfEt.kdNyVsCwvQ8qtyZOKTNWSvpu");
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
