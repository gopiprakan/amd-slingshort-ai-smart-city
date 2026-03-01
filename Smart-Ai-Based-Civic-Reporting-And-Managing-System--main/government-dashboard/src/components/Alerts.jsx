export default function Alerts() {
  const alerts = [
    {
      id: 1,
      type: 'danger',
      title: '⚠️ Critical Alert',
      message: 'AI predicts 40% increase in road complaints in next 7 days'
    },
    {
      id: 2,
      type: 'warning',
      title: '🔔 High Priority',
      message: 'Electricity complaints rising in Zone A - immediate attention needed'
    },
    {
      id: 3,
      type: 'info',
      title: '📊 Trend Alert',
      message: 'Water supply complaints decreased by 25% this week'
    },
    {
      id: 4,
      type: 'warning',
      title: '⚡ Prediction',
      message: 'Expected spike in sanitation complaints during weekend'
    }
  ];

  return (
    <div className="container-fluid p-4">
      <h4>AI Prediction Alerts</h4>
      <div className="mt-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.type} mb-3`} role="alert">
            <h6 className="alert-heading">{alert.title}</h6>
            <p className="mb-0">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
