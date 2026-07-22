const BASE_URL = 'https://data.bs.ch/api/explore/v2.1/catalog/datasets'

/**
 * Fetches ODS JSON export for a dataset using the Basel-Stadt data portal API.
 */
export function useBsApi() {
  const config = useRuntimeConfig()
  const requestFetch = useRequestFetch()

  const fetchDataset = async (odsId: string) => {
    const key = config.public.bsApiKey as string
    if (!key?.trim()) {
      throw new Error('Missing NUXT_PUBLIC_BS_API_KEY.')
    }
    try {
      const response = await requestFetch<unknown[]>(`${BASE_URL}/${odsId}/exports/json`, {
        headers: { Authorization: `Apikey ${key.trim()}` },
      })
      return response
    } catch {
      throw new Error(`Failed to fetch dataset ${odsId} from data portal.`)
    }
  }

  return { fetchDataset }
}
