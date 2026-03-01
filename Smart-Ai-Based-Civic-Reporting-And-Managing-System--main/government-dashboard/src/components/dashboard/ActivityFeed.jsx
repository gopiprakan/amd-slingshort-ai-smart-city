export default function ActivityFeed({ events }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">Activity Feed</h5>
        {events.length === 0 ? (
          <p className="text-muted mb-0">No recent activity.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {events.map((event, index) => (
              <li key={event.id ?? `${event.timestamp ?? event.time}-${index}`} className="list-group-item px-0">
                <div className="fw-semibold">{event.title ?? event.event ?? 'Complaint Update'}</div>
                <div>{event.description ?? event.message ?? ''}</div>
                <small className="text-muted">{event.timestamp ?? event.time ?? ''}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
