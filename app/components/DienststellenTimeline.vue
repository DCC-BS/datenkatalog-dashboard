<script setup lang="ts">
import * as d3 from 'd3'
import { PHASE_DEFINITIONS, type TimelineMilestone, type TimelineRow } from '~/utils/datenkatalog-data'

const props = defineProps<{
  rows: TimelineRow[]
}>()

const ROW_HEIGHT = 36
const MILESTONE_SIZE = 12
const MILESTONE_HIT_SIZE = 20
const AXIS_HEIGHT = 28
const PX_PER_DAY = 6
const MIN_CHART_WIDTH = 480
const DAY_MS = 24 * 60 * 60 * 1000

const today = new Date()
const formatDate = d3.timeFormat('%d.%m.%Y')
const formatTick = d3.timeFormat('%m.%Y')

const timeDomain = computed<[Date, Date]>(() => {
  const dates = props.rows.flatMap((row) => row.milestones.map((milestone) => new Date(milestone.date)))
  if (dates.length === 0) {
    return [today, today]
  }
  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())))
  return [new Date(earliest.getTime() - 7 * DAY_MS), new Date(today.getTime() + 7 * DAY_MS)]
})

const chartWidth = computed(() => {
  const [start, end] = timeDomain.value
  const days = Math.max((end.getTime() - start.getTime()) / DAY_MS, 1)
  return Math.max(Math.round(days * PX_PER_DAY), MIN_CHART_WIDTH)
})

const chartHeight = computed(() => AXIS_HEIGHT + props.rows.length * ROW_HEIGHT)

const xScale = computed(() => d3.scaleTime().domain(timeDomain.value).range([0, chartWidth.value]))

const ticks = computed(() => xScale.value.ticks(Math.max(Math.round(chartWidth.value / 90), 2)))

const todayX = computed(() => xScale.value(today))

const legendItems = computed(() =>
  PHASE_DEFINITIONS.map((phase) => ({
    key: phase.key,
    title: phase.title,
    swatchClass: phase.colorClass.replace('fill-', 'bg-'),
  })),
)

function rowY(rowIndex: number) {
  return AXIS_HEIGHT + rowIndex * ROW_HEIGHT
}

interface ActiveMilestone {
  rowIndex: number
  key: string
  x: number
  y: number
  title: string
  date: string
}

const activeMilestone = ref<ActiveMilestone | null>(null)

function toggleMilestone(rowIndex: number, milestone: TimelineMilestone) {
  if (activeMilestone.value?.rowIndex === rowIndex && activeMilestone.value?.key === milestone.key) {
    activeMilestone.value = null
    return
  }
  activeMilestone.value = {
    rowIndex,
    key: milestone.key,
    x: xScale.value(new Date(milestone.date)),
    y: rowY(rowIndex) + ROW_HEIGHT / 2,
    title: milestone.title,
    date: milestone.date,
  }
}

function closeMilestone() {
  activeMilestone.value = null
}
</script>

<template>
  <div class="rollout-timeline">
    <div
      v-if="rows.length === 0"
      class="text-primary-600"
    >
      Aktuell sind keine Dienststellen in Bearbeitung.
    </div>
    <template v-else>
      <div class="rollout-timeline__legend flex flex-wrap items-center gap-10 mb-10">
        <div
          v-for="item in legendItems"
          :key="item.key"
          class="flex items-center gap-5"
        >
          <span
            class="inline-block w-10 h-10 rounded-sm"
            :class="item.swatchClass"
          />
          <span class="text-xs text-primary-600">{{ item.title }}</span>
        </div>
      </div>

      <div class="rollout-timeline__body flex">
        <div
          class="rollout-timeline__labels flex-shrink-0 w-140 sm:w-220"
          :style="{ paddingTop: `${AXIS_HEIGHT}px` }"
        >
          <div
            v-for="row in rows"
            :key="row.posten"
            class="truncate text-xs sm:text-sm pr-10"
            :style="{ height: `${ROW_HEIGHT}px`, lineHeight: `${ROW_HEIGHT}px` }"
            :title="row.label"
          >
            {{ row.label }}
          </div>
        </div>

        <div class="rollout-timeline__scroll relative overflow-x-auto">
          <svg
            :width="chartWidth"
            :height="chartHeight"
            role="img"
            aria-label="Zeitstrahl der Umsetzungsphasen je Dienststelle"
            @click="closeMilestone"
          >
            <line
              v-for="tick in ticks"
              :key="`grid-${tick.toISOString()}`"
              :x1="xScale(tick)"
              :x2="xScale(tick)"
              :y1="0"
              :y2="chartHeight"
              class="stroke-gray-200"
              stroke-width="1"
            />
            <text
              v-for="tick in ticks"
              :key="`label-${tick.toISOString()}`"
              :x="xScale(tick)"
              :y="AXIS_HEIGHT - 12"
              class="fill-gray-500 text-[10px]"
            >
              {{ formatTick(tick) }}
            </text>

            <g
              v-for="(row, rowIndex) in rows"
              :key="row.posten"
            >
              <line
                v-if="row.connectorLine"
                :x1="xScale(new Date(row.connectorLine.start))"
                :x2="xScale(new Date(row.connectorLine.end))"
                :y1="rowY(rowIndex) + ROW_HEIGHT / 2"
                :y2="rowY(rowIndex) + ROW_HEIGHT / 2"
                class="stroke-gray-400"
                stroke-width="1.5"
                stroke-dasharray="4 3"
              />
              <rect
                v-for="milestone in row.milestones"
                :key="milestone.key"
                :x="xScale(new Date(milestone.date)) - MILESTONE_SIZE / 2"
                :y="rowY(rowIndex) + ROW_HEIGHT / 2 - MILESTONE_SIZE / 2"
                :width="MILESTONE_SIZE"
                :height="MILESTONE_SIZE"
                rx="2"
                :class="milestone.colorClass"
                class="pointer-events-none"
              />
              <rect
                v-for="milestone in row.milestones"
                :key="`hit-${milestone.key}`"
                :x="xScale(new Date(milestone.date)) - MILESTONE_HIT_SIZE / 2"
                :y="rowY(rowIndex) + ROW_HEIGHT / 2 - MILESTONE_HIT_SIZE / 2"
                :width="MILESTONE_HIT_SIZE"
                :height="MILESTONE_HIT_SIZE"
                fill="transparent"
                class="cursor-pointer"
                @click.stop="toggleMilestone(rowIndex, milestone)"
              />
            </g>

            <line
              :x1="todayX"
              :x2="todayX"
              :y1="0"
              :y2="chartHeight"
              class="stroke-primary-700"
              stroke-width="1.5"
              stroke-dasharray="4 3"
            />
            <text
              :x="todayX + 4"
              :y="AXIS_HEIGHT - 12"
              class="fill-primary-700 text-[10px] font-bold"
            >
              Heute
            </text>
          </svg>

          <div
            v-if="activeMilestone"
            class="rollout-timeline__tooltip absolute bg-white border border-gray-300 rounded text-xs px-10 py-5 shadow-md"
            :style="{ left: `${activeMilestone.x}px`, top: `${activeMilestone.y}px` }"
          >
            <strong>{{ activeMilestone.title }}</strong>
            <div>{{ formatDate(new Date(activeMilestone.date)) }}</div>
          </div>
        </div>

        <div
          class="rollout-timeline__status flex-shrink-0 w-100 sm:w-140 pl-10"
          :style="{ paddingTop: `${AXIS_HEIGHT}px` }"
        >
          <div
            v-for="row in rows"
            :key="row.posten"
            class="truncate text-xs sm:text-sm text-primary-600"
            :style="{ height: `${ROW_HEIGHT}px`, lineHeight: `${ROW_HEIGHT}px` }"
            :title="row.currentPhaseTitle"
          >
            {{ row.currentPhaseTitle }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rollout-timeline__scroll {
  scrollbar-width: thin;
  direction: rtl;
}

.rollout-timeline__scroll > * {
  direction: ltr;
}

.rollout-timeline__tooltip {
  transform: translate(-50%, -130%);
  white-space: nowrap;
  z-index: 10;
}
</style>
