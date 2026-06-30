<script setup lang="ts">
import { buildTimelineRows } from '~/utils/datenkatalog-data'

useHead({
  title: 'Datenkatalog – Umsetzungsstand | Kanton Basel-Stadt',
})

const { data, pending, error } = await useDatenkatalogData()

const kpis = computed(() => data.value?.kpis ?? [])
const timelineRows = computed(() => buildTimelineRows(data.value?.rows ?? []))
</script>

<template>
  <div class="space-y-30">
    <h1 class="header-title text-primary-600 hyphens-auto text-balance">
      Datenkatalog – Umsetzungsstand
    </h1>
    <p class="lead mt-30 hyphens-auto lg:hyphens-none text-pretty">
      Fortschritt bei der Einführung des Kantons-Datenkatalogs pro Dienststelle – von
      Erstkontakt bis zur offiziellen Abnahme.
    </p>

    <div class="my-20 lg:mb-30 xl:pr-220">
      <div class="ck-content hyphens-auto lg:hyphens-none">
        <p>
          Dieses Dashboard gibt einen Überblick über den Rollout des Datenkatalogs im Kanton
          Basel-Stadt. Für jede Dienststelle wird sichtbar, in welcher Phase sich die
          Umsetzung befindet: Kontakt, Information, Kick-off, Metadatenerfassung, Review
          sowie die offizielle Abnahme.
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
            Anzahl Dienststellen pro Phase.
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
        <KPICard
          v-for="kpi in kpis"
          :key="kpi.key"
          :title="kpi.title"
          :description="kpi.description"
          :value="kpi.count"
        />
      </div>
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Zeitstrahl je Dienststelle
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Übersicht der erreichten Termine je laufender Dienststelle und Phase, von
            Erstkontakt bis heute.
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
        :rows="timelineRows"
      />
    </div>

    <div>
      <h3 class="h3 mb-20 lg:mb-30 mt-10 md:mt-40 xl:mt-50 scroll-mt-10 xl:pr-140">
        Weiterführende Informationen
      </h3>
      <div class="my-20 lg:mb-30 xl:pr-220">
        <div class="ck-content hyphens-auto lg:hyphens-none">
          <p>
            Definitionen der Phasen, Hintergrund zum Datenkatalog und Kontaktangaben finden
            Sie auf der Info-Seite.
          </p>
        </div>
      </div>
      <LinkItem
        href="/info"
        title="Weitere Informationen"
        description="Definitionen der Rollout-Phasen, Erläuterungen zum Datenkatalog und Kontakte."
      />
    </div>
  </div>
</template>