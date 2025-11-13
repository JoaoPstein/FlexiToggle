using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FlexiToggle.Api.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<FlexiToggleContext>
{
    public FlexiToggleContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FlexiToggleContext>();
        
        // Connection string para design time (migrations) - offline mode
        var connectionString = "Server=localhost;Database=FlexiToggleDB;User=root;Password=root123;";
        optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 0)));
        
        return new FlexiToggleContext(optionsBuilder.Options);
    }
}
