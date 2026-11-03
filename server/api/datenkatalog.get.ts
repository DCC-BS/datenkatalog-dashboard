import {
  buildKpisFromRows,
  DATASET_ID,
  extractDataProcessedDate,
  normalizeDatenkatalogRows,
} from '../../app/utils/datenkatalog-data'

const CATALOG_BASE_URL = 'https://data.bs.ch/api/explore/v2.1/catalog/datasets'

/**
 * Fetches Datenkatalog rows + catalog metadata on the server so the BS API key
 * never reaches the browser.
 */
export default defineEventHandler(async (event) => {
  const key = resolveBsApiKey(useRuntimeConfig(event))
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_BS_API_KEY is missing',
    })
  }

  const [raw, catalog] = await Promise.all([
    fetchDatasetJson(DATASET_ID, key),
    $fetch<unknown>(`${CATALOG_BASE_URL}/${DATASET_ID}`, {
      headers: { Authorization: `Apikey ${key}` },
    }).catch(() => null),
  ])

  const rows = normalizeDatenkatalogRows(raw)
  return {
    rows,
    kpis: buildKpisFromRows(rows),
    dataProcessedDate: extractDataProcessedDate(catalog),
  }
})
