using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRecognitionReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecognitionLikes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecognitionId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecognitionLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecognitionLikes_Recognitions_RecognitionId",
                        column: x => x.RecognitionId,
                        principalTable: "Recognitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecognitionLikes_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecognitionComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecognitionId = table.Column<int>(type: "int", nullable: false),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecognitionComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecognitionComments_Recognitions_RecognitionId",
                        column: x => x.RecognitionId,
                        principalTable: "Recognitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecognitionComments_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecognitionLikes_RecognitionId_EmployeeId",
                table: "RecognitionLikes",
                columns: new[] { "RecognitionId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecognitionLikes_EmployeeId",
                table: "RecognitionLikes",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_RecognitionComments_RecognitionId_CreatedAt",
                table: "RecognitionComments",
                columns: new[] { "RecognitionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RecognitionComments_EmployeeId",
                table: "RecognitionComments",
                column: "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RecognitionLikes");
            migrationBuilder.DropTable(name: "RecognitionComments");
        }
    }
}
