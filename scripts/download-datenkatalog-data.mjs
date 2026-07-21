import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE_URL = 'https://data.bs.ch/api/explore/v2.1/catalog/datasets'
const DATASET_ID = '100537'

async function main() {
  const apiKey = process.env.NUXT_PUBLIC_BS_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Missing NUXT_PUBLIC_BS_API_KEY. Export it before running this script.')
  }

  const outputDir = join(process.cwd(), 'public', 'data')
  await mkdir(outputDir, { recursive: true })

  const url = `${BASE_URL}/${DATASET_ID}/exports/json`
  const response = await fetch(url, {
    headers: { Authorization: `Apikey ${apiKey}` },
  })

  if (!response.ok) {
    throw new Error(`Failed to download dataset ${DATASET_ID}: HTTP ${response.status}`)
  }

  const payload = await response.json()
  const filePath = join(outputDir, `${DATASET_ID}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Saved ${DATASET_ID}.json`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
