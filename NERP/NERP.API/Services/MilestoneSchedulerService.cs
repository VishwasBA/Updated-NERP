using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EmployeeRecognition.API.Services;

public class MilestoneSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MilestoneSchedulerService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public MilestoneSchedulerService(
        IServiceProvider serviceProvider,
        ILogger<MilestoneSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MilestoneSchedulerService started.");

        // Wait 30 seconds after startup before the first run
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var service = scope.ServiceProvider.GetRequiredService<MilestoneNotificationService>();
                    await service.ProcessMilestonesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during milestone check execution.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("MilestoneSchedulerService stopped.");
    }
}
