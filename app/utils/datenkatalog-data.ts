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

const PHASE_DEFINITIONS = [
  {
    key: 'kontaktiert',
    field: 'status_kontaktiert',
    title: 'Kontaktiert',
    description: 'Erstkontakt mit Dienststelle',
  },
  {
    key: 'informiert',
    field: 'status_info',
    title: 'Informiert',
    description: 'Über Projekt und Ablauf informiert',
  },
  {
    key: 'kickoff',
    field: 'status_kick_off',
    title: 'Kick-off',
    description: 'Kick-off-Termin durchgeführt',
  },
  {
    key: 'metadaten',
    field: 'status_metadatenerfassung',
    title: 'Metadaten erfasst',
    description: 'Metadaten im Katalog erfasst',
  },
  {
    key: 'review',
    field: 'status_review_und_abnahme',
    title: 'Review / Abnahme',
    description: 'Review und fachliche Abnahme',
  },
  {
    key: 'abgenommen',
    field: 'status_abgeschlossen',
    title: 'Offiziell abgenommen',
    description: 'Formale Abnahme abgeschlossen',
  },
] as const satisfies ReadonlyArray<{
  key: string
  field: keyof DatenkatalogRow
  title: string
  description: string
}>

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
