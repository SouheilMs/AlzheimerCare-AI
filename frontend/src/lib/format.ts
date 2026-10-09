const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)

export const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(toDate(iso)) : '—'

export const formatRelative = (iso: string) => {
  const minutes = Math.round((toDate(iso).getTime() - Date.now()) / 60000)
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(minutes) < 1440) return rtf.format(Math.round(minutes / 60), 'hour')
  return rtf.format(Math.round(minutes / 1440), 'day')
}