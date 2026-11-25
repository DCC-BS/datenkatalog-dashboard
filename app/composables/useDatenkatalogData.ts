import { joinURL } from 'ufo'
import { DATASET_ID, type DatenkatalogKpi, type DatenkatalogRow } from '~/utils/datenkatalog-data'

export interface DatenkatalogPayload {
  rows: DatenkatalogRow[]
  kpis: DatenkatalogKpi[]
  dataProcessedDate: string | null
}

/**
 * Loads Datenkatalog data via the server API so the portal API key stays private.
 */
export function useDatenkatalogData() {
  const base = useRuntimeConfig().app.baseURL
  return useAsyncData<DatenkatalogPayload>(
    `datenkatalog-dataset-${DATASET_ID}`,
    () => $fetch<DatenkatalogPayload>(joinURL(base, 'api/datenkatalog')),
  )
}
