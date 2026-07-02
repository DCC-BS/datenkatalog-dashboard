import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  extends: [join(__dirname, 'node_modules/bs-dashboard-base')],

  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  app: {
    baseURL: '/datenkatalog-dashboard/',
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'Datenkatalog Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: '#00838f' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.png' },
        { rel: 'stylesheet', href: '/fonts.css' },
      ],
    },
  },

  runtimeConfig: {
    feedback: {
      repo: 'Feedback_datenkatalog-dashboard',
      repoOwner: 'DDC-BS',
      project: 'datenkatalog-dashboard',
      githubToken: process.env.FEEDBACK_GITHUB_TOKEN || '',
      label: 'feedback',
    },
    public: {
      bsApiKey: process.env.NUXT_PUBLIC_BS_API_KEY || '',
    },
  },
})
