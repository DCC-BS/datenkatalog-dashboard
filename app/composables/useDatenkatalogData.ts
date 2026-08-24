import {
  buildKpisFromRows,
  DATASET_ID,
  extractDataProcessedDate,
  normalizeDatenkatalogRows,
  type DatenkatalogKpi,
  type DatenkatalogRow,
} from '~/utils/datenkatalog-data'

const CATALOG_BASE_URL = 'https://data.bs.ch/api/explore/v2.1/catalog/datasets'

export interface DatenkatalogPayload {
  rows: DatenkatalogRow[]
  kpis: DatenkatalogKpi[]
  total: number
  dataProcessedDate: string | null
}

/**
 * Fetches the dataset's catalog metadata to read `metas.default.data_processed`
 * (the "Datenstand"). Reuses the same API key as `fetchDataset`; returns null
 * on any failure instead of breaking the dashboard.
 */
async function fetchDataProcessedDate(): Promise<string | null> {
  const config = useRuntimeConfig()
  const requestFetch = useRequestFetch()
  const key = String(config.public.bsApiKey || config.bsApiKey || '').trim()
  if (!key) {
    return null
  }
  try {
    const response = await requestFetch<unknown>(`${CATALOG_BASE_URL}/${DATASET_ID}`, {
      headers: { Authorization: `Apikey ${key}` },
    })
    return extractDataProcessedDate(response)
  }
  catch {
    return null
  }
}

export function useDatenkatalogData() {
  const { fetchDataset } = useBsApi()

  return useAsyncData<DatenkatalogPayload>(
    `datenkatalog-dataset-${DATASET_ID}`,
    async () => {
      const [raw, dataProcessedDate] = await Promise.all([
        fetchDataset(DATASET_ID),
        fetchDataProcessedDate(),
      ])
      const rows = normalizeDatenkatalogRows(raw)
      return {
        rows,
        kpis: buildKpisFromRows(rows),
        total: rows.length,
        dataProcessedDate,
      }
    },
  )
}
