using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNominationEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.AddColumn<string>(
                name: "AwardCycle",
                table: "Recognitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BUDecisionDate",
                table: "Recognitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BUManagerId",
                table: "Recognitions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomCategory",
                table: "Recognitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HRAdminId",
                table: "Recognitions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HRDecisionDate",
                table: "Recognitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AwardType",
                table: "AwardCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "NominationAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecognitionId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PerformedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NominationAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NominationAudits_Recognitions_RecognitionId",
                        column: x => x.RecognitionId,
                        principalTable: "Recognitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PointsAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecognitionId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointsAudits_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PointsAudits_Recognitions_RecognitionId",
                        column: x => x.RecognitionId,
                        principalTable: "Recognitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 3,
                column: "AwardType",
                value: "appreciation");

            migrationBuilder.UpdateData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 5,
                column: "AwardType",
                value: "appreciation");

            migrationBuilder.UpdateData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 6,
                column: "AwardType",
                value: "appreciation");

            migrationBuilder.InsertData(
                table: "AwardCategories",
                columns: new[] { "Id", "AwardType", "Description", "Icon", "ManagerOnly", "Name", "Points" },
                values: new object[,]
                {
                    { 7, "spot", "Customer-centric dedication and service", "🎯", true, "Customer Focus", 500 },
                    { 8, "spot", "Succeeds even in complex or uncertain conditions", "🌀", true, "Manages Ambiguity", 500 },
                    { 9, "spot", "Commitment to learning and self-improvement", "📚", true, "Self Development", 500 },
                    { 10, "spot", "Proactive drive and bias for action", "⚡", true, "Action Oriented", 500 },
                    { 11, "spot", "Takes ownership and follows through", "🤝", true, "Ensures Accountability", 500 },
                    { 12, "spot", "Focus on output and results", "📈", true, "Drives Result", 500 },
                    { 13, "spot", "Exceptional innovation and creative solutions", "💡", true, "Innovation Award (BA)", 500 },
                    { 14, "performance", "Outstanding performance this quarter", "🏆", true, "Employee of the Quarter", 2000 },
                    { 15, "performance", "Promising talent within first 6 months", "✨", true, "Rising Star (BA)", 3000 }
                });

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "JoiningDate", "Location", "PasswordHash" },
                values: new object[] { new DateOnly(2021, 1, 1), "Sweden", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9." });

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "Id", "Avatar", "BirthDate", "Department", "Email", "IsActive", "JoiningDate", "Location", "ManagerId", "Name", "PasswordHash", "Role", "TotalPoints", "UserRole" },
                values: new object[,]
                {
                    { 2, "BA", null, "BU 1", "bu.manager.a@company.com", true, new DateOnly(2021, 1, 1), "Sweden", 1, "BU Manager A", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "BU Head", 0, "manager" },
                    { 3, "BB", null, "BU 2", "bu.manager.b@company.com", true, new DateOnly(2021, 1, 1), "Sweden", 1, "BU Manager B", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "BU Head", 0, "manager" },
                    { 4, "C1", null, "BU 1", "cu.manager.a1@company.com", true, new DateOnly(2022, 1, 1), "Sweden", 2, "CU Manager A1", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "CU Lead", 0, "manager" },
                    { 5, "C2", null, "BU 1", "cu.manager.a2@company.com", true, new DateOnly(2022, 1, 1), "Sweden", 2, "CU Manager A2", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "CU Lead", 0, "manager" },
                    { 6, "C3", null, "BU 2", "cu.manager.b1@company.com", true, new DateOnly(2022, 1, 1), "Sweden", 3, "CU Manager B1", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "CU Lead", 0, "manager" },
                    { 7, "HA", null, "BU 1", "harika@company.com", true, new DateOnly(2025, 1, 1), "Sweden", 4, "Harika", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "Senior Engineer", 0, "employee" },
                    { 8, "VI", null, "BU 1", "vishwas@company.com", true, new DateOnly(2026, 5, 16), "Sweden", 5, "Vishwas", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "Developer", 0, "employee" },
                    { 9, "RA", null, "BU 2", "rahul@company.com", true, new DateOnly(2025, 1, 1), "Sweden", 6, "Rahul", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "Developer", 0, "employee" },
                    { 10, "AN", null, "BU 1", "anjali@company.com", true, new DateOnly(2026, 6, 16), "Sweden", 4, "Anjali", "$2a$11$KTarDjBgVZcdQJ5JQ3I.K.OoIBSBdnirmSl8Qg/N7Os8F3/FWLv9.", "Developer", 0, "employee" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_BUManagerId",
                table: "Recognitions",
                column: "BUManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_HRAdminId",
                table: "Recognitions",
                column: "HRAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_NominationAudits_RecognitionId",
                table: "NominationAudits",
                column: "RecognitionId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsAudits_EmployeeId",
                table: "PointsAudits",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsAudits_RecognitionId",
                table: "PointsAudits",
                column: "RecognitionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Recognitions_Employees_BUManagerId",
                table: "Recognitions",
                column: "BUManagerId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Recognitions_Employees_HRAdminId",
                table: "Recognitions",
                column: "HRAdminId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recognitions_Employees_BUManagerId",
                table: "Recognitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Recognitions_Employees_HRAdminId",
                table: "Recognitions");

            migrationBuilder.DropTable(
                name: "NominationAudits");

            migrationBuilder.DropTable(
                name: "PointsAudits");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_BUManagerId",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_HRAdminId",
                table: "Recognitions");

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "AwardCategories",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DropColumn(
                name: "AwardCycle",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "BUDecisionDate",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "BUManagerId",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "CustomCategory",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "HRAdminId",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "HRDecisionDate",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "AwardType",
                table: "AwardCategories");

            migrationBuilder.InsertData(
                table: "AwardCategories",
                columns: new[] { "Id", "Description", "Icon", "ManagerOnly", "Name", "Points" },
                values: new object[,]
                {
                    { 1, "Outstanding performance and dedication", "⭐", true, "Star of the Month", 500 },
                    { 2, "Consistently exceeds expectations", "🏆", true, "Employee of the Month", 1000 },
                    { 4, "Creative solutions and new ideas", "💡", true, "Innovation Champion", 300 }
                });

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "JoiningDate", "Location", "PasswordHash" },
                values: new object[] { null, "", "$2a$11$XntYi9qo3sQxBEMfgBBkb.nT8vhw4Ky2lOMHyxYIIEztWSyvpU33O" });
        }
    }
}
