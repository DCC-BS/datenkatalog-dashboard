<script setup lang="ts">
import {
  buildTimelineRows,
  formatDatenstand,
  STEP_DEFINITIONS,
} from '~/utils/datenkatalog-data'
import IconSymbolCircleWarning from '@kanton-basel-stadt/designsystem/icons/symbol/circle-warning'

useHead({
  title: 'Datenkatalog – Umsetzungsstand | Kanton Basel-Stadt',
})

const { data, pending, error } = await useDatenkatalogData()

const timelineRows = computed(() => buildTimelineRows(data.value?.rows ?? []))
const datenstand = computed(() => {
  const isoDate = data.value?.dataProcessedDate
  return isoDate ? formatDatenstand(isoDate) : null
})

/** null = show all; otherwise filter by selected current step */
const selectedStepKey = ref<string | null>(null)

/** null = show all; otherwise filter by department abbreviation (PD, ED, …) */
const selectedDepartmentAbbreviation = ref<string | null>(null)

function selectStepFilter(stepKey: string | null) {
  selectedStepKey.value = stepKey
}

function selectDepartmentFilter(abbreviation: string | null) {
  selectedDepartmentAbbreviation.value = abbreviation
}

const stepDetailByKey = Object.fromEntries(
  STEP_DEFINITIONS.map((step) => [step.key, step.detailContent]),
)

const filteredTimelineRows = computed(() => {
  const stepKey = selectedStepKey.value
  let rows = timelineRows.value
  if (stepKey) {
    rows = rows.filter((row) => row.currentStepKey === stepKey)
  }
  const departmentAbbreviation = selectedDepartmentAbbreviation.value
  if (departmentAbbreviation) {
    rows = rows.filter((row) => row.departmentAbbreviation === departmentAbbreviation)
  }
  return rows
})
</script>

<template>
  <div class="space-y-30">
    <h1 class="header-title text-primary-600 hyphens-auto text-balance">
      Wo steht der Kanton beim Aufbau des Datenkatalogs?
    </h1>
    <p class="lead mt-30 hyphens-auto lg:hyphens-none text-pretty">
      Der Kanton Basel-Stadt baut seinen
      <a
        class="link"
        href="https://datenkatalog.bs.ch"
        target="_blank"
        rel="noopener noreferrer"
      >kantonalen Datenkatalog</a>
      schrittweise auf.
      Dieser schafft einen zentralen Überblick über die Datenbestände des Kantons und macht
      deren Inhalte und Eigenschaften besser auffindbar.
    </p>

    <div class="my-20 lg:mb-30 xl:pr-220">
      <div class="ck-content hyphens-auto lg:hyphens-none">
        <p>
          Dieses Dashboard zeigt transparent, wie weit die Metadatenerfassung der kantonalen Datenbestände
          fortgeschritten ist und welche Dienststellen bereits am Rollout beteiligt sind. Die Darstellung wird
          laufend ergänzt, sobald weitere Dienststellen in den Aufbau des Datenkatalogs einbezogen werden.
          Weitere Informationen zum Datenkatalog finden Sie
          <a href="https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog" target="_blank" rel="noopener noreferrer">hier</a>.
        </p>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Umsetzungsschritte
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Die folgenden Kennzahlen zeigen, wie viele Dienststellen die einzelnen Schritte beim Aufbau
            des Datenkatalogs bereits erreicht haben. Die Schritte bauen aufeinander auf und werden
            deshalb kumulativ dargestellt. Weitere Informationen erhalten Sie über das
            <span class="inline-flex items-center align-text-bottom mx-2" role="img" aria-label="i">
              <IconSymbolCircleWarning
                class="w-20 h-20 text-primary-600 transform rotate-180"
                aria-hidden="true"
              />
            </span>-Icon des jeweiligen Schritts.
          </p>
        </div>
      </div>

      <div
        v-if="pending"
        class="text-primary-600"
      >
        Daten werden geladen …
      </div>
      <div
        v-else-if="error"
        class="text-red-700"
      >
        Daten konnten nicht geladen werden. Bitte API-Schlüssel und Portalzugriff prüfen.
      </div>
      <div
        v-else
        class="grid grid-cols-2 lg:grid-cols-3 gap-20"
      >
        <div
          v-for="kpi in (data?.kpis ?? [])"
          :key="kpi.key"
          class="relative"
        >
          <KPICard
            :title="kpi.title"
            :description="kpi.description"
            :value="kpi.count"
          />
          <div class="absolute top-10 right-10">
            <IconHoverBox
              :title="kpi.title"
              :aria-label="`Definition: ${kpi.title}`"
            >
              <template #body>
                <div v-html="stepDetailByKey[kpi.key]" />
              </template>
            </IconHoverBox>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Entwicklung über die Zeit
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Der Zeitstrahl zeigt, wann die einzelnen Dienststellen die verschiedenen Schritte beim Aufbau
            des Datenkatalogs erreicht haben.<br>
            Die Darstellung beginnt im Dezember 2025 und wird laufend aktualisiert. Über die Filter können
            Sie die Dienststellen nach ihrem aktuellen Stand anzeigen.<br>
            Der zeitliche Verlauf dient dabei vor allem als Einblick in den schrittweisen Aufbau des
            Datenkatalogs.
          </p>
        </div>
      </div>

      <div
        v-if="pending"
        class="text-primary-600"
      >
        Daten werden geladen …
      </div>
      <div
        v-else-if="error"
        class="text-red-700"
      >
        Daten konnten nicht geladen werden. Bitte API-Schlüssel und Portalzugriff prüfen.
      </div>
      <DienststellenTimeline
        v-else
        :rows="filteredTimelineRows"
        :selected-step-key="selectedStepKey"
        :selected-department-abbreviation="selectedDepartmentAbbreviation"
        :datenstand="datenstand"
        @select-step="selectStepFilter"
        @select-department="selectDepartmentFilter"
      />

      <div class="my-20 lg:mb-30 xl:pr-220">
        <h3
          class="h3 mb-20 lg:mb-30 scroll-mt-10 xl:pr-140"
        >
          Einordnung (des Umsetzungsstands)
        </h3>
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Der dargestellte Stand entspricht dem zuletzt dokumentierten Schritt jeder Dienststelle.
            Die Dauer zwischen den einzelnen Schritten kann je nach organisatorischen Rahmenbedingungen
            und Umfang der zu erfassenden Datenbestände unterschiedlich ausfallen. Ein direkter zeitlicher
            Vergleich zwischen den Dienststellen ist deshalb nicht möglich.
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Ihre Dienststelle ist noch nicht dabei?
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Der Datenkatalog lebt von der Beteiligung der Dienststellen.
          </p>
          <p>
            Möchten Sie den Aufbau des Datenkatalogs in Ihrer Dienststelle starten? Das DCC Data
            Competence Center unterstützt Sie bei der Ersterfassung und klärt gemeinsam mit Ihnen,
            welche Datenbestände sinnvoll aufgenommen werden und wie die Erfassung effizient und
            ressourcenschonend erfolgen kann.
          </p>
          <p>
            Nehmen Sie gerne per E-Mail oder telefonisch Kontakt mit uns auf.
          </p>
        </div>
      </div>
      <Contact
        name="Josephine Smith"
        description="wissenschaftliche Mitarbeiterin, Data Competence Center"
        phone="+41 61 267 87 25"
        email="dcc@bs.ch"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.kpi-card__intro) {
  padding-right: 28px;
}
</style>
