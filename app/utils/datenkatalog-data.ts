export const DATASET_ID = '100537'

export interface DatenkatalogRow {
  departement: string
  posten: string
  status_kontaktiert: string | null
  status_info: string | null
  status_kick_off: string | null
  status_metadatenerfassung: string | null
  status_review_und_abnahme: string | null
  status_abgeschlossen: string | null
}

export interface DatenkatalogKpi {
  key: string
  title: string
  description: string
  count: number
}

export const PHASE_DEFINITIONS = [
  {
    key: 'kontaktiert',
    field: 'status_kontaktiert',
    title: 'Kontaktiert',
    description: 'Erstkontakt mit Dienststelle',
    colorClass: 'fill-primary-200',
    legendSwatchClass: 'bg-primary-200',
    laneFillClass: 'fill-primary-50',
    chipClass: 'bg-primary-100 text-primary-800',
    detailContent:
      '<p>In der Kontaktphase wird die zuständige Dienststelle erstmalig angesprochen. Ziel ist es, die richtigen Ansprechpersonen zu identifizieren und den weiteren Ablauf abzustimmen.</p>',
  },
  {
    key: 'informiert',
    field: 'status_info',
    title: 'Informiert',
    description: 'Über Projekt und Ablauf informiert',
    colorClass: 'fill-primary-300',
    legendSwatchClass: 'bg-primary-300',
    laneFillClass: 'fill-primary-50',
    chipClass: 'bg-primary-100 text-primary-800',
    detailContent:
      '<p>Die Dienststelle wird über Ziele, Nutzen und Ablauf des Datenkatalogs informiert. Dazu gehören Zeitplan, Erwartungen an die Metadatenerfassung sowie unterstützende Materialien.</p>',
  },
  {
    key: 'kickoff',
    field: 'status_kick_off',
    title: 'Kick-Off',
    description: 'Kick-Off-Termin durchgeführt',
    colorClass: 'fill-primary-500',
    legendSwatchClass: 'bg-primary-500',
    laneFillClass: 'fill-primary-50',
    chipClass: 'bg-primary-100 text-primary-800',
    detailContent:
      '<p>Im Kick-off-Termin starten Dienststelle und Projektteam die gemeinsame Umsetzung. Rollen, Verantwortlichkeiten und die nächsten Schritte werden festgelegt.</p>',
  },
  {
    key: 'metadaten',
    field: 'status_metadatenerfassung',
    title: 'Beginn Metadatenerfassung',
    description: 'Start der Metadatenerfassung im Katalog',
    colorClass: 'fill-primary-600',
    legendSwatchClass: 'bg-primary-600',
    laneFillClass: 'fill-primary-50',
    chipClass: 'bg-primary-100 text-primary-800',
    detailContent:
      '<p>Die Dienststelle erfasst die relevanten Metadaten im Kantons-Datenkatalog. Dazu zählen Beschreibungen der Datensätze, Verantwortlichkeiten, Aktualisierungszyklen und ggf. Veröffentlichungsstatus.</p>',
  },
  {
    key: 'review',
    field: 'status_review_und_abnahme',
    title: 'Review',
    description: 'Fachliche Prüfung der erfassten Metadaten',
    colorClass: 'fill-yellow-600',
    legendSwatchClass: 'bg-yellow-600',
    laneFillClass: 'fill-yellow-50',
    chipClass: 'bg-yellow-100 text-yellow-800',
    detailContent:
      '<p>Die erfassten Metadaten werden fachlich geprüft. Feedback wird eingearbeitet, bis die Dienststelle die Inhalte inhaltlich abgenommen hat.</p>',
  },
  {
    key: 'abgenommen',
    field: 'status_abgeschlossen',
    title: 'Abnahme',
    description: 'Formeller Abschluss der Umsetzung',
    colorClass: 'fill-purple-600',
    legendSwatchClass: 'bg-purple-600',
    laneFillClass: 'fill-purple-50',
    chipClass: 'bg-purple-100 text-purple-800',
    detailContent:
      '<p>Mit der offiziellen Abnahme ist die Umsetzung für die Dienststelle formell abgeschlossen. Die Metadaten gelten als freigegeben und werden im Datenkatalog entsprechend geführt.</p>',
  },
] as const satisfies ReadonlyArray<{
  key: string
  field: keyof DatenkatalogRow
  title: string
  description: string
  colorClass: string
  legendSwatchClass: string
  laneFillClass: string
  chipClass: string
  detailContent: string
}>

export interface PhaseInfoItem {
  title: string
  content: string
}

export const PHASE_INFO_ITEMS: PhaseInfoItem[] = PHASE_DEFINITIONS.map((phase) => ({
  title: `Phase: ${phase.title}`,
  content: phase.detailContent,
}))

const DEPARTMENT_ABBREVIATIONS: Record<string, string> = {
  'Präsidialdepartement': 'PD',
  'Erziehungsdepartement': 'ED',
  'Gesundheitsdepartement': 'GD',
  'Bau- und Verkehrsdepartement': 'BVD',
  'Finanzdepartement': 'FD',
  'Justiz- und Sicherheitsdepartement': 'JSD',
  'Departement für Wirtschaft, Soziales und Umwelt': 'WSU',
}

export function getDepartmentAbbreviation(departement: string): string {
  const abbreviation = DEPARTMENT_ABBREVIATIONS[departement]
  if (!abbreviation) {
    throw new Error(`No abbreviation defined for department "${departement}".`)
  }
  return abbreviation
}

function isDatenkatalogRow(value: unknown): value is DatenkatalogRow {
  if (!value || typeof value !== 'object') {
    return false
  }
  const row = value as Record<string, unknown>
  return typeof row.departement === 'string' && typeof row.posten === 'string'
}

function hasPhaseValue(value: string | null | undefined): boolean {
  return value != null && String(value).trim() !== ''
}

export function normalizeDatenkatalogRows(data: unknown): DatenkatalogRow[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.filter(isDatenkatalogRow)
}

/**
 * Reads `metas.default.data_processed` from an ODS catalog dataset response
 * (e.g. `GET /catalog/datasets/{id}`). Returns the raw ISO datetime string, or
 * null if the field is missing or the response has an unexpected shape.
 */
export function extractDataProcessedDate(catalogResponse: unknown): string | null {
  if (!catalogResponse || typeof catalogResponse !== 'object') {
    return null
  }
  const metas = (catalogResponse as Record<string, unknown>).metas
  if (!metas || typeof metas !== 'object') {
    return null
  }
  const defaultMetas = (metas as Record<string, unknown>).default
  if (!defaultMetas || typeof defaultMetas !== 'object') {
    return null
  }
  const dataProcessed = (defaultMetas as Record<string, unknown>).data_processed
  return typeof dataProcessed === 'string' && dataProcessed.trim() !== '' ? dataProcessed : null
}

/**
 * Formats an ISO datetime string's date part (YYYY-MM-DD prefix) as
 * DD.MM.YYYY, without applying any timezone conversion.
 */
export function formatDatenstand(isoDateTime: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDateTime)
  if (!match) {
    return null
  }
  const [, year, month, day] = match
  return `${day}.${month}.${year}`
}

export function buildKpisFromRows(rows: DatenkatalogRow[]): DatenkatalogKpi[] {
  return PHASE_DEFINITIONS.map((phase) => ({
    key: phase.key,
    title: phase.title,
    description: phase.description,
    count: rows.filter((row) => hasPhaseValue(row[phase.field])).length,
  }))
}

export const TIMELINE_START_DATE = '2025-12-01'

/**
 * Clamps a date to TIMELINE_START_DATE so early milestones/connectors are
 * visually pinned to the timeline's start instead of stretching it back.
 */
export function clampToTimelineStart(date: string | Date): Date {
  const parsed = new Date(date)
  const start = new Date(TIMELINE_START_DATE)
  return parsed.getTime() < start.getTime() ? start : parsed
}

export interface TimelineMilestone {
  key: string
  title: string
  date: string
  colorClass: string
}

export interface TimelineConnectorLine {
  start: string
  end: string
}

export interface TimelineRow {
  posten: string
  departmentAbbreviation: string
  label: string
  phaseRank: number
  sortDate: string
  currentPhaseKey: string
  currentPhaseTitle: string
  currentPhaseLaneFillClass: string
  currentPhaseChipClass: string
  milestones: TimelineMilestone[]
  connectorLine: TimelineConnectorLine | null
}

function isTimelineRow(row: DatenkatalogRow): boolean {
  return PHASE_DEFINITIONS.some((phase) => hasPhaseValue(row[phase.field]))
}

function getSortDate(row: DatenkatalogRow): string {
  for (const phase of PHASE_DEFINITIONS) {
    const value = row[phase.field]
    if (hasPhaseValue(value)) {
      return value as string
    }
  }
  return ''
}

/**
 * Returns the phase definition for the current status shown for a Dienststelle.
 */
function getCurrentPhase(lastPhaseKey: string) {
  return PHASE_DEFINITIONS.find((phase) => phase.key === lastPhaseKey)!
}

/**
 * Dashed connector from the first reached phase after Kontaktiert through to
 * Abnahme (or today if Abnahme has not been reached).
 */
function buildConnectorLine(
  row: DatenkatalogRow,
  today: Date,
): TimelineConnectorLine | null {
  const startPhase = PHASE_DEFINITIONS
    .filter((phase) => phase.key !== 'kontaktiert')
    .find((phase) => hasPhaseValue(row[phase.field]))
  if (!startPhase) {
    return null
  }
  const end = hasPhaseValue(row.status_abgeschlossen)
    ? (row.status_abgeschlossen as string)
    : today.toISOString().slice(0, 10)
  return { start: row[startPhase.field] as string, end }
}

/**
 * Builds one timeline row per Dienststelle with at least one phase date. Each
 * reached phase becomes a colored milestone. A dashed connector runs from the
 * first phase after Kontaktiert to Abnahme (or today if Abnahme is missing).
 */
export function buildTimelineRows(rows: DatenkatalogRow[]): TimelineRow[] {
  const today = new Date()

  const timelineRows = rows.filter(isTimelineRow).map((row) => {
    const reachedPhases = PHASE_DEFINITIONS.filter((phase) => hasPhaseValue(row[phase.field]))
    const phaseRank = PHASE_DEFINITIONS.findLastIndex((phase) => hasPhaseValue(row[phase.field]))

    const milestones: TimelineMilestone[] = reachedPhases.map((phase) => ({
      key: phase.key,
      title: phase.title,
      date: row[phase.field] as string,
      colorClass: phase.colorClass,
    }))

    const connectorLine = buildConnectorLine(row, today)

    const abbreviation = getDepartmentAbbreviation(row.departement)

    const currentPhaseKey = PHASE_DEFINITIONS[phaseRank].key
    const currentPhase = getCurrentPhase(currentPhaseKey)

    return {
      posten: row.posten,
      departmentAbbreviation: abbreviation,
      label: `${abbreviation} - ${row.posten}`,
      phaseRank,
      sortDate: row.status_kick_off ?? getSortDate(row),
      currentPhaseKey,
      currentPhaseTitle: currentPhase.title,
      currentPhaseLaneFillClass: currentPhase.laneFillClass,
      currentPhaseChipClass: currentPhase.chipClass,
      milestones,
      connectorLine,
    }
  })

  return timelineRows.sort(
    (a, b) =>
      b.phaseRank - a.phaseRank
      || a.sortDate.localeCompare(b.sortDate)
      || a.posten.localeCompare(b.posten),
  )
}
