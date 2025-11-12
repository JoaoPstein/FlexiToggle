using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using FlexiToggle.Sdk.Models;

namespace FlexiToggle.Sdk;

public class FlexiToggleClient : IFlexiToggleClient, IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FlexiToggleClient> _logger;
    private readonly FlexiToggleConfig _config;
    private readonly Timer _pollingTimer;
    private readonly List<AnalyticsEvent> _analyticsBuffer = new();
    private readonly object _lockObject = new();
    
    private Dictionary<string, object> _flags = new();
    private bool _isInitialized = false;
    private string _sessionId = Guid.NewGuid().ToString();

    public bool IsInitialized => _isInitialized;
    
    public event EventHandler<Dictionary<string, object>>? FlagsUpdated;
    public event EventHandler? Ready;
    public event EventHandler<Exception>? Error;

    public FlexiToggleClient(HttpClient httpClient, IOptions<FlexiToggleConfig> config, ILogger<FlexiToggleClient> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _logger = logger;
        
        _httpClient.Timeout = _config.HttpTimeout;
        _sessionId = _config.SessionId ?? Guid.NewGuid().ToString();
        
        // Configurar timer de polling
        _pollingTimer = new Timer(async _ => await PollFlagsAsync(), null, TimeSpan.Zero, _config.PollingInterval);
        
        // Timer para flush de analytics
        _ = Task.Run(async () =>
        {
            while (!_disposed)
            {
                await Task.Delay(TimeSpan.FromSeconds(5));
                await FlushAnalyticsAsync();
            }
        });
    }

    public bool IsEnabled(string flagKey)
    {
        return GetFlag<bool>(flagKey, false);
    }

    public T GetFlag<T>(string flagKey, T defaultValue = default!)
    {
        if (!_isInitialized)
        {
            _logger.LogWarning("SDK não inicializado ainda, retornando valor padrão para {FlagKey}", flagKey);
            return defaultValue;
        }

        lock (_lockObject)
        {
            if (!_flags.TryGetValue(flagKey, out var value))
            {
                _logger.LogWarning("Flag {FlagKey} não encontrada, retornando valor padrão", flagKey);
                return defaultValue;
            }

            // Registrar analytics se habilitado
            if (_config.EnableAnalytics)
            {
                RecordEvaluation(flagKey, value);
            }

            try
            {
                if (value is JsonElement jsonElement)
                {
                    return jsonElement.Deserialize<T>() ?? defaultValue;
                }
                
                return (T)Convert.ChangeType(value, typeof(T)) ?? defaultValue;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao converter valor da flag {FlagKey} para tipo {Type}", flagKey, typeof(T));
                return defaultValue;
            }
        }
    }

    public string GetString(string flagKey, string defaultValue = "")
    {
        return GetFlag(flagKey, defaultValue);
    }

    public int GetNumber(string flagKey, int defaultValue = 0)
    {
        return GetFlag(flagKey, defaultValue);
    }

    public decimal GetDecimal(string flagKey, decimal defaultValue = 0m)
    {
        return GetFlag(flagKey, defaultValue);
    }

    public T GetJson<T>(string flagKey, T defaultValue = default!) where T : class
    {
        var value = GetFlag<object>(flagKey, null);
        if (value == null) return defaultValue;

        try
        {
            if (value is JsonElement jsonElement)
            {
                return jsonElement.Deserialize<T>() ?? defaultValue;
            }
            
            if (value is string jsonString)
            {
                return JsonSerializer.Deserialize<T>(jsonString) ?? defaultValue;
            }
            
            return (T)value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao deserializar JSON para flag {FlagKey}", flagKey);
            return defaultValue;
        }
    }

    public string GetVariant(string testKey, string defaultVariant = "control")
    {
        var test = GetJson<ABTest>(testKey, null);
        if (test?.Variants == null || !test.Variants.Any())
        {
            return defaultVariant;
        }

        // Hash consistente baseado no userId + testKey
        var userId = _config.UserId ?? "anonymous";
        var hash = Math.Abs((userId + testKey).GetHashCode());
        var totalWeight = test.Variants.Sum(v => v.Weight);
        
        if (totalWeight == 0) return defaultVariant;

        var target = (hash % 100) + 1;
        var currentWeight = 0;

        foreach (var variant in test.Variants)
        {
            currentWeight += variant.Weight;
            if (target <= (currentWeight / (double)totalWeight) * 100)
            {
                // Registrar exposição ao teste A/B
                if (_config.EnableAnalytics)
                {
                    RecordABTestExposure(testKey, variant.Name);
                }
                return variant.Name;
            }
        }

        return defaultVariant;
    }

    public async Task TrackAsync(string eventName, Dictionary<string, object>? properties = null)
    {
        if (!_config.EnableAnalytics) return;

        var eventData = new Dictionary<string, object>
        {
            ["name"] = eventName,
            ["userId"] = _config.UserId ?? "anonymous",
            ["sessionId"] = _sessionId,
            ["timestamp"] = DateTime.UtcNow,
            ["properties"] = properties ?? new Dictionary<string, object>()
        };

        QueueAnalyticsEvent("event", eventData);
    }

    public async Task TrackConversionAsync(string testKey, string metricName, decimal value = 1m)
    {
        if (!_config.EnableAnalytics) return;

        var conversionData = new Dictionary<string, object>
        {
            ["testKey"] = testKey,
            ["metricName"] = metricName,
            ["value"] = value,
            ["userId"] = _config.UserId ?? "anonymous",
            ["sessionId"] = _sessionId,
            ["timestamp"] = DateTime.UtcNow
        };

        QueueAnalyticsEvent("conversion", conversionData);
    }

    public async Task UpdateUserAttributesAsync(Dictionary<string, object> attributes)
    {
        foreach (var attr in attributes)
        {
            _config.UserAttributes[attr.Key] = attr.Value;
        }
        
        await RefreshAsync();
    }

    public async Task SetUserIdAsync(string userId)
    {
        _config.UserId = userId;
        await RefreshAsync();
    }

    public async Task RefreshAsync()
    {
        await FetchFlagsAsync();
    }

    private async Task PollFlagsAsync()
    {
        try
        {
            await FetchFlagsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro durante polling de flags");
            Error?.Invoke(this, ex);
        }
    }

    private async Task FetchFlagsAsync()
    {
        try
        {
            var request = new EvaluationRequest
            {
                ProjectKey = _config.ProjectKey,
                Environment = _config.Environment,
                UserId = _config.UserId,
                SessionId = _sessionId,
                UserAttributes = _config.UserAttributes
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/evaluation/flags", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var evaluationResponse = JsonSerializer.Deserialize<EvaluationResponse>(responseJson);

            if (evaluationResponse?.Flags != null)
            {
                lock (_lockObject)
                {
                    _flags = evaluationResponse.Flags;
                }

                if (!_isInitialized)
                {
                    _isInitialized = true;
                    _logger.LogInformation("FeatureHub SDK inicializado com sucesso");
                    Ready?.Invoke(this, EventArgs.Empty);
                }

                FlagsUpdated?.Invoke(this, evaluationResponse.Flags);
                _logger.LogDebug("Flags atualizadas: {FlagCount} flags carregadas", evaluationResponse.Flags.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar flags do FeatureHub");
            Error?.Invoke(this, ex);
        }
    }

    private void RecordEvaluation(string flagKey, object value)
    {
        var evaluationData = new Dictionary<string, object>
        {
            ["flagKey"] = flagKey,
            ["value"] = value,
            ["userId"] = _config.UserId ?? "anonymous",
            ["sessionId"] = _sessionId,
            ["timestamp"] = DateTime.UtcNow,
            ["userAttributes"] = _config.UserAttributes
        };

        QueueAnalyticsEvent("evaluation", evaluationData);
    }

    private void RecordABTestExposure(string testKey, string variant)
    {
        var exposureData = new Dictionary<string, object>
        {
            ["testKey"] = testKey,
            ["variant"] = variant,
            ["userId"] = _config.UserId ?? "anonymous",
            ["sessionId"] = _sessionId,
            ["timestamp"] = DateTime.UtcNow
        };

        QueueAnalyticsEvent("exposure", exposureData);
    }

    private void QueueAnalyticsEvent(string type, Dictionary<string, object> data)
    {
        lock (_analyticsBuffer)
        {
            _analyticsBuffer.Add(new AnalyticsEvent { Type = type, Data = data });
        }
    }

    private async Task FlushAnalyticsAsync()
    {
        List<AnalyticsEvent> eventsToSend;
        
        lock (_analyticsBuffer)
        {
            if (_analyticsBuffer.Count == 0) return;
            eventsToSend = new List<AnalyticsEvent>(_analyticsBuffer);
            _analyticsBuffer.Clear();
        }

        try
        {
            var request = new AnalyticsRequest
            {
                ProjectKey = _config.ProjectKey,
                Environment = _config.Environment,
                Events = eventsToSend
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            await _httpClient.PostAsync("/api/evaluation/analytics/batch", content);
            _logger.LogDebug("Analytics enviado: {EventCount} eventos", eventsToSend.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao enviar analytics");
            // Re-adicionar eventos na fila em caso de erro
            lock (_analyticsBuffer)
            {
                _analyticsBuffer.InsertRange(0, eventsToSend);
            }
        }
    }

    private bool _disposed = false;

    public void Dispose()
    {
        if (_disposed) return;
        
        _disposed = true;
        _pollingTimer?.Dispose();
        
        // Flush final de analytics
        try
        {
            FlushAnalyticsAsync().Wait(TimeSpan.FromSeconds(5));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro durante flush final de analytics");
        }
    }
}

// Classes auxiliares
public class ABTest
{
    public List<ABTestVariant> Variants { get; set; } = new();
}

public class ABTestVariant
{
    public string Name { get; set; } = string.Empty;
    public int Weight { get; set; }
}
