using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    public partial class FixAppreciationPointsData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE Recognitions SET Points = 0 WHERE Type = 'appreciation' AND Points <> 0"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // no rollback needed
        }
    }
}