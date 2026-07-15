const BASE_URL = 'https://data.bs.ch/api/explore/v2.1/catalog/datasets'

async function fetchLocalDataset(
  odsId: string,
  requestFetch: ReturnType<typeof useRequestFetch>,
): Promise<unknown[] | null> {
  if (import.meta.server) {
    try {
      const { readFile } = await import('node:fs/promises')
      const { join } = await import('node:path')
      const filePath = join(process.cwd(), 'public', 'data', `${odsId}.json`)
      const raw = await readFile(filePath, 'utf8')
      const data = JSON.parse(raw) as unknown
      return Array.isArray(data) ? data : null
    } catch {
      return null
    }
  }

  try {
    const localData = await requestFetch<unknown[]>(`/data/${odsId}.json`)
    return Array.isArray(localData) ? localData : null
  } catch {
    return null
  }
}

/**
 * Fetches ODS JSON export for a dataset using the Basel-Stadt data portal API.
 */
export function useBsApi() {
  const config = useRuntimeConfig()
  const requestFetch = useRequestFetch()

  const fetchDataset = async (odsId: string) => {
    const localPath = `/data/${odsId}.json`

    const localData = await fetchLocalDataset(odsId, requestFetch)
    if (localData) {
      return localData
    }

    const key = config.public.bsApiKey as string
    if (!key?.trim()) {
      throw new Error(`Missing local ${localPath} and no NUXT_PUBLIC_BS_API_KEY.`)
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
