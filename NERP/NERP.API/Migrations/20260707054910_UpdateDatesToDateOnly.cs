using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatesToDateOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RewardRedemptions_EmployeeId",
                table: "RewardRedemptions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_CreatedAt",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_FromEmployeeId",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_Status",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_ToEmployeeId",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_Type",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_EmployeeId",
                table: "Notifications");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "JoiningDate",
                table: "Employees",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Employees",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateOnly>(
                name: "BirthDate",
                table: "Employees",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BirthDate", "JoiningDate", "PasswordHash" },
                values: new object[] { null, null, "$2a$11$3qmBklJIBoFmouV9jjSc7eiVKAqJ7q8c8/bqGJt3wE7bZwZ2GzTT2" });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_EmployeeId_CreatedAt",
                table: "RewardRedemptions",
                columns: new[] { "EmployeeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_FromEmployeeId_CreatedAt",
                table: "Recognitions",
                columns: new[] { "FromEmployeeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_Status_CreatedAt",
                table: "Recognitions",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_ToEmployeeId_CreatedAt",
                table: "Recognitions",
                columns: new[] { "ToEmployeeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_ToEmployeeId_Type_Status",
                table: "Recognitions",
                columns: new[] { "ToEmployeeId", "Type", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_Type_Status_CreatedAt",
                table: "Recognitions",
                columns: new[] { "Type", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_EmployeeId_CreatedAt",
                table: "Notifications",
                columns: new[] { "EmployeeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Email",
                table: "Employees",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_TotalPoints",
                table: "Employees",
                column: "TotalPoints");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RewardRedemptions_EmployeeId_CreatedAt",
                table: "RewardRedemptions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_FromEmployeeId_CreatedAt",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_Status_CreatedAt",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_ToEmployeeId_CreatedAt",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_ToEmployeeId_Type_Status",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_Type_Status_CreatedAt",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_EmployeeId_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Employees_Email",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_TotalPoints",
                table: "Employees");

            migrationBuilder.AlterColumn<DateTime>(
                name: "JoiningDate",
                table: "Employees",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "BirthDate",
                table: "Employees",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BirthDate", "JoiningDate", "PasswordHash" },
                values: new object[] { null, null, "$2a$11$G8tnoVOHPeZ6v.KbE0KdueccPuRY4TUWHVzVAXavghln1UvZED7Bu" });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_EmployeeId",
                table: "RewardRedemptions",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_CreatedAt",
                table: "Recognitions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_FromEmployeeId",
                table: "Recognitions",
                column: "FromEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_Status",
                table: "Recognitions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_ToEmployeeId",
                table: "Recognitions",
                column: "ToEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_Type",
                table: "Recognitions",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_EmployeeId",
                table: "Notifications",
                column: "EmployeeId");
        }
    }
}
