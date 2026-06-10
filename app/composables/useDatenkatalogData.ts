import {
  buildKpisFromRows,
  DATASET_ID,
  normalizeDatenkatalogRows,
  type DatenkatalogKpi,
  type DatenkatalogRow,
} from '~/utils/datenkatalog-data'

export interface DatenkatalogPayload {
  rows: DatenkatalogRow[]
  kpis: DatenkatalogKpi[]
  total: number
}

export function useDatenkatalogData() {
  const { fetchDataset } = useBsApi()

  return useAsyncData<DatenkatalogPayload>(
    `datenkatalog-dataset-${DATASET_ID}`,
    async () => {
      const raw = await fetchDataset(DATASET_ID)
      const rows = normalizeDatenkatalogRows(raw)
      return {
        rows,
        kpis: buildKpisFromRows(rows),
        total: rows.length,
      }
    },
  )
}
