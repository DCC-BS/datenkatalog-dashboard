export const DATASET_ID = '100537'

export interface DatenkatalogRow {
  departement: string
  posten: string
  status_kontaktiert: string | null
  status_info: string | null
  status_kick_off: string | null
  status_metadatenerfassung: string | null
  status_review: string | null
  status_abnahme_freigabe_data_owner: string | null
}

export interface DatenkatalogKpi {
  key: string
  title: string
  description: string
  count: number
}

/** How step KPI counts and the timeline step filter interpret a step. */
export type StepCountMode = 'cumulative' | 'current'

export const STEP_DEFINITIONS = [
  {
    key: 'kontaktiert',
    field: 'status_kontaktiert',
    title: 'Kontaktiert',
    description: 'Erstkontakt mit Dienststelle',
    colorClass: 'fill-gray-500',
    legendSwatchClass: 'bg-gray-500',
    laneFillClass: 'fill-gray-50',
    chipClass: 'bg-gray-100 text-gray-800',
    detailContent:
      '<p>Mit dem Schritt «Kontaktiert» ist die erste Kontaktaufnahme zwischen dem DCC Data Competence Center und der zuständigen Dienststelle erfolgt. Diese kann sowohl durch das DCC Data Competence Center als auch durch die Dienststelle selbst initiiert werden. Ziel ist es, die richtige Ansprechperson zu identifizieren und den weiteren Ablauf gemeinsam abzustimmen.</p>',
  },
  {
    key: 'informiert',
    field: 'status_info',
    title: 'Informiert',
    description: 'Über Projekt und Ablauf informiert',
    colorClass: 'fill-green-300',
    legendSwatchClass: 'bg-green-300',
    laneFillClass: 'fill-green-50',
    chipClass: 'bg-green-100 text-green-800',
    detailContent:
      '<p>Mit dem Schritt «Informiert» ist die Dienststelle über Ziele, Nutzen und Ablauf des Datenkatalogs informiert. Dazu gehören Zeitplan, Erwartungen an die Metadatenerfassung sowie unterstützende Materialien.</p>',
  },
  {
    key: 'kickoff',
    field: 'status_kick_off',
    title: 'Kick-Off',
    description: 'Kick-Off-Termin durchgeführt',
    colorClass: 'fill-green-500',
    legendSwatchClass: 'bg-green-500',
    laneFillClass: 'fill-green-50',
    chipClass: 'bg-green-100 text-green-800',
    detailContent:
      '<p>Mit dem Schritt «Kick-Off» starten Dienststelle und Projektteam die gemeinsame Umsetzung. Rollen, Verantwortlichkeiten und die nächsten Schritte werden festgelegt.</p>',
  },
  {
    key: 'metadaten',
    field: 'status_metadatenerfassung',
    title: 'Beginn Metadatenerfassung',
    description: 'Start der Metadatenerfassung im Katalog',
    colorClass: 'fill-green-700',
    legendSwatchClass: 'bg-green-700',
    laneFillClass: 'fill-green-50',
    chipClass: 'bg-green-100 text-green-800',
    detailContent:
      '<p>Mit dem Schritt «Beginn Metadatenerfassung» startet die Erfassung der relevanten Metadaten im Kantons-Datenkatalog. Dazu zählen Beschreibungen der Datensätze, Verantwortlichkeiten, Aktualisierungszyklen und ggf. Veröffentlichungsstatus. Das DCC Data Competence Center begleitet die Erfassung und steht für die Abstimmung zu Umfang, Auswahl und Beschreibung der Datensätze zur Verfügung.</p>',
  },
  {
    key: 'review',
    field: 'status_review',
    title: 'Review',
    description: 'Fachliche Prüfung der erfassten Metadaten',
    colorClass: 'fill-yellow-600',
    legendSwatchClass: 'bg-yellow-600',
    laneFillClass: 'fill-yellow-50',
    chipClass: 'bg-yellow-100 text-yellow-800',
    detailContent:
      '<p>Mit dem Schritt «Review» werden die erfassten Metadaten fachlich geprüft. Feedback wird eingearbeitet, bis die Dienststelle die Inhalte inhaltlich abgenommen hat.</p>',
  },
  {
    key: 'abgenommen',
    field: 'status_abnahme_freigabe_data_owner',
    title: 'Abnahme',
    description: 'Formeller Abschluss der Umsetzung',
    colorClass: 'fill-purple-600',
    legendSwatchClass: 'bg-purple-600',
    laneFillClass: 'fill-purple-50',
    chipClass: 'bg-purple-100 text-purple-800',
    detailContent:
      '<p>Mit dem Schritt «Abnahme» ist die Umsetzung für die Dienststelle formell abgeschlossen. Die Metadaten gelten als freigegeben und werden im Datenkatalog entsprechend geführt.</p>',
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

function hasStepValue(value: string | null | undefined): boolean {
  return value != null && String(value).trim() !== ''
}

/**
 * Farthest step with a date filled, or null if the row has no step dates.
 * Same rule as timeline `currentStepKey`.
 */
export function getRowCurrentStepKey(row: DatenkatalogRow): string | null {
  const stepRank = STEP_DEFINITIONS.findLastIndex((step) =>
    hasStepValue(row[step.field]),
  )
  if (stepRank < 0) {
    return null
  }
  return STEP_DEFINITIONS[stepRank].key
}

/** True if the row has reached this step or any later one (cumulative). */
export function rowReachedStep(row: DatenkatalogRow, stepKey: string): boolean {
  const stepIndex = STEP_DEFINITIONS.findIndex((step) => step.key === stepKey)
  if (stepIndex < 0) {
    return false
  }
  return STEP_DEFINITIONS.slice(stepIndex).some((laterStep) =>
    hasStepValue(row[laterStep.field]),
  )
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

export function buildKpisFromRows(
  rows: DatenkatalogRow[],
  mode: StepCountMode = 'cumulative',
): DatenkatalogKpi[] {
  return STEP_DEFINITIONS.map((step) => ({
    key: step.key,
    title: step.title,
    description: step.description,
    count: rows.filter((row) =>
      mode === 'current'
        ? getRowCurrentStepKey(row) === step.key
        : rowReachedStep(row, step.key),
    ).length,
  }))
}

/** Local midnight. A date-only ISO string parses as UTC and skips the Dec month tick in CET. */
export const TIMELINE_START_DATE = '2025-12-01T00:00:00'

/** Days past today where out-of-range planned dates are visually pinned. */
export const PLANNED_DATE_OFFSET_DAYS = 3

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Pins dates for chart placement: before TIMELINE_START_DATE → start;
 * after today + PLANNED_DATE_OFFSET_DAYS → that offset (not the chart's
 * today+7 domain end). In-range dates are unchanged.
 */
export function clampToTimelineBounds(date: string | Date, today: Date = new Date()): Date {
  const parsed = new Date(date)
  const start = new Date(TIMELINE_START_DATE)
  if (parsed.getTime() < start.getTime()) {
    return start
  }
  const plannedPin = new Date(today.getTime() + PLANNED_DATE_OFFSET_DAYS * DAY_MS)
  if (parsed.getTime() > plannedPin.getTime()) {
    return plannedPin
  }
  return parsed
}

export interface TimelineStepMarker {
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
  stepRank: number
  sortDate: string
  currentStepKey: string
  currentStepTitle: string
  currentStepLaneFillClass: string
  currentStepChipClass: string
  steps: TimelineStepMarker[]
  connectorLine: TimelineConnectorLine | null
}

function isTimelineRow(row: DatenkatalogRow): boolean {
  return STEP_DEFINITIONS.some((step) => hasStepValue(row[step.field]))
}

function getSortDate(row: DatenkatalogRow): string {
  for (const step of STEP_DEFINITIONS) {
    const value = row[step.field]
    if (hasStepValue(value)) {
      return value as string
    }
  }
  return ''
}

/**
 * Returns the step definition for the current status shown for a Dienststelle.
 */
function getCurrentStep(lastStepKey: string) {
  return STEP_DEFINITIONS.find((step) => step.key === lastStepKey)!
}

/**
 * Dashed connector from the first reached step after Kontaktiert through to
 * Abnahme (or today if Abnahme has not been reached).
 */
function buildConnectorLine(
  row: DatenkatalogRow,
  today: Date,
): TimelineConnectorLine | null {
  const startStep = STEP_DEFINITIONS
    .filter((step) => step.key !== 'kontaktiert')
    .find((step) => hasStepValue(row[step.field]))
  if (!startStep) {
    return null
  }
  const end = hasStepValue(row.status_abnahme_freigabe_data_owner)
    ? (row.status_abnahme_freigabe_data_owner as string)
    : today.toISOString().slice(0, 10)
  return { start: row[startStep.field] as string, end }
}

/**
 * Builds one timeline row per Dienststelle with at least one step date. Each
 * reached step becomes a colored marker. A dashed connector runs from the
 * first step after Kontaktiert to Abnahme (or today if Abnahme is missing).
 */
export function buildTimelineRows(rows: DatenkatalogRow[]): TimelineRow[] {
  const today = new Date()

  const timelineRows = rows.filter(isTimelineRow).map((row) => {
    const reachedSteps = STEP_DEFINITIONS.filter((step) => hasStepValue(row[step.field]))
    const stepRank = STEP_DEFINITIONS.findLastIndex((step) => hasStepValue(row[step.field]))

    const steps: TimelineStepMarker[] = reachedSteps.map((step) => ({
      key: step.key,
      title: step.title,
      date: row[step.field] as string,
      colorClass: step.colorClass,
    }))

    const connectorLine = buildConnectorLine(row, today)

    const abbreviation = getDepartmentAbbreviation(row.departement)

    const currentStepKey = getRowCurrentStepKey(row)!
    const currentStep = getCurrentStep(currentStepKey)

    return {
      posten: row.posten,
      departmentAbbreviation: abbreviation,
      label: `${abbreviation} - ${row.posten}`,
      stepRank,
      sortDate: row.status_kick_off ?? getSortDate(row),
      currentStepKey,
      currentStepTitle: currentStep.title,
      currentStepLaneFillClass: currentStep.laneFillClass,
      currentStepChipClass: currentStep.chipClass,
      steps,
      connectorLine,
    }
  })

  return timelineRows.sort(
    (a, b) =>
      b.stepRank - a.stepRank
      || a.sortDate.localeCompare(b.sortDate)
      || a.posten.localeCompare(b.posten),
  )
}
