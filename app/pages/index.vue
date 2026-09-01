<script setup lang="ts">
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

const phaseDetailByKey = Object.fromEntries(
  PHASE_DEFINITIONS.map((phase) => [phase.key, phase.detailContent]),
)

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
          Im Dashboard erscheinen nur Dienststellen, mit denen bereits Kontakt zur Umsetzung aufenommen wurde – entweder
          durch das DCC oder auf Initiative der Dienststelle.
          Nicht aufgeführte Dienststellen stehen bislang noch nicht im Austausch mit dem DCC.
        </p>
        <p>
          Für jede Dienststelle wird sichtbar, in welcher Phase sich die
          Umsetzung befindet: «Kontaktiert», «Informiert», «Kick-Off», «Beginn Metadatenerfassung», «Review» und «Abnahme».
          Weitere Informationen über den
          <a href="https://datenkatalog.bs.ch" target="_blank" rel="noopener noreferrer">Kantonalen Datenkatalog</a>
          finden Sie
          <a href="https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog" target="_blank" rel="noopener noreferrer">hier</a>.
        </p>
        <p>
          Die folgenden Kennzahlen zeigen, wie viele Dienststellen die jeweilige Phase kumulativ bereits
          durchlaufen bzw. erreicht haben. Eine Erklärung für die jeweilige Phase wird beim Überfahren
          bzw. Antippen des Informations-Icons angezeigt.
          Der Zeitstrahl visualisiert die erreichten Termine pro begleitete Dienststelle bzw. Fachstelle.
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
          />
          <div class="absolute top-10 right-10">
            <IconHoverBox
              :title="kpi.title"
              :aria-label="`Definition: ${kpi.title}`"
            >
              <template #body>
                <div v-html="phaseDetailByKey[kpi.key]" />
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
            Übersicht der erreichten Termine je begleitete Dienststelle und Projektphase, ab
            Dezember 2025 bis heute. Durch Klicken auf eine Phase in der Legende werden
            die Dienststellen nach ihrem aktuellen Projektstand gefiltert.
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
        :selected-phase-key="selectedPhaseKey"
        :datenstand="datenstand"
        @select-phase="togglePhaseFilter"
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
            Der Zeitstrahl zeigt die jeweils zuletzt erreichte Projektphase einer Dienststelle.
            Endet der Zeitstrahl vor der letzten Phase, lässt sich daraus nicht unmittelbar auf
            den aktuellen Bearbeitungsstand oder eine Verzögerung schliessen.
            Der Rollout erfolgt in Abstimmung mit den Dienststellen und orientiert sich an den jeweiligen zeitlichen
            und organisatorischen Rahmenbedingungen.
          </p>
          <p>
            Auch der Umfang der zu erfassenden Metadaten kann sich zwischen den Dienststelle
            erheblich unterscheiden und die Dauer einzelner Projektphasen beeinflussen. Zwischen den
            einzelnen Phasen können daher unterschiedlich lange Zeiträume liegen. Der dargestellte Stand
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
            per E-Mail oder telefonisch bei uns. Das DCC begleitet Sie eng bei der
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
</style>