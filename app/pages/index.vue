<script setup lang="ts">
import IconSymbolInfoI from '@kanton-basel-stadt/designsystem/icons/symbol/info-i'
import { buildTimelineRows, formatDatenstand, PHASE_DEFINITIONS } from '~/utils/datenkatalog-data'

useHead({
  title: 'Datenkatalog – Umsetzungsstand | Kanton Basel-Stadt',
})

const { data, pending, error } = await useDatenkatalogData()

const kpis = computed(() => data.value?.kpis ?? [])
const timelineRows = computed(() => buildTimelineRows(data.value?.rows ?? []))
const datenstand = computed(() => {
  const isoDate = data.value?.dataProcessedDate
  return isoDate ? formatDatenstand(isoDate) : null
})

/** null = show all; otherwise only Dienststellen currently in that phase */
const selectedPhaseKey = ref<string | null>(null)

function togglePhaseFilter(phaseKey: string) {
  selectedPhaseKey.value = selectedPhaseKey.value === phaseKey ? null : phaseKey
}

/** Phase whose definition overlay is currently open, or null when closed. */
const infoPhaseKey = ref<string | null>(null)

const infoPhase = computed(() => {
  const phaseKey = infoPhaseKey.value
  if (!phaseKey) {
    return null
  }
  return PHASE_DEFINITIONS.find((phase) => phase.key === phaseKey) ?? null
})

function openPhaseInfo(phaseKey: string) {
  infoPhaseKey.value = phaseKey
}

function closePhaseInfo() {
  infoPhaseKey.value = null
}

const filteredTimelineRows = computed(() => {
  const phaseKey = selectedPhaseKey.value
  if (!phaseKey) {
    return timelineRows.value
  }
  return timelineRows.value.filter((row) => row.currentPhaseKey === phaseKey)
})
</script>

<template>
  <div class="space-y-30">
    <h1 class="header-title text-primary-600 hyphens-auto text-balance">
      Datenkatalog – Umsetzungsstand
    </h1>
    <p class="lead mt-30 hyphens-auto lg:hyphens-none text-pretty">
      Fortschritt bei der Einführung des Kantonalen Datenkatalogs pro Dienststelle – von
      Kontaktiert bis Abnahme.
    </p>

    <div class="my-20 lg:mb-30 xl:pr-220">
      <div class="ck-content hyphens-auto lg:hyphens-none">
        <p>
          Dieses Dashboard gibt einen Überblick über den Rollout des Datenkatalogs
          im Kanton Basel-Stadt.
          Für jede Dienststelle wird sichtbar, in welcher Phase sich die
          Umsetzung befindet: Kontaktiert, Informiert, Kick-Off, Beginn Metadatenerfassung,
          Review und Abnahme.
          Weitere Informationen über den
          <a href="https://datenkatalog.bs.ch" target="_blank" rel="noopener noreferrer">Kantonalen Datenkatalog</a>
          finden Sie
          <a href="https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog" target="_blank" rel="noopener noreferrer">hier</a>.
        </p>
        <p>
          Die Kennzahlen unten zeigen, wie viele Dienststellen die jeweilige Phase bereits
          erreicht haben. Der Zeitstrahl visualisiert die erreichten Termine pro laufender
          Dienststelle.
        </p>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Umsetzungsstand nach Phase
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Anzahl der Dienststellen, die mindestens die jeweilige Phase erreicht haben.
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
          v-for="kpi in kpis"
          :key="kpi.key"
          class="relative"
        >
          <KPICard
            :title="kpi.title"
            :description="kpi.description"
            :value="kpi.count"
            class="phase-filter-control"
            :class="{
              'phase-filter-control--selected': selectedPhaseKey === kpi.key,
              'phase-filter-control--dimmed': selectedPhaseKey != null && selectedPhaseKey !== kpi.key,
            }"
            role="button"
            tabindex="0"
            :aria-pressed="selectedPhaseKey === kpi.key"
            @click="togglePhaseFilter(kpi.key)"
            @keydown.enter.prevent="togglePhaseFilter(kpi.key)"
            @keydown.space.prevent="togglePhaseFilter(kpi.key)"
          />
          <button
            type="button"
            class="kpi-info-trigger absolute top-10 right-10 flex items-center justify-center w-24 h-24 rounded-full"
            :aria-label="`Definition anzeigen: ${kpi.title}`"
            @click="openPhaseInfo(kpi.key)"
          >
            <component :is="IconSymbolInfoI" aria-hidden="true" class="w-16 h-16" />
          </button>
        </div>
      </div>
    </div>

    <PhaseInfoDialog :phase="infoPhase" @close="closePhaseInfo" />

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Zeitstrahl je Dienststelle
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Übersicht der erreichten Termine je laufender Dienststelle und Phase, ab
            Dezember 2025 bis heute. Durch Klicken auf eine Phase in der Legende werden
			die Dienststellen nach ihrer aktuell laufenden Phase gefiltert.
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
        :selected-phase-key="selectedPhaseKey"
        :datenstand="datenstand"
        @select-phase="togglePhaseFilter"
      />

      <div class="my-20 lg:mb-30 xl:pr-220">
        <h3 class="h3 mb-20 lg:mb-30 scroll-mt-10 xl:pr-140">
          Anmerkungen zu den Zeitstrahlen
        </h3>
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Der Zeitstrahl zeigt die jeweils zuletzt erreichte Phase einer Dienststelle.
            Endet der Zeitstrahl vor der letzten Projektphase, bedeutet dies nicht zwingend
            eine Verzögerung. Der Rollout erfolgt in enger Abstimmung mit den Dienststellen
            und orientiert sich an deren zeitlichen und organisatorischen Möglichkeiten.
            Pausen zwischen einzelnen Phasen können beispielsweise durch unterschiedliche
            Prioritäten, personelle Veränderungen, laufende Projekte oder einen erhöhten
            Abstimmungs- und Bearbeitungsaufwand entstehen.
          </p>
          <p>
            Auch der Umfang der zu erfassenden Metadaten unterscheidet sich je nach
            Dienststelle teilweise erheblich und beeinflusst die Dauer einzelner Phasen.
            Unterschiede in der Dauer der einzelnen Phasen sind daher Teil des regulären
            Rollout-Prozesses.
          </p>
          <p>
            Im Dashboard erscheinen nur Dienststellen, mit denen bereits Kontakt
            aufgenommen wurde. Nicht aufgeführte Dienststellen wurden bisher noch nicht
            kontaktiert.
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Kontakt
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Möchten Sie den Rollout Ihrer Dienststelle starten? Melden Sie sich einfach
            per E-Mail oder rufen Sie uns an:
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
.phase-filter-control {
  cursor: pointer;
}

.phase-filter-control--selected {
  border-color: var(--color-primary-600, #00838f);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-600, #00838f) 35%, transparent);
}

.phase-filter-control--dimmed {
  opacity: 0.55;
}

.kpi-info-trigger {
  cursor: pointer;
  color: var(--color-primary-600, #00838f);
  background: none;
  border: none;
}

.kpi-info-trigger:hover {
  color: var(--color-primary-800, #005662);
}

:deep(.kpi-card__intro) {
  padding-right: 28px;
}
</style>