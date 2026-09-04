<script setup lang="ts">
import {
  buildKpisFromRows,
  buildTimelineRows,
  formatDatenstand,
  STEP_DEFINITIONS,
  type StepCountMode,
} from '~/utils/datenkatalog-data'

useHead({
  title: 'Datenkatalog – Umsetzungsstand | Kanton Basel-Stadt',
})

const { data, pending, error } = await useDatenkatalogData()

const stepCountMode = ref<StepCountMode>('cumulative')

const stepCountModeItems = [
  { value: 'cumulative' as const, label: 'Kumulativ' },
  { value: 'current' as const, label: 'Aktuell' },
]

const kpis = computed(() =>
  buildKpisFromRows(data.value?.rows ?? [], stepCountMode.value),
)
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
      Datenkatalog – Umsetzungsstand
    </h1>
    <p class="lead mt-30 hyphens-auto lg:hyphens-none text-pretty">
      Fortschritt bei der Einführung des Kantonalen Datenkatalogs pro Dienststelle – von
      «Kontaktiert» bis «Abnahme».
    </p>

    <div class="my-20 lg:mb-30 xl:pr-220">
      <div class="ck-content hyphens-auto lg:hyphens-none">
        <p>
          Dieses Dashboard gibt einen Überblick über den Rollout des Datenkatalogs
          im Kanton Basel-Stadt.
          Es zeigt damit, wie die Metadatenerfassung der kantonalen Datenbestände voranschreitet.
        </p>
        <p>
          Im Dashboard erscheinen nur Dienststellen, mit denen bereits Kontakt zur Umsetzung aufgenommen wurde – entweder
          durch das DCC Data Competence Center oder auf Initiative der Dienststelle.
          Nicht aufgeführte Dienststellen stehen bislang noch nicht im Austausch mit dem DCC Data Competence Center.
        </p>
        <p>
          Für jede Dienststelle wird sichtbar, welchen Schritt der Umsetzung sie zuletzt
          erreicht hat: «Kontaktiert», «Informiert», «Kick-Off», «Beginn Metadatenerfassung», «Review» und «Abnahme».
          Weitere Informationen über den
          <a href="https://datenkatalog.bs.ch" target="_blank" rel="noopener noreferrer">Kantonalen Datenkatalog</a>
          finden Sie
          <a href="https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog" target="_blank" rel="noopener noreferrer">hier</a>.
        </p>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Umsetzungsstand nach Schritt
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Die folgenden Kennzahlen zeigen, wie viele Dienststellen den jeweiligen Schritt bereits
            erreicht haben – kumulativ oder nur beim aktuellen Schritt.
            Eine Erklärung für den jeweiligen Schritt wird beim Überfahren
            bzw. Antippen des Informations-Icons angezeigt.
          </p>
        </div>
      </div>

      <div
        class="step-count-mode flex flex-wrap items-center gap-5 mb-20"
        role="group"
        aria-label="Zählweise der Kennzahlen"
      >
        <button
          v-for="item in stepCountModeItems"
          :key="item.value"
          type="button"
          class="step-count-mode__item text-xs"
          :class="{ 'step-count-mode__item--selected': stepCountMode === item.value }"
          :aria-pressed="stepCountMode === item.value"
          @click="stepCountMode = item.value"
        >
          {{ item.label }}
        </button>
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
          v-for="kpi in kpis"
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
        Zeitstrahl je Dienststelle
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Übersicht der erreichten Termine je begleitete Dienststelle und Schritt, ab
            Dezember 2025 bis heute. Durch Klicken auf einen Schritt in der Legende werden
            die Dienststellen nach ihrem aktuellen Schritt gefiltert.
            Für weiterführende Erklärungen bitte den Abschnitt
            <a href="#anmerkungen">«Anmerkungen»</a> konsultieren.
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
          id="anmerkungen"
          class="h3 mb-20 lg:mb-30 scroll-mt-10 xl:pr-140"
        >
          Anmerkungen
        </h3>
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Der Zeitstrahl zeigt die erreichten Schritte einer Dienststelle als Termine; der Status rechts markiert den zuletzt erreichten Schritt.
            Endet die Darstellung vor dem Schritt «Abnahme», lässt sich daraus nicht unmittelbar auf
            den aktuellen Bearbeitungsstand oder eine Verzögerung schliessen.
            Der Rollout erfolgt in Abstimmung mit den Dienststellen und orientiert sich an den jeweiligen zeitlichen
            und organisatorischen Rahmenbedingungen.
          </p>
          <p>
            Auch der Umfang der zu erfassenden Metadaten kann sich zwischen den Dienststellen
            erheblich unterscheiden. Zwischen den
            einzelnen Schritten können Phasen daher unterschiedlich lange dauern. Der dargestellte Stand
            bildet jeweils den letzten dokumentierten Schritt im gemeinsamen Rollout-Prozess ab.
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Interesse am Rollout?
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Möchten Sie den Rollout Ihrer Dienststelle starten? Melden Sie sich einfach
            per E-Mail oder telefonisch bei uns. Das DCC Data Competence Center begleitet Sie eng bei der
            Ersterfassung und klärt gemeinsam mit Ihnen, welche Datenbestände sinnvoll im Datenkatalog
            erfasst werden und wie die Erfassung möglichst ressourcenschonend gestaltet werden kann.
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

.step-count-mode__item {
  background: white;
  border: 1px solid var(--color-gray-300, #d1d5db);
  border-radius: 0.25rem;
  padding: 0.15rem 0.5rem;
  color: var(--color-primary-700, #006874);
  cursor: pointer;
}

.step-count-mode__item:hover {
  border-color: var(--color-primary-600, #00838f);
  background: color-mix(in srgb, var(--color-primary-600, #00838f) 8%, white);
}

.step-count-mode__item--selected {
  border-color: var(--color-primary-600, #00838f);
  background: color-mix(in srgb, var(--color-primary-600, #00838f) 8%, white);
}
</style>
