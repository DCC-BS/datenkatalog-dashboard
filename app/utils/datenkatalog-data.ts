export const DATASET_ID = '100542'

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
    title: 'Kick-off',
    description: 'Kick-off-Termin durchgeführt',
    colorClass: 'fill-primary-400',
  },
  {
    key: 'metadaten',
    field: 'status_metadatenerfassung',
    title: 'Metadaten erfasst',
    description: 'Metadaten im Katalog erfasst',
    colorClass: 'fill-primary-500',
  },
  {
    key: 'review',
    field: 'status_review_und_abnahme',
    title: 'Review / Abnahme',
    description: 'Review und fachliche Abnahme',
    colorClass: 'fill-primary-700',
  },
  {
    key: 'abgenommen',
    field: 'status_abgeschlossen',
    title: 'Offiziell abgenommen',
    description: 'Formale Abnahme abgeschlossen',
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
}

export interface TimelineSegment {
  key: string
  title: string
  colorClass: string
  start: Date
  end: Date
}

export interface TimelineRow {
  posten: string
  departmentAbbreviation: string
  label: string
  sortDate: string
  segments: TimelineSegment[]
  milestones: TimelineMilestone[]
}

function isActiveRow(
  row: DatenkatalogRow,
): row is DatenkatalogRow & { status_kontaktiert: string } {
  return hasPhaseValue(row.status_kontaktiert) && !hasPhaseValue(row.status_abgeschlossen)
}

/**
 * Builds one timeline row per active Dienststelle (contacted, not yet officially
 * abgenommen). Each reached phase becomes a colored segment running from its own
 * milestone date to the next reached milestone's date, or to today for the
 * current (last reached) phase.
 */
export function buildTimelineRows(rows: DatenkatalogRow[]): TimelineRow[] {
  const today = new Date()

  const timelineRows = rows.filter(isActiveRow).map((row) => {
    const reachedPhases = PHASE_DEFINITIONS.filter((phase) => hasPhaseValue(row[phase.field]))

    const milestones: TimelineMilestone[] = reachedPhases.map((phase) => ({
      key: phase.key,
      title: phase.title,
      date: row[phase.field] as string,
    }))

    const segments: TimelineSegment[] = reachedPhases.map((phase, index) => {
      const next = reachedPhases[index + 1]
      return {
        key: phase.key,
        title: phase.title,
        colorClass: phase.colorClass,
        start: new Date(row[phase.field] as string),
        end: next ? new Date(row[next.field] as string) : today,
      }
    })

    const abbreviation = getDepartmentAbbreviation(row.departement)

    return {
      posten: row.posten,
      departmentAbbreviation: abbreviation,
      label: `${abbreviation} - ${row.posten}`,
      sortDate: row.status_kick_off ?? row.status_kontaktiert,
      segments,
      milestones,
    }
  })

  return timelineRows.sort(
    (a, b) => a.sortDate.localeCompare(b.sortDate) || a.posten.localeCompare(b.posten),
  )
}
