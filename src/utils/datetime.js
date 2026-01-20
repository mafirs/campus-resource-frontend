const SHANGHAI_TZ = 'Asia/Shanghai'
const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:\d{2})$/i

// 兼容 Python isoformat 可能带微秒：.123456 -> .123
const trimToMs = (s) => s.replace(/(\.\d{3})\d+/, '$1')

export function normalizeIsoToShanghaiOffset(input) {
  if (input == null) return null
  let s = String(input).trim()
  if (!s) return null

  // 兼容 "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T')
  s = trimToMs(s)

  // 已带时区：Z / +00:00 / +08:00 直接返回
  if (TZ_SUFFIX_RE.test(s)) return s

  // 仅日期：按“上海 00:00:00”理解
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00+08:00`

  // 无时区的日期时间：按“上海本地时间语义”补 +08:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = `${s}:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/.test(s)) return `${s}+08:00`

  return s
}

export function parseShanghaiDate(input) {
  const s = normalizeIsoToShanghaiOffset(input)
  if (!s) return null
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d : null
}

export function toShanghaiMs(input) {
  const d = parseShanghaiDate(input)
  return d ? d.getTime() : null
}

export function formatShanghaiDateTime(input) {
  const d = parseShanghaiDate(input)
  if (!d) return '-'
  return d.toLocaleString('zh-CN', { timeZone: SHANGHAI_TZ, hour12: false })
}

// 输出 YYYY-MM-DD（用于日历按天匹配）
export function formatShanghaiDateKey(input) {
  const d = parseShanghaiDate(input)
  if (!d) return ''
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d)
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const da = parts.find(p => p.type === 'day')?.value
  return y && m && da ? `${y}-${m}-${da}` : ''
}

// 输出上海时区 ISO（秒级，固定 +08:00）
export function toShanghaiIsoString(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (!Number.isFinite(d.getTime())) return ''

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(d)

  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const da = parts.find(p => p.type === 'day')?.value
  const h = parts.find(p => p.type === 'hour')?.value
  const mi = parts.find(p => p.type === 'minute')?.value
  const s = parts.find(p => p.type === 'second')?.value

  return y && m && da && h && mi && s ? `${y}-${m}-${da}T${h}:${mi}:${s}+08:00` : ''
}

