export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

export function formatDuration(duration: string): string {
  const days = parseInt(duration);
  return `${days} day${days === 1 ? '' : 's'}`;
}
