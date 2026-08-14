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
  },
  {
    key: 'informiert',
    field: 'status_info',
    title: 'Informiert',
    description: 'Über Projekt und Ablauf informiert',
    colorClass: 'fill-primary-300',
  },
  {
    key: 'kickoff',
    field: 'status_kick_off',
    title: 'Kick-Off',
    description: 'Kick-Off-Termin durchgeführt',
    colorClass: 'fill-primary-400',
  },
  {
    key: 'metadaten',
    field: 'status_metadatenerfassung',
    title: 'Beginn Metadatenerfassung',
    description: 'Start der Metadatenerfassung im Katalog',
    colorClass: 'fill-primary-500',
  },
  {
    key: 'review',
    field: 'status_review_und_abnahme',
    title: 'Review',
    description: 'Fachliche Prüfung der erfassten Metadaten',
    colorClass: 'fill-primary-700',
  },
  {
    key: 'abgenommen',
    field: 'status_abgeschlossen',
    title: 'Abnahme',
    description: 'Formeller Abschluss der Umsetzung',
    colorClass: 'fill-primary-900',
  },
] as const satisfies ReadonlyArray<{
  key: string
  field: keyof DatenkatalogRow
  title: string
  description: string
  colorClass: string
}>

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

export function buildKpisFromRows(rows: DatenkatalogRow[]): DatenkatalogKpi[] {
  return PHASE_DEFINITIONS.map((phase) => ({
    key: phase.key,
    title: phase.title,
    description: phase.description,
    count: rows.filter((row) => hasPhaseValue(row[phase.field])).length,
  }))
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
  currentPhaseTitle: string
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
 * Returns the label shown as the current status for a Dienststelle. While
 * Metadatenerfassung has started but Review hasn't been reached yet, the
 * milestone title ("Beginn Metadatenerfassung") is replaced by the active
 * process name ("Metadatenerfassung").
 */
function getCurrentPhaseTitle(lastPhaseKey: string): string {
  if (lastPhaseKey === 'metadaten') {
    return 'Metadatenerfassung'
  }
  return PHASE_DEFINITIONS.find((phase) => phase.key === lastPhaseKey)!.title
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

    return {
      posten: row.posten,
      departmentAbbreviation: abbreviation,
      label: `${abbreviation} - ${row.posten}`,
      phaseRank,
      sortDate: row.status_kick_off ?? getSortDate(row),
      currentPhaseTitle: getCurrentPhaseTitle(PHASE_DEFINITIONS[phaseRank].key),
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
