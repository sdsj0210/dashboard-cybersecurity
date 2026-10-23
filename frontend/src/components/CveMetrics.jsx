function CveMetrics({ metrics }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Métricas CVSS</p>

      {metrics?.length > 0 ? (
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="min-w-0 rounded-lg border bg-card p-4">
              <p>Versión: {metric.version ?? "N/D"}</p>
              <p>Puntuación: {metric.score ?? "N/D"}</p>
              <p>Severidad: {metric.severity ?? "N/D"}</p>
              <p className="break-all">Vector: {metric.vector ?? "N/D"}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay métricas disponibles.</p>
      )}
    </div>
  );
}

export default CveMetrics;
