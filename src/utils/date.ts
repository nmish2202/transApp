const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit'
});

export function formatSessionDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatTimestamp(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function createSessionTitle(createdAt: string): string {
  return `Conversation ${formatSessionDate(createdAt)}`;
}