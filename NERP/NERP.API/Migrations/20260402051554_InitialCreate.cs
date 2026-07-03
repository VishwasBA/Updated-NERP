using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AwardCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ManagerOnly = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AwardCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserRole = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalPoints = table.Column<int>(type: "int", nullable: false),
                    Avatar = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Recognitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FromEmployeeId = table.Column<int>(type: "int", nullable: false),
                    ToEmployeeId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: true),
                    Points = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recognitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Recognitions_AwardCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "AwardCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Recognitions_Employees_FromEmployeeId",
                        column: x => x.FromEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Recognitions_Employees_ToEmployeeId",
                        column: x => x.ToEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AwardCategories",
                columns: new[] { "Id", "Description", "Icon", "ManagerOnly", "Name", "Points" },
                values: new object[,]
                {
                    { 1, "Outstanding performance and dedication", "⭐", true, "Star of the Month", 500 },
                    { 2, "Consistently exceeds expectations", "🏆", true, "Employee of the Month", 1000 },
                    { 3, "Exceptional collaboration and teamwork", "🤝", false, "Team Player", 200 },
                    { 4, "Creative solutions and new ideas", "💡", true, "Innovation Champion", 300 },
                    { 5, "Goes above and beyond to help others", "🙌", false, "Helping Hand", 150 },
                    { 6, "Rapid skill development and growth", "🚀", false, "Quick Learner", 100 }
                });

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "Id", "Avatar", "Department", "Email", "Name", "PasswordHash", "Role", "TotalPoints", "UserRole" },
                values: new object[] { 1, "AU", "HR", "admin@company.com", "Admin User", "$2a$11$f6IavfO9Y52L6t27WgPIrucxjtEpS9Rhvk.hj5Fbmt0NcMLCTPulW", "HR Manager", 0, "admin" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_CategoryId",
                table: "Recognitions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_FromEmployeeId",
                table: "Recognitions",
                column: "FromEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_ToEmployeeId",
                table: "Recognitions",
                column: "ToEmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Recognitions");

            migrationBuilder.DropTable(
                name: "AwardCategories");

            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
