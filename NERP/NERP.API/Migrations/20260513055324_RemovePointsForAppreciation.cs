using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    public partial class RemovePointsForAppreciation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE Recognitions SET Points = 0 WHERE Type = 'appreciation'"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed
        }
    }
}