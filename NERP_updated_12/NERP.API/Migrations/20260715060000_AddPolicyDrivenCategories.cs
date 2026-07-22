using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeRecognition.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPolicyDrivenCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ApprovalLevel",
                table: "AwardCategories",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "IsAccumulative",
                table: "AwardCategories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AccumulationIncrement",
                table: "AwardCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AccumulationThreshold",
                table: "AwardCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresRecentJoiner",
                table: "AwardCategories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RecentJoinerMaxMonths",
                table: "AwardCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PeerReviewerId",
                table: "Recognitions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PeerReviewedAt",
                table: "Recognitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SelfDevelopmentAccumulatedPoints",
                table: "Employees",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_PeerReviewerId",
                table: "Recognitions",
                column: "PeerReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Recognitions_Employees_PeerReviewerId",
                table: "Recognitions",
                column: "PeerReviewerId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Swap out the old placeholder category set for the real HR
            // "Policy & Category" list. Existing recognitions referencing
            // these old Ids keep their CategoryId as-is (harmless — display
            // code already tolerates a null/missing category), they just
            // won't resolve to a category row anymore once it's deleted.
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 1);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 2);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 3);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 4);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 5);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 6);

            migrationBuilder.InsertData(
                table: "AwardCategories",
                columns: new[] { "Id", "Description", "Icon", "ManagerOnly", "Name", "Points", "ApprovalLevel", "IsAccumulative", "AccumulationIncrement", "AccumulationThreshold", "RequiresRecentJoiner", "RecentJoinerMaxMonths" },
                values: new object[,]
                {
                    { 1, "A simple gesture can brighten up someone's day — give a shout-out to recognize a peer for their work.", "👏", false, "Kudos", 0, 0, false, 0, 0, false, 0 },
                    { 2, "Any significant effort towards producing customer delight, internal or external, adding value to customers or stakeholders.", "🎯", true, "Customer Focus", 500, 1, false, 0, 0, false, 0 },
                    { 3, "Operating effectively even when things are not certain, or the way forward is not clear.", "🧭", true, "Manages Ambiguity", 500, 1, false, 0, 0, false, 0 },
                    { 4, "Learning & development award — points accumulate 100 per completed training, redeemable once you reach 500.", "📚", true, "Self Development", 100, 1, true, 100, 500, false, 0 },
                    { 5, "Taking on new opportunities and tough challenges with a sense of urgency, high energy and enthusiasm.", "⚡", true, "Action Oriented", 500, 1, false, 0, 0, false, 0 },
                    { 6, "Taking responsibility, owning up to commitments and being answerable for your actions.", "🛡️", true, "Ensures Accountability", 500, 1, false, 0, 0, false, 0 },
                    { 7, "Consistently achieving results, even under tough circumstances.", "📈", true, "Drives Result", 500, 1, false, 0, 0, false, 0 },
                    { 8, "Innovative solution to overcome a challenge, or innovation of process.", "💡", true, "Innovation Award", 500, 1, false, 0, 0, false, 0 },
                    { 9, "Demonstrate exemplary individual achievements, contributions, and outstanding job performance in a very demanding project or delivery.", "🏆", true, "Employee of the Quarter", 2000, 2, false, 0, 0, false, 0 },
                    { 10, "For new joinees — recognizes strong impact within their first 6 months.", "🌟", true, "Rising Star", 3000, 2, false, 0, 0, true, 6 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recognitions_Employees_PeerReviewerId",
                table: "Recognitions");

            migrationBuilder.DropIndex(
                name: "IX_Recognitions_PeerReviewerId",
                table: "Recognitions");

            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 1);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 2);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 3);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 4);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 5);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 6);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 7);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 8);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 9);
            migrationBuilder.DeleteData(table: "AwardCategories", keyColumn: "Id", keyValue: 10);

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

            migrationBuilder.DropColumn(name: "ApprovalLevel", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "IsAccumulative", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "AccumulationIncrement", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "AccumulationThreshold", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "RequiresRecentJoiner", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "RecentJoinerMaxMonths", table: "AwardCategories");
            migrationBuilder.DropColumn(name: "PeerReviewerId", table: "Recognitions");
            migrationBuilder.DropColumn(name: "PeerReviewedAt", table: "Recognitions");
            migrationBuilder.DropColumn(name: "SelfDevelopmentAccumulatedPoints", table: "Employees");
        }
    }
}
