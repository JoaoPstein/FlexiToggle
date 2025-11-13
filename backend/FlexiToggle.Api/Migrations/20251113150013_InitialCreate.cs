using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FlexiToggle.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Key = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Projects_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Environments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Environments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Environments_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureFlags_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureFlags_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProjectMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Webhooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Secret = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Events = table.Column<int>(type: "INTEGER", nullable: false),
                    CustomHeaders = table.Column<string>(type: "TEXT", nullable: true),
                    TimeoutSeconds = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxRetries = table.Column<int>(type: "INTEGER", nullable: false),
                    RetryDelaySeconds = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Webhooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Webhooks_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Webhooks_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ApiKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    KeyHash = table.Column<string>(type: "TEXT", nullable: false),
                    KeyPrefix = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EnvironmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApiKeys_Environments_EnvironmentId",
                        column: x => x.EnvironmentId,
                        principalTable: "Environments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApiKeys_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlagEnvironments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultValue = table.Column<string>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FeatureFlagId = table.Column<int>(type: "INTEGER", nullable: false),
                    EnvironmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedById = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlagEnvironments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEnvironments_Environments_EnvironmentId",
                        column: x => x.EnvironmentId,
                        principalTable: "Environments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEnvironments_FeatureFlags_FeatureFlagId",
                        column: x => x.FeatureFlagId,
                        principalTable: "FeatureFlags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEnvironments_Users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlagEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Data = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FeatureFlagId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    EnvironmentId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlagEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEvents_Environments_EnvironmentId",
                        column: x => x.EnvironmentId,
                        principalTable: "Environments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEvents_FeatureFlags_FeatureFlagId",
                        column: x => x.FeatureFlagId,
                        principalTable: "FeatureFlags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureFlagEvents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlagTags",
                columns: table => new
                {
                    FeatureFlagId = table.Column<int>(type: "INTEGER", nullable: false),
                    TagId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlagTags", x => new { x.FeatureFlagId, x.TagId });
                    table.ForeignKey(
                        name: "FK_FeatureFlagTags_FeatureFlags_FeatureFlagId",
                        column: x => x.FeatureFlagId,
                        principalTable: "FeatureFlags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeatureFlagTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebhookDeliveries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WebhookId = table.Column<int>(type: "INTEGER", nullable: false),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Payload = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ResponseStatusCode = table.Column<int>(type: "INTEGER", nullable: true),
                    ResponseBody = table.Column<string>(type: "TEXT", nullable: true),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AttemptCount = table.Column<int>(type: "INTEGER", nullable: false),
                    NextRetryAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    WebhookId1 = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookDeliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WebhookDeliveries_Webhooks_WebhookId",
                        column: x => x.WebhookId,
                        principalTable: "Webhooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WebhookDeliveries_Webhooks_WebhookId1",
                        column: x => x.WebhookId1,
                        principalTable: "Webhooks",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActivationStrategies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Parameters = table.Column<string>(type: "TEXT", nullable: true),
                    Constraints = table.Column<string>(type: "TEXT", nullable: true),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FeatureFlagEnvironmentId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivationStrategies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivationStrategies_FeatureFlagEnvironments_FeatureFlagEnvironmentId",
                        column: x => x.FeatureFlagEnvironmentId,
                        principalTable: "FeatureFlagEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlagMetrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Evaluations = table.Column<int>(type: "INTEGER", nullable: false),
                    EnabledCount = table.Column<int>(type: "INTEGER", nullable: false),
                    DisabledCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AverageResponseTime = table.Column<double>(type: "REAL", nullable: true),
                    FeatureFlagEnvironmentId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlagMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureFlagMetrics_FeatureFlagEnvironments_FeatureFlagEnvironmentId",
                        column: x => x.FeatureFlagEnvironmentId,
                        principalTable: "FeatureFlagEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsActive", "LastLoginAt", "Name", "PasswordHash", "Role" },
                values: new object[] { 1, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(610), "admin@featurehub.com", true, null, "Admin User", "$2a$11$bATxdwEVki0CUFH5lVc8hOIBuBedn2./ygXo8oqrq3/U/Q.J5ADmq", 0 });

            migrationBuilder.InsertData(
                table: "Projects",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "Description", "IsActive", "Key", "Name", "UpdatedAt" },
                values: new object[] { 1, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1220), 1, "Projeto de demonstração do FeatureHub", true, "demo", "Demo Project", new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1220) });

            migrationBuilder.InsertData(
                table: "Environments",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "Key", "Name", "ProjectId", "SortOrder" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1300), "Ambiente de desenvolvimento", true, "development", "Development", 1, 1 },
                    { 2, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1300), "Ambiente de homologação", true, "staging", "Staging", 1, 2 },
                    { 3, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1300), "Ambiente de produção", true, "production", "Production", 1, 3 }
                });

            migrationBuilder.InsertData(
                table: "FeatureFlags",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "Description", "IsArchived", "Key", "Name", "ProjectId", "Type", "UpdatedAt" },
                values: new object[,]
                {
                    { 10, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1420), 1, "Ativar nova interface do usuário", false, "new_ui", "Nova Interface", 1, 0, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1420) },
                    { 11, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1420), 1, "Habilitar novo sistema de pagamento", false, "payment_system", "Sistema de Pagamento", 1, 0, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1420) },
                    { 12, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1430), 1, "Limite de tamanho para upload de arquivos", false, "upload_limit", "Limite de Upload", 1, 2, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1430) }
                });

            migrationBuilder.InsertData(
                table: "ProjectMembers",
                columns: new[] { "Id", "JoinedAt", "ProjectId", "Role", "UserId" },
                values: new object[] { 1, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1250), 1, 0, 1 });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Color", "CreatedAt", "Name", "ProjectId" },
                values: new object[,]
                {
                    { 10, "#3b82f6", new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1500), "frontend", 1 },
                    { 11, "#10b981", new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1500), "backend", 1 },
                    { 12, "#f59e0b", new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1500), "experimental", 1 }
                });

            migrationBuilder.InsertData(
                table: "FeatureFlagEnvironments",
                columns: new[] { "Id", "DefaultValue", "EnvironmentId", "FeatureFlagId", "IsEnabled", "UpdatedAt", "UpdatedById" },
                values: new object[,]
                {
                    { 10, "true", 1, 10, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1450), null },
                    { 11, "true", 2, 10, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1450), null },
                    { 12, "false", 3, 10, false, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1450), null },
                    { 13, "true", 1, 11, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null },
                    { 14, "false", 2, 11, false, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null },
                    { 15, "false", 3, 11, false, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null },
                    { 16, "100", 1, 12, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null },
                    { 17, "50", 2, 12, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null },
                    { 18, "25", 3, 12, true, new DateTime(2025, 11, 13, 15, 0, 12, 722, DateTimeKind.Utc).AddTicks(1460), null }
                });

            migrationBuilder.InsertData(
                table: "FeatureFlagTags",
                columns: new[] { "FeatureFlagId", "TagId" },
                values: new object[,]
                {
                    { 10, 10 },
                    { 11, 11 },
                    { 12, 12 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivationStrategies_FeatureFlagEnvironmentId",
                table: "ActivationStrategies",
                column: "FeatureFlagEnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_CreatedById",
                table: "ApiKeys",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_EnvironmentId",
                table: "ApiKeys",
                column: "EnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_KeyHash",
                table: "ApiKeys",
                column: "KeyHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Environments_ProjectId_Key",
                table: "Environments",
                columns: new[] { "ProjectId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEnvironments_EnvironmentId",
                table: "FeatureFlagEnvironments",
                column: "EnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEnvironments_FeatureFlagId_EnvironmentId",
                table: "FeatureFlagEnvironments",
                columns: new[] { "FeatureFlagId", "EnvironmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEnvironments_UpdatedById",
                table: "FeatureFlagEnvironments",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEvents_EnvironmentId",
                table: "FeatureFlagEvents",
                column: "EnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEvents_FeatureFlagId",
                table: "FeatureFlagEvents",
                column: "FeatureFlagId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagEvents_UserId",
                table: "FeatureFlagEvents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagMetrics_FeatureFlagEnvironmentId_Timestamp",
                table: "FeatureFlagMetrics",
                columns: new[] { "FeatureFlagEnvironmentId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlags_CreatedById",
                table: "FeatureFlags",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlags_ProjectId_Key",
                table: "FeatureFlags",
                columns: new[] { "ProjectId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlagTags_TagId",
                table: "FeatureFlagTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_ProjectId_UserId",
                table: "ProjectMembers",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_UserId",
                table: "ProjectMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_CreatedById",
                table: "Projects",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Key",
                table: "Projects",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ProjectId_Name",
                table: "Tags",
                columns: new[] { "ProjectId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebhookDeliveries_WebhookId",
                table: "WebhookDeliveries",
                column: "WebhookId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookDeliveries_WebhookId1",
                table: "WebhookDeliveries",
                column: "WebhookId1");

            migrationBuilder.CreateIndex(
                name: "IX_Webhooks_CreatedById",
                table: "Webhooks",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Webhooks_ProjectId",
                table: "Webhooks",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivationStrategies");

            migrationBuilder.DropTable(
                name: "ApiKeys");

            migrationBuilder.DropTable(
                name: "FeatureFlagEvents");

            migrationBuilder.DropTable(
                name: "FeatureFlagMetrics");

            migrationBuilder.DropTable(
                name: "FeatureFlagTags");

            migrationBuilder.DropTable(
                name: "ProjectMembers");

            migrationBuilder.DropTable(
                name: "WebhookDeliveries");

            migrationBuilder.DropTable(
                name: "FeatureFlagEnvironments");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Webhooks");

            migrationBuilder.DropTable(
                name: "Environments");

            migrationBuilder.DropTable(
                name: "FeatureFlags");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
