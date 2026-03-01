export default function LiveKPIBar({ summary }) {
  const activeComplaints = summary?.active_complaints ?? summary?.activeComplaints ?? 0;
  const criticalUnresolved = summary?.critical_unresolved ?? summary?.criticalUnresolved ?? 0;
  const complaintsToday = summary?.complaints_today ?? summary?.complaintsToday ?? 0;
  const overdueCount = summary?.overdue_count ?? summary?.overdueCount ?? 0;
  const avgResolutionTime = summary?.avg_resolution_time ?? summary?.avgResolutionTime ?? '-';

  const kpis = [
    { label: 'Active Complaints', value: activeComplaints, cardClass: 'bg-primary text-white' },
    { label: 'Critical Unresolved', value: criticalUnresolved, cardClass: 'bg-danger text-white' },
    { label: 'Complaints Today', value: complaintsToday, cardClass: 'bg-info text-white' },
    { label: 'Overdue Count', value: overdueCount, cardClass: 'bg-warning text-dark' },
    { label: 'Avg Resolution Time', value: avgResolutionTime, cardClass: 'bg-success text-white' },
  ];

  return (
    <div className="row g-3">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="col-12 col-sm-6 col-lg">
          <div className={`card h-100 ${kpi.cardClass}`}>
            <div className="card-body">
              <h6 className="card-title mb-1">{kpi.label}</h6>
              <h3 className="mb-0">{kpi.value}</h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
