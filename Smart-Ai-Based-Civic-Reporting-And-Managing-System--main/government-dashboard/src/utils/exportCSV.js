const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
};

export function exportComplaintsToCSV(complaints) {
  const rows = Array.isArray(complaints) ? complaints : [];

  if (rows.length === 0) {
    return;
  }

  const headers = [
    'complaint_id',
    'description',
    'department_id',
    'priority_level',
    'status',
    'latitude',
    'longitude',
    'submitted_time'
  ];

  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    const line = headers.map((header) => escapeCell(row[header])).join(',');
    csvLines.push(line);
  });

  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', 'complaints_report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
