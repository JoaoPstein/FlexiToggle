namespace FlexiToggle.Sdk;

public interface IFlexiToggleClient
{
    /// <summary>
    /// Verifica se uma feature flag está habilitada
    /// </summary>
    bool IsEnabled(string flagKey);
    
    /// <summary>
    /// Obtém o valor de uma feature flag
    /// </summary>
    T GetFlag<T>(string flagKey, T defaultValue = default!);
    
    /// <summary>
    /// Obtém uma string de configuração
    /// </summary>
    string GetString(string flagKey, string defaultValue = "");
    
    /// <summary>
    /// Obtém um número de configuração
    /// </summary>
    int GetNumber(string flagKey, int defaultValue = 0);
    
    /// <summary>
    /// Obtém um valor decimal de configuração
    /// </summary>
    decimal GetDecimal(string flagKey, decimal defaultValue = 0m);
    
    /// <summary>
    /// Obtém um objeto JSON de configuração
    /// </summary>
    T GetJson<T>(string flagKey, T defaultValue = default!) where T : class;
    
    /// <summary>
    /// Obtém a variante de um teste A/B
    /// </summary>
    string GetVariant(string testKey, string defaultVariant = "control");
    
    /// <summary>
    /// Registra um evento customizado
    /// </summary>
    Task TrackAsync(string eventName, Dictionary<string, object>? properties = null);
    
    /// <summary>
    /// Registra uma conversão para teste A/B
    /// </summary>
    Task TrackConversionAsync(string testKey, string metricName, decimal value = 1m);
    
    /// <summary>
    /// Atualiza os atributos do usuário
    /// </summary>
    Task UpdateUserAttributesAsync(Dictionary<string, object> attributes);
    
    /// <summary>
    /// Define o ID do usuário
    /// </summary>
    Task SetUserIdAsync(string userId);
    
    /// <summary>
    /// Força a atualização das feature flags
    /// </summary>
    Task RefreshAsync();
    
    /// <summary>
    /// Verifica se o cliente está inicializado
    /// </summary>
    bool IsInitialized { get; }
    
    /// <summary>
    /// Evento disparado quando as flags são atualizadas
    /// </summary>
    event EventHandler<Dictionary<string, object>>? FlagsUpdated;
    
    /// <summary>
    /// Evento disparado quando o cliente está pronto
    /// </summary>
    event EventHandler? Ready;
    
    /// <summary>
    /// Evento disparado quando ocorre um erro
    /// </summary>
    event EventHandler<Exception>? Error;
}
