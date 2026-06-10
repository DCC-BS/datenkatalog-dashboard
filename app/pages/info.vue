<script setup lang="ts">
interface AccordionItem {
  title: string
  content: string
}

interface TabItem {
  label: string
  value: string
}

const route = useRoute()
const router = useRouter()

useHead({ title: 'Informationen Datenkatalog Dashboard | Kanton Basel-Stadt' })

const tabs: TabItem[] = [
  { label: 'Definitionen', value: 'definitionen' },
  { label: 'Kontakte', value: 'kontakte' },
]

const activeTab = computed({
  get() {
    return (route.query.tab as string) || 'definitionen'
  },
  set(tab: string) {
    router.push({ path: '/info', query: { tab } })
  },
})

const definitionenItems: AccordionItem[] = [
  {
    title: 'Zweck des Dashboards',
    content:
      '<p>Das Dashboard dient dem Monitoring des Rollouts des Kantons-Datenkatalogs Basel-Stadt. Es macht für jede beteiligte Dienststelle transparent, in welcher Phase sich die Umsetzung befindet und welche Termine geplant oder bereits erfolgt sind.</p>',
  },
  {
    title: 'Phase: Kontakt',
    content:
      '<p>In der Kontaktphase wird die zuständige Dienststelle erstmalig angesprochen. Ziel ist es, die richtigen Ansprechpersonen zu identifizieren und den weiteren Ablauf abzustimmen.</p>',
  },
  {
    title: 'Phase: Information',
    content:
      '<p>Die Dienststelle wird über Ziele, Nutzen und Ablauf des Datenkatalogs informiert. Dazu gehören Zeitplan, Erwartungen an die Metadatenerfassung sowie unterstützende Materialien.</p>',
  },
  {
    title: 'Phase: Kick-off',
    content:
      '<p>Im Kick-off-Termin starten Dienststelle und Projektteam die gemeinsame Umsetzung. Rollen, Verantwortlichkeiten und die nächsten Schritte werden festgelegt.</p>',
  },
  {
    title: 'Phase: Metadatenerfassung',
    content:
      '<p>Die Dienststelle erfasst die relevanten Metadaten im Kantons-Datenkatalog. Dazu zählen Beschreibungen der Datensätze, Verantwortlichkeiten, Aktualisierungszyklen und ggf. Veröffentlichungsstatus.</p>',
  },
  {
    title: 'Phase: Review und Abnahme',
    content:
      '<p>Die erfassten Metadaten werden fachlich geprüft. Feedback wird eingearbeitet, bis die Dienststelle die Inhalte inhaltlich abgenommen hat.</p>',
  },
  {
    title: 'Phase: Offizielle Abnahme',
    content:
      '<p>Mit der offiziellen Abnahme ist die Umsetzung für die Dienststelle formell abgeschlossen. Die Metadaten gelten als freigegeben und werden im Datenkatalog entsprechend geführt.</p>',
  },
]
</script>

<template>
  <div>
    <h1 class="header-title text-primary-600 hyphens-auto text-balance">
      Informationen
    </h1>
    <p class="lead mt-30 hyphens-auto lg:hyphens-none text-pretty">
      Informationen zum Datenkatalog-Dashboard und zum Rollout im Kanton Basel-Stadt
    </p>
    <div class="my-20 lg:mb-30 xl:pr-220">
      <div class="ck-content hyphens-auto lg:hyphens-none">
        <p>
          Hier finden Sie Definitionen der Rollout-Phasen sowie Kontaktangaben des
          Statistischen Amts und des DCC.
        </p>
      </div>
    </div>

    <Tabs :items="tabs" v-model="activeTab">
      <div
        v-if="activeTab === 'definitionen'"
        class="full-bleed bg-primary-100 py-25 lg:py-30 xl:py-40"
      >
        <div class="container">
          <header class="mb-10 lg:mb-20 xl:mb-30">
            <h2 class="hyphens-auto break-words text-primary-600 font-bold text-2xl lg:text-3xl xl:text-4xl">
              Definitionen und Erläuterungen
            </h2>
            <p class="text-primary-600 mt-20 lg:text-lg xl:w-4/6 break-words hyphens-auto">
              Phasen des Datenkatalog-Rollouts von Erstkontakt bis zur offiziellen Abnahme.
            </p>
          </header>
          <Accordion :items="definitionenItems" />
        </div>
      </div>

      <div v-if="activeTab === 'kontakte'">
        <Contact
          name="Josephine Smith"
          description="DCC Data Competence Center"
          phone="+41 61 267 87 25"
          email="dcc@bs.ch"
        />
      </div>
    </Tabs>
  </div>
</template>

<style scoped>
.full-bleed {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}
</style>
