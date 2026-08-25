<script setup lang="ts">
import * as d3 from 'd3'
import {
  clampToTimelineStart,
  PHASE_DEFINITIONS,
  TIMELINE_START_DATE,
  type TimelineMilestone,
  type TimelineRow,
} from '~/utils/datenkatalog-data'

const props = defineProps<{
  rows: TimelineRow[]
  selectedPhaseKey?: string | null
  datenstand?: string | null
}>()

const emit = defineEmits<{
  'select-phase': [phaseKey: string]
}>()

const ROW_HEIGHT = 36
const MILESTONE_SIZE = 12
const MILESTONE_HIT_SIZE = 20
const CURRENT_MILESTONE_SIZE = 16
const CURRENT_MILESTONE_HIT_SIZE = 24
const GROUP_HEADER_HEIGHT = 24
const AXIS_HEIGHT = 28
const PX_PER_DAY = 6
const MIN_CHART_WIDTH = 480
const DAY_MS = 24 * 60 * 60 * 1000

const today = new Date()
const formatDate = d3.timeFormat('%d.%m.%Y')
const formatTick = d3.timeFormat('%m.%Y')

const timelineStart = new Date(TIMELINE_START_DATE)

const timeDomain = computed<[Date, Date]>(() => {
  const dates = props.rows.flatMap((row) => row.milestones.map((milestone) => new Date(milestone.date)))
  if (dates.length === 0) {
    return [timelineStart, today]
  }
  const earliest = new Date(Math.min(...dates.map((date) => date.getTime())))
  const domainStart = new Date(Math.max(earliest.getTime() - 7 * DAY_MS, timelineStart.getTime()))
  return [domainStart, new Date(today.getTime() + 7 * DAY_MS)]
})

const chartWidth = computed(() => {
  const [start, end] = timeDomain.value
  const days = Math.max((end.getTime() - start.getTime()) / DAY_MS, 1)
  return Math.max(Math.round(days * PX_PER_DAY), MIN_CHART_WIDTH)
})

/**
 * Absolute top offset for each row, accounting for the height of every lane
 * group header rendered above it. Rows sharing the same currentPhaseKey are
 * contiguous (rows are sorted by phaseRank), so a new header is inserted
 * whenever the phase key changes.
 */
const rowTops = computed<number[]>(() => {
  const tops: number[] = []
  let headerCount = 0
  props.rows.forEach((row, index) => {
    const isGroupStart = index === 0 || row.currentPhaseKey !== props.rows[index - 1].currentPhaseKey
    if (isGroupStart) {
      headerCount += 1
    }
    tops.push(AXIS_HEIGHT + headerCount * GROUP_HEADER_HEIGHT + index * ROW_HEIGHT)
  })
  return tops
})

interface LaneGroup {
  key: string
  title: string
  count: number
  laneFillClass: string
  startIndex: number
  top: number
  height: number
}

/** One entry per contiguous block of rows sharing the same current phase. */
const laneGroups = computed<LaneGroup[]>(() => {
  const groups: LaneGroup[] = []
  props.rows.forEach((row, index) => {
    const isGroupStart = index === 0 || row.currentPhaseKey !== props.rows[index - 1].currentPhaseKey
    const top = rowTops.value[index]
    if (isGroupStart) {
      groups.push({
        key: row.currentPhaseKey,
        title: row.currentPhaseTitle,
        count: 1,
        laneFillClass: row.currentPhaseLaneFillClass,
        startIndex: index,
        top,
        height: ROW_HEIGHT,
      })
    } else {
      const group = groups[groups.length - 1]!
      group.count += 1
      group.height = top + ROW_HEIGHT - group.top
    }
  })
  return groups
})

type LineItem =
  | { type: 'header', key: string, group: LaneGroup }
  | { type: 'row', key: string, row: TimelineRow }

/** Flattened list of group headers and rows, used for the label/status columns. */
const lineItems = computed<LineItem[]>(() => {
  const items: LineItem[] = []
  props.rows.forEach((row, index) => {
    const group = laneGroups.value.find((candidate) => candidate.startIndex === index)
    if (group) {
      items.push({ type: 'header', key: `header-${group.key}-${index}`, group })
    }
    items.push({ type: 'row', key: row.posten, row })
  })
  return items
})

const chartHeight = computed(() => {
  if (props.rows.length === 0) {
    return AXIS_HEIGHT
  }
  return rowTops.value[rowTops.value.length - 1]! + ROW_HEIGHT
})

const xScale = computed(() => d3.scaleTime().domain(timeDomain.value).range([0, chartWidth.value]))

const ticks = computed(() => xScale.value.ticks(Math.max(Math.round(chartWidth.value / 90), 2)))

const todayX = computed(() => xScale.value(today))

const legendItems = computed(() =>
  PHASE_DEFINITIONS.map((phase) => ({
    key: phase.key,
    title: phase.title,
    swatchClass: phase.legendSwatchClass,
  })),
)

function rowY(rowIndex: number) {
  return rowTops.value[rowIndex] ?? AXIS_HEIGHT + rowIndex * ROW_HEIGHT
}

function milestoneSize(row: TimelineRow, milestone: TimelineMilestone) {
  return milestone.key === row.currentPhaseKey ? CURRENT_MILESTONE_SIZE : MILESTONE_SIZE
}

function milestoneHitSize(row: TimelineRow, milestone: TimelineMilestone) {
  return milestone.key === row.currentPhaseKey ? CURRENT_MILESTONE_HIT_SIZE : MILESTONE_HIT_SIZE
}

interface ActiveMilestone {
  left: number
  top: number
  items: TimelineMilestone[]
}

const activeMilestone = ref<ActiveMilestone | null>(null)

watch(
  () => props.rows,
  () => {
    activeMilestone.value = null
  },
)

function milestonesOnSameDate(row: TimelineRow, milestone: TimelineMilestone) {
  return row.milestones.filter((candidate) => candidate.date === milestone.date)
}

function milestoneTitleText(milestones: TimelineMilestone[]) {
  return milestones
    .map((milestone) => `${milestone.title}: ${formatDate(new Date(milestone.date))}`)
    .join('\n')
}

function showMilestone(event: PointerEvent, row: TimelineRow, milestone: TimelineMilestone) {
  const target = event.currentTarget as SVGRectElement
  const rect = target.getBoundingClientRect()
  activeMilestone.value = {
    left: rect.left + rect.width / 2,
    top: rect.top,
    items: milestonesOnSameDate(row, milestone),
  }
}

function hideMilestone() {
  activeMilestone.value = null
}

function onLegendPhaseClick(phaseKey: string) {
  emit('select-phase', phaseKey)
}
</script>

<template>
  <div class="rollout-timeline">
    <div
      v-if="rows.length === 0 && !selectedPhaseKey"
      class="text-primary-600"
    >
      Aktuell sind keine Dienststellen in Bearbeitung.
    </div>
    <template v-else>
      <div class="rollout-timeline__legend flex flex-wrap items-center gap-10 mb-10">
        <button
          v-for="item in legendItems"
          :key="item.key"
          type="button"
          class="rollout-timeline__legend-item flex items-center gap-5"
          :class="{
            'rollout-timeline__legend-item--selected': selectedPhaseKey === item.key,
            'rollout-timeline__legend-item--dimmed': selectedPhaseKey != null && selectedPhaseKey !== item.key,
          }"
          :aria-pressed="selectedPhaseKey === item.key"
          @click="onLegendPhaseClick(item.key)"
        >
          <span
            class="inline-block w-10 h-10 rounded-sm"
            :class="item.swatchClass"
          />
          <span class="text-xs text-primary-600">{{ item.title }}</span>
        </button>
      </div>

      <div
        v-if="rows.length === 0"
        class="text-primary-600"
      >
        Keine Dienststellen in dieser Phase.
      </div>
      <div
        v-else
        class="rollout-timeline__body flex"
      >
        <div
          class="rollout-timeline__labels flex-shrink-0 w-140 sm:w-220"
          :style="{ paddingTop: `${AXIS_HEIGHT}px` }"
        >
          <template
            v-for="item in lineItems"
            :key="item.key"
          >
            <div
              v-if="item.type === 'header'"
              class="rollout-timeline__lane-header truncate text-[11px] font-bold uppercase tracking-wide text-primary-700 pr-10"
              :style="{ height: `${GROUP_HEADER_HEIGHT}px`, lineHeight: `${GROUP_HEADER_HEIGHT}px` }"
              :title="`${item.group.title} (${item.group.count})`"
            >
              {{ item.group.title }} ({{ item.group.count }})
            </div>
            <div
              v-else
              class="truncate text-xs sm:text-sm pr-10"
              :style="{ height: `${ROW_HEIGHT}px`, lineHeight: `${ROW_HEIGHT}px` }"
              :title="item.row.label"
            >
              {{ item.row.label }}
            </div>
          </template>
        </div>

        <div
          class="rollout-timeline__scroll relative overflow-x-auto"
          @scroll="hideMilestone"
        >
          <svg
            :width="chartWidth"
            :height="chartHeight"
            role="img"
            aria-label="Zeitstrahl der Umsetzungsphasen je Dienststelle"
          >
            <rect
              v-for="group in laneGroups"
              :key="`wash-${group.key}-${group.startIndex}`"
              :x="0"
              :y="group.top"
              :width="chartWidth"
              :height="group.height"
              :class="group.laneFillClass"
              fill-opacity="0.5"
            />
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

            <line
              v-for="group in laneGroups.slice(1)"
              :key="`divider-${group.key}-${group.startIndex}`"
              :x1="0"
              :x2="chartWidth"
              :y1="group.top - GROUP_HEADER_HEIGHT"
              :y2="group.top - GROUP_HEADER_HEIGHT"
              class="stroke-gray-300"
              stroke-width="1"
              stroke-dasharray="4 3"
            />

            <g
              v-for="(row, rowIndex) in rows"
              :key="row.posten"
            >
              <line
                v-if="row.connectorLine"
                :x1="xScale(clampToTimelineStart(row.connectorLine.start))"
                :x2="xScale(clampToTimelineStart(row.connectorLine.end))"
                :y1="rowY(rowIndex) + ROW_HEIGHT / 2"
                :y2="rowY(rowIndex) + ROW_HEIGHT / 2"
                class="stroke-gray-400"
                stroke-width="1.5"
                stroke-dasharray="4 3"
              />
              <rect
                v-for="milestone in row.milestones"
                :key="milestone.key"
                :x="xScale(clampToTimelineStart(milestone.date)) - milestoneSize(row, milestone) / 2"
                :y="rowY(rowIndex) + ROW_HEIGHT / 2 - milestoneSize(row, milestone) / 2"
                :width="milestoneSize(row, milestone)"
                :height="milestoneSize(row, milestone)"
                rx="2"
                :class="milestone.colorClass"
                class="pointer-events-none"
              />
              <rect
                v-for="milestone in row.milestones"
                :key="`hit-${milestone.key}`"
                :x="xScale(clampToTimelineStart(milestone.date)) - milestoneHitSize(row, milestone) / 2"
                :y="rowY(rowIndex) + ROW_HEIGHT / 2 - milestoneHitSize(row, milestone) / 2"
                :width="milestoneHitSize(row, milestone)"
                :height="milestoneHitSize(row, milestone)"
                fill="transparent"
                @pointerenter="showMilestone($event, row, milestone)"
                @pointerleave="hideMilestone"
              >
                <title>{{ milestoneTitleText(milestonesOnSameDate(row, milestone)) }}</title>
              </rect>
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
            class="rollout-timeline__tooltip fixed bg-white border border-gray-300 rounded text-xs px-10 py-5 shadow-md"
            :style="{ left: `${activeMilestone.left}px`, top: `${activeMilestone.top}px` }"
          >
            <div
              v-for="(item, index) in activeMilestone.items"
              :key="item.key"
              :class="{ 'mt-5': index > 0 }"
            >
              <strong>{{ item.title }}</strong>
              <div>{{ formatDate(new Date(item.date)) }}</div>
            </div>
          </div>
        </div>

        <div
          class="rollout-timeline__status flex-shrink-0 w-100 sm:w-140 pl-10"
          :style="{ paddingTop: `${AXIS_HEIGHT}px` }"
        >
          <template
            v-for="item in lineItems"
            :key="item.key"
          >
            <div
              v-if="item.type === 'header'"
              :style="{ height: `${GROUP_HEADER_HEIGHT}px` }"
            />
            <div
              v-else
              class="flex items-center"
              :style="{ height: `${ROW_HEIGHT}px` }"
            >
              <span
                class="rollout-timeline__status-chip inline-block max-w-full truncate rounded-sm px-5 text-[11px] font-medium"
                :class="item.row.currentPhaseChipClass"
                :title="item.row.currentPhaseTitle"
              >
                {{ item.row.currentPhaseTitle }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <p
        v-if="datenstand"
        class="rollout-timeline__datenstand text-xs text-gray-500 mt-10"
      >
        Stand: {{ datenstand }}
      </p>
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
  pointer-events: none;
  z-index: 10;
}

.rollout-timeline__legend-item {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  padding: 0.15rem 0.35rem;
  cursor: pointer;
}

.rollout-timeline__legend-item--selected {
  border-color: var(--color-primary-600, #00838f);
  background: color-mix(in srgb, var(--color-primary-600, #00838f) 8%, white);
}

.rollout-timeline__legend-item--dimmed {
  opacity: 0.45;
}
</style>
