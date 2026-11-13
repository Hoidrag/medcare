export function getLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateForUser(date: Date, options: Intl.DateTimeFormatOptions) {
  const dateFormat = typeof document === 'undefined'
    ? 'long'
    : document.documentElement.dataset.dateFormat
  if (
    (dateFormat === 'dd.MM.yyyy' || dateFormat === 'dd/MM/yyyy')
    && options.day
    && options.month
  ) {
    const dateParts = new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      ...(options.year ? { year: options.year } : {}),
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    }).formatToParts(date)
    const day = dateParts.find((part) => part.type === 'day')?.value ?? ''
    const month = dateParts.find((part) => part.type === 'month')?.value ?? ''
    const year = options.year
      ? dateParts.find((part) => part.type === 'year')?.value ?? ''
      : ''
    const separator = dateFormat === 'dd.MM.yyyy' ? '.' : '/'
    const numericDate = [day, month, year].filter(Boolean).join(separator)
    const weekday = options.weekday
      ? `${new Intl.DateTimeFormat('ro-RO', {
          weekday: options.weekday,
          ...(options.timeZone ? { timeZone: options.timeZone } : {}),
        }).format(date)} `
      : ''
    const time = options.hour || options.minute || options.second
      ? new Intl.DateTimeFormat('ro-RO', {
          ...(options.hour ? { hour: options.hour } : {}),
          ...(options.minute ? { minute: options.minute } : {}),
          ...(options.second ? { second: options.second } : {}),
          ...(options.hour12 === undefined ? {} : { hour12: options.hour12 }),
          ...(options.hourCycle ? { hourCycle: options.hourCycle } : {}),
          ...(options.timeZone ? { timeZone: options.timeZone } : {}),
        }).format(date)
      : ''
    return `${weekday}${numericDate}${time ? `, ${time}` : ''}`
  }

  return new Intl.DateTimeFormat('ro-RO', options).format(date)
}
