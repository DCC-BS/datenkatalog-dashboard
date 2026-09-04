<script setup lang="ts">
import * as d3 from 'd3'
import {
  clampToTimelineBounds,
  STEP_DEFINITIONS,
  TIMELINE_START_DATE,
  type StepCountMode,
  type TimelineStepMarker,
  type TimelineRow,
} from '~/utils/datenkatalog-data'

const props = defineProps<{
  rows: TimelineRow[]
  selectedStepKey?: string | null
  stepCountMode?: StepCountMode
  datenstand?: string | null
}>()

const emit = defineEmits<{
  'select-step': [stepKey: string | null]
  'update:stepCountMode': [mode: StepCountMode]
}>()

const stepCountModeItems = [
  { value: 'cumulative' as const, label: 'Kumulativ' },
  { value: 'current' as const, label: 'Aktuell' },
]

const ROW_HEIGHT = 36
const STEP_MARKER_SIZE = 12
const STEP_MARKER_HIT_SIZE = 20
const CURRENT_STEP_MARKER_SIZE = 16
const CURRENT_STEP_MARKER_HIT_SIZE = 24
const GROUP_HEADER_HEIGHT = 24
const AXIS_HEIGHT = 28
const PX_PER_DAY = 6
const MIN_CHART_WIDTH = 480
const EDGE_ARROW_INSET = 4
const EDGE_ARROW_SIZE = 7
const DAY_MS = 24 * 60 * 60 * 1000
/** Keeps the year boundary off the viewport edge when jumping to a year. */
const YEAR_SCROLL_LEAD_IN = 12

const today = new Date()
const formatDate = d3.timeFormat('%d.%m.%Y')

/**
 * Formats a step marker date for hover display: dates before TIMELINE_START_DATE
 * collapse to "vor 01.12.2025"; future (planned) dates show as
 * "geplant am DD.MM.YYYY" with the actual date.
 */
function formatHoverDate(date: Date): string {
  const start = new Date(TIMELINE_START_DATE)
  if (date.getTime() < start.getTime()) {
    return 'vor 01.12.2025'
  }
  if (date.getTime() > today.getTime()) {
    return `geplant am ${formatDate(date)}`
  }
  return formatDate(date)
}
const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const
function formatTick(date: Date): string {
  return `${GERMAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Rough px width for axis `text-[10px]` labels; avoids DOM measuring.
 * If a short month still shifts when it shouldn’t (or a long one still clips), tweak this slightly.
 */
const AXIS_CHAR_WIDTH = 5.5
const HEUTE_LABEL = 'Heute'
const HEUTE_LABEL_OFFSET = 4

function approxLabelWidth(text: string) {
  return text.length * AXIS_CHAR_WIDTH
}

interface AxisTickLabel {
  date: Date
  x: number
  textAnchor: 'start' | 'end'
}

const timelineStart = new Date(TIMELINE_START_DATE)

/**
 * Fixed extent, independent of the rows on screen, so the axis and the chart
 * width stay put while the step filter changes which Dienststellen are shown.
 */
const timeDomain = computed<[Date, Date]>(() => [
  timelineStart,
  new Date(today.getTime() + 7 * DAY_MS),
])

/** One jump button per calendar year touched by [timelineStart, today]. */
const yearOptions = Array.from(
  { length: today.getFullYear() - timelineStart.getFullYear() + 1 },
  (_, index) => timelineStart.getFullYear() + index,
)

const chartWidth = computed(() => {
  const [start, end] = timeDomain.value
  const days = Math.max((end.getTime() - start.getTime()) / DAY_MS, 1)
  return Math.max(Math.round(days * PX_PER_DAY), MIN_CHART_WIDTH)
})

/**
 * Absolute top offset for each row, accounting for the height of every lane
 * group header rendered above it. Rows sharing the same currentStepKey are
 * contiguous (rows are sorted by stepRank), so a new header is inserted
 * whenever the step key changes.
 */
const rowTops = computed<number[]>(() => {
  const tops: number[] = []
  let headerCount = 0
  props.rows.forEach((row, index) => {
    const isGroupStart = index === 0 || row.currentStepKey !== props.rows[index - 1].currentStepKey
    if (isGroupStart) {
      headerCount += 1
    }
    tops.push(headerCount * GROUP_HEADER_HEIGHT + index * ROW_HEIGHT)
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

/** One entry per contiguous block of rows sharing the same current step. */
const laneGroups = computed<LaneGroup[]>(() => {
  const groups: LaneGroup[] = []
  props.rows.forEach((row, index) => {
    const isGroupStart = index === 0 || row.currentStepKey !== props.rows[index - 1].currentStepKey
    const top = rowTops.value[index]
    if (isGroupStart) {
      groups.push({
        key: row.currentStepKey,
        title: row.currentStepTitle,
        count: 1,
        laneFillClass: row.currentStepLaneFillClass,
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
    return 0
  }
  return rowTops.value[rowTops.value.length - 1]! + ROW_HEIGHT
})

const xScale = computed(() => d3.scaleTime().domain(timeDomain.value).range([0, chartWidth.value]))

const ticks = computed(() => xScale.value.ticks(Math.max(Math.round(chartWidth.value / 90), 2)))

const todayX = computed(() => xScale.value(today))

/**
 * Month labels share the axis baseline with "Heute". When a left-aligned month
 * label would overlap Heute, end-align it just left of Heute instead of hiding it.
 * Uses scale(today) inline so this does not depend on todayX.
 */
const axisTickLabels = computed<AxisTickLabel[]>(() => {
  const scale = xScale.value
  const todayPx = scale(today)
  const heuteLeft = todayPx + HEUTE_LABEL_OFFSET
  const heuteRight = heuteLeft + approxLabelWidth(HEUTE_LABEL)

  return ticks.value.map((tick) => {
    const tickX = scale(tick)
    const monthRight = tickX + approxLabelWidth(formatTick(tick))
    const overlapsHeute = tickX < heuteRight && monthRight > heuteLeft
    if (overlapsHeute) {
      return {
        date: tick,
        x: todayPx,
        textAnchor: 'end',
      }
    }
    return {
      date: tick,
      x: tickX,
      textAnchor: 'start',
    }
  })
})

const legendItems = computed(() =>
  STEP_DEFINITIONS.map((step) => ({
    key: step.key,
    title: step.title,
    swatchClass: step.legendSwatchClass,
  })),
)

/**
 * Visual highlight for legend steps. In cumulative mode, the selected step
 * and all later steps are highlighted (filter shows rows that reached any of them).
 * Click/toggle state remains selectedStepKey only.
 */
function isLegendStepHighlighted(stepKey: string): boolean {
  const selected = props.selectedStepKey
  if (selected == null) {
    return false
  }
  if (props.stepCountMode !== 'cumulative') {
    return selected === stepKey
  }
  const selectedIndex = STEP_DEFINITIONS.findIndex((step) => step.key === selected)
  const itemIndex = STEP_DEFINITIONS.findIndex((step) => step.key === stepKey)
  return selectedIndex >= 0 && itemIndex >= selectedIndex
}

function rowY(rowIndex: number) {
  return rowTops.value[rowIndex] ?? rowIndex * ROW_HEIGHT
}

function stepMarkerSize(row: TimelineRow, step: TimelineStepMarker) {
  return step.key === row.currentStepKey ? CURRENT_STEP_MARKER_SIZE : STEP_MARKER_SIZE
}

function stepMarkerHitSize(row: TimelineRow, step: TimelineStepMarker) {
  return step.key === row.currentStepKey ? CURRENT_STEP_MARKER_HIT_SIZE : STEP_MARKER_HIT_SIZE
}

interface ActiveStepMarker {
  left: number
  top: number
  items: TimelineStepMarker[]
}

const activeStepMarker = ref<ActiveStepMarker | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

/** Mouse grab-to-pan; touch/trackpad keep native overflow scrolling. */
const isDragging = ref(false)
let dragPointerId: number | null = null
let dragStartX = 0
let dragStartScrollLeft = 0

/** Visible scroll window, used to detect rows whose steps are fully out of view. */
const scrollLeft = ref(0)
const viewportWidth = ref(0)
let resizeObserver: ResizeObserver | null = null

function updateViewportMetrics() {
  const el = scrollEl.value
  if (!el) {
    return
  }
  scrollLeft.value = el.scrollLeft
  viewportWidth.value = el.clientWidth
}

interface EdgeArrow {
  key: string
  side: 'left' | 'right'
  y: number
  colorClass: string
  row: TimelineRow
  step: TimelineStepMarker
  targetX: number
  hitX: number
  hitY: number
  hitSize: number
}

/**
 * At most one arrow per row: shown only when a row's entire step span
 * (first to last) is scrolled fully out of view on one side, pointing the
 * user toward it. Colored after the step nearer to the viewport.
 */
const edgeArrows = computed<EdgeArrow[]>(() => {
  if (viewportWidth.value <= 0) {
    return []
  }
  const viewLeft = scrollLeft.value
  const viewRight = scrollLeft.value + viewportWidth.value
  const arrows: EdgeArrow[] = []
  props.rows.forEach((row, rowIndex) => {
    if (row.steps.length === 0) {
      return
    }
    const firstStep = row.steps[0]!
    const lastStep = row.steps[row.steps.length - 1]!
    const firstX = xScale.value(clampToTimelineBounds(firstStep.date))
    const lastX = xScale.value(clampToTimelineBounds(lastStep.date))
    const y = rowY(rowIndex) + ROW_HEIGHT / 2
    if (lastX < viewLeft) {
      arrows.push(buildEdgeArrow({
        key: `${row.posten}-left`,
        side: 'left',
        y,
        colorClass: lastStep.colorClass,
        row,
        step: lastStep,
        targetX: lastX,
      }))
    } else if (firstX > viewRight) {
      arrows.push(buildEdgeArrow({
        key: `${row.posten}-right`,
        side: 'right',
        y,
        colorClass: firstStep.colorClass,
        row,
        step: firstStep,
        targetX: firstX,
      }))
    }
  })
  return arrows
})

function buildEdgeArrow(
  base: Omit<EdgeArrow, 'hitX' | 'hitY' | 'hitSize'>,
): EdgeArrow {
  const hitSize = stepMarkerHitSize(base.row, base.step)
  const half = hitSize / 2
  const centerX =
    base.side === 'left'
      ? EDGE_ARROW_INSET + EDGE_ARROW_SIZE / 2
      : viewportWidth.value - EDGE_ARROW_INSET - EDGE_ARROW_SIZE / 2
  return {
    ...base,
    hitX: centerX - half,
    hitY: base.y - half,
    hitSize,
  }
}

function arrowPoints(arrow: EdgeArrow) {
  const { side, y } = arrow
  if (side === 'left') {
    const tipX = EDGE_ARROW_INSET
    const baseX = tipX + EDGE_ARROW_SIZE
    return `${tipX},${y} ${baseX},${y - EDGE_ARROW_SIZE} ${baseX},${y + EDGE_ARROW_SIZE}`
  }
  const tipX = viewportWidth.value - EDGE_ARROW_INSET
  const baseX = tipX - EDGE_ARROW_SIZE
  return `${tipX},${y} ${baseX},${y - EDGE_ARROW_SIZE} ${baseX},${y + EDGE_ARROW_SIZE}`
}

function onEdgeArrowPointerDown(event: PointerEvent) {
  event.stopPropagation()
  event.preventDefault()
}

function onEdgeArrowClick(arrow: EdgeArrow) {
  const halfSize = stepMarkerSize(arrow.row, arrow.step) / 2
  const padding = YEAR_SCROLL_LEAD_IN
  if (arrow.side === 'left') {
    scrollTimelineTo(arrow.targetX - halfSize - padding)
  } else {
    scrollTimelineTo(arrow.targetX + halfSize + padding - viewportWidth.value)
  }
}

watch(
  () => props.rows,
  () => {
    activeStepMarker.value = null
  },
)

/** Match former RTL default: open scrolled to the right edge (near Heute). */
function scrollTimelineToEnd() {
  const el = scrollEl.value
  if (!el) {
    return
  }
  el.scrollLeft = el.scrollWidth - el.clientWidth
}

async function syncScrollToEnd() {
  await nextTick()
  scrollTimelineToEnd()
}

onMounted(async () => {
  await syncScrollToEnd()
  updateViewportMetrics()
  const el = scrollEl.value
  if (el) {
    resizeObserver = new ResizeObserver(updateViewportMetrics)
    resizeObserver.observe(el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

function scrollTimelineTo(left: number) {
  const el = scrollEl.value
  if (!el) {
    return
  }
  const maxLeft = Math.max(el.scrollWidth - el.clientWidth, 0)
  el.scrollTo({
    left: Math.min(Math.max(left, 0), maxLeft),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

function scrollToYear(year: number) {
  scrollTimelineTo(xScale.value(clampToTimelineBounds(`${year}-01-01`)) - YEAR_SCROLL_LEAD_IN)
}

function scrollToToday() {
  const el = scrollEl.value
  if (el) {
    scrollTimelineTo(el.scrollWidth)
  }
}

function stepsOnSameDate(row: TimelineRow, step: TimelineStepMarker) {
  return row.steps.filter((candidate) => candidate.date === step.date)
}

function stepMarkerTitleText(steps: TimelineStepMarker[]) {
  return steps
    .map((step) => `${step.title}: ${formatHoverDate(new Date(step.date))}`)
    .join('\n')
}

function showStepMarker(event: PointerEvent, row: TimelineRow, step: TimelineStepMarker) {
  const target = event.currentTarget as SVGGraphicsElement
  const rect = target.getBoundingClientRect()
  activeStepMarker.value = {
    left: rect.left + rect.width / 2,
    top: rect.top,
    items: stepsOnSameDate(row, step),
  }
}

function hideStepMarker() {
  activeStepMarker.value = null
}

function onTimelineScroll() {
  hideStepMarker()
  updateViewportMetrics()
}

function onScrollPointerDown(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0) {
    return
  }
  const el = scrollEl.value
  if (!el) {
    return
  }
  event.preventDefault()
  isDragging.value = true
  dragPointerId = event.pointerId
  dragStartX = event.clientX
  dragStartScrollLeft = el.scrollLeft
  el.setPointerCapture(event.pointerId)
}

function onScrollPointerMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragPointerId) {
    return
  }
  const el = scrollEl.value
  if (!el) {
    return
  }
  el.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX)
}

function endScrollDrag(event: PointerEvent) {
  if (event.pointerId !== dragPointerId) {
    return
  }
  isDragging.value = false
  dragPointerId = null
}

function onLegendStepClick(stepKey: string | null) {
  emit('select-step', stepKey)
}

function onStepCountModeClick(mode: StepCountMode) {
  emit('update:stepCountMode', mode)
}
</script>

<template>
  <div class="rollout-timeline">
    <div
      v-if="rows.length === 0 && !selectedStepKey"
      class="text-primary-600"
    >
      Aktuell sind keine Dienststellen in Bearbeitung.
    </div>
    <template v-else>
      <div
        class="rollout-timeline__step-count-mode flex flex-wrap items-center gap-5 mb-10"
        role="group"
        aria-label="Zählweise der Kennzahlen"
      >
        <button
          v-for="item in stepCountModeItems"
          :key="item.value"
          type="button"
          class="rollout-timeline__step-count-mode-item text-xs"
          :class="{
            'rollout-timeline__step-count-mode-item--selected': stepCountMode === item.value,
          }"
          :aria-pressed="stepCountMode === item.value"
          @click="onStepCountModeClick(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="rollout-timeline__legend flex flex-wrap items-center gap-10 mb-10">
        <button
          type="button"
          class="rollout-timeline__legend-item flex items-center gap-5"
          :class="{
            'rollout-timeline__legend-item--selected': selectedStepKey == null,
            'rollout-timeline__legend-item--dimmed': selectedStepKey != null,
          }"
          :aria-pressed="selectedStepKey == null"
          @click="onLegendStepClick(null)"
        >
          <span class="text-xs text-primary-600">Alle</span>
        </button>
        <button
          v-for="item in legendItems"
          :key="item.key"
          type="button"
          class="rollout-timeline__legend-item flex items-center gap-5"
          :class="{
            'rollout-timeline__legend-item--selected': isLegendStepHighlighted(item.key),
            'rollout-timeline__legend-item--dimmed': selectedStepKey != null && !isLegendStepHighlighted(item.key),
          }"
          :aria-pressed="selectedStepKey === item.key"
          @click="onLegendStepClick(item.key)"
        >
          <span
            class="inline-block w-10 h-10 rounded-sm"
            :class="item.swatchClass"
          />
          <span class="text-xs text-primary-600">{{ item.title }}</span>
        </button>
      </div>

      <div
        class="rollout-timeline__timenav flex flex-wrap items-center gap-5 mb-10"
        role="group"
        aria-label="Zeitraum im Zeitstrahl anspringen"
      >
        <button
          v-for="year in yearOptions"
          :key="year"
          type="button"
          class="rollout-timeline__timenav-item text-xs"
          @click="scrollToYear(year)"
        >
          {{ year }}
        </button>
        <button
          type="button"
          class="rollout-timeline__timenav-item text-xs"
          @click="scrollToToday"
        >
          Heute
        </button>
      </div>

      <div
        v-if="rows.length === 0"
        class="text-primary-600"
      >
        Keine Dienststellen mit diesem Schritt.
      </div>
      <div
        v-else
        class="rollout-timeline__body"
      >
        <div
          class="rollout-timeline__axis sticky top-0 z-10 flex bg-white border-b border-gray-200"
          :style="{ height: `${AXIS_HEIGHT}px` }"
        >
          <div class="flex-shrink-0 w-140 sm:w-220" />
          <div class="rollout-timeline__axis-viewport relative min-w-0 flex-1 overflow-hidden">
            <svg
              class="rollout-timeline__axis-track"
              :width="chartWidth"
              :height="AXIS_HEIGHT"
              :style="{ transform: `translateX(-${scrollLeft}px)` }"
              aria-hidden="true"
            >
              <text
                v-for="tick in axisTickLabels"
                :key="`label-${tick.date.toISOString()}`"
                :x="tick.x"
                :y="AXIS_HEIGHT - 10"
                :text-anchor="tick.textAnchor"
                class="fill-gray-500 text-[10px]"
              >
                {{ formatTick(tick.date) }}
              </text>
              <text
                :x="todayX + HEUTE_LABEL_OFFSET"
                :y="AXIS_HEIGHT - 10"
                class="fill-primary-700 text-[10px] font-bold"
              >
                {{ HEUTE_LABEL }}
              </text>
            </svg>
          </div>
          <div class="flex-shrink-0 w-100 sm:w-140" />
        </div>

        <div class="rollout-timeline__rows flex">
          <div class="rollout-timeline__labels flex-shrink-0 w-140 sm:w-220">
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
            ref="scrollEl"
            class="rollout-timeline__scroll relative min-w-0 flex-1 overflow-x-auto"
            :class="{ 'rollout-timeline__scroll--dragging': isDragging }"
            @scroll="onTimelineScroll"
            @pointerdown="onScrollPointerDown"
            @pointermove="onScrollPointerMove"
            @pointerup="endScrollDrag"
            @pointercancel="endScrollDrag"
            @lostpointercapture="endScrollDrag"
          >
            <svg
              :width="chartWidth"
              :height="chartHeight"
              role="img"
              aria-label="Zeitstrahl der Umsetzungsschritte je Dienststelle"
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
                  :x1="xScale(clampToTimelineBounds(row.connectorLine.start))"
                  :x2="xScale(clampToTimelineBounds(row.connectorLine.end))"
                  :y1="rowY(rowIndex) + ROW_HEIGHT / 2"
                  :y2="rowY(rowIndex) + ROW_HEIGHT / 2"
                  class="stroke-gray-400"
                  stroke-width="1.5"
                  stroke-dasharray="4 3"
                />
                <rect
                  v-for="step in row.steps"
                  :key="step.key"
                  :x="xScale(clampToTimelineBounds(step.date)) - stepMarkerSize(row, step) / 2"
                  :y="rowY(rowIndex) + ROW_HEIGHT / 2 - stepMarkerSize(row, step) / 2"
                  :width="stepMarkerSize(row, step)"
                  :height="stepMarkerSize(row, step)"
                  rx="2"
                  :class="step.colorClass"
                  class="pointer-events-none"
                />
                <rect
                  v-for="step in row.steps"
                  :key="`hit-${step.key}`"
                  :x="xScale(clampToTimelineBounds(step.date)) - stepMarkerHitSize(row, step) / 2"
                  :y="rowY(rowIndex) + ROW_HEIGHT / 2 - stepMarkerHitSize(row, step) / 2"
                  :width="stepMarkerHitSize(row, step)"
                  :height="stepMarkerHitSize(row, step)"
                  fill="transparent"
                  @pointerenter="showStepMarker($event, row, step)"
                  @pointerleave="hideStepMarker"
                >
                  <title>{{ stepMarkerTitleText(stepsOnSameDate(row, step)) }}</title>
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
            </svg>

            <svg
              v-if="edgeArrows.length > 0"
              class="rollout-timeline__edge-arrows"
              :width="viewportWidth"
              :height="chartHeight"
              :style="{ left: `${scrollLeft}px` }"
            >
              <g
                v-for="arrow in edgeArrows"
                :key="arrow.key"
              >
                <polygon
                  :points="arrowPoints(arrow)"
                  :class="arrow.colorClass"
                  class="pointer-events-none"
                />
                <rect
                  class="rollout-timeline__edge-arrow"
                  :x="arrow.hitX"
                  :y="arrow.hitY"
                  :width="arrow.hitSize"
                  :height="arrow.hitSize"
                  fill="transparent"
                  role="button"
                  :aria-label="arrow.step.title"
                  @pointerdown="onEdgeArrowPointerDown"
                  @pointerenter="showStepMarker($event, arrow.row, arrow.step)"
                  @pointerleave="hideStepMarker"
                  @click="onEdgeArrowClick(arrow)"
                >
                  <title>{{ stepMarkerTitleText(stepsOnSameDate(arrow.row, arrow.step)) }}</title>
                </rect>
              </g>
            </svg>

            <div
              v-if="activeStepMarker"
              class="rollout-timeline__tooltip fixed bg-white border border-gray-300 rounded text-xs px-10 py-5 shadow-md"
              :style="{ left: `${activeStepMarker.left}px`, top: `${activeStepMarker.top}px` }"
            >
              <div
                v-for="(item, index) in activeStepMarker.items"
                :key="item.key"
                :class="{ 'mt-5': index > 0 }"
              >
                <strong>{{ item.title }}</strong>
                <div>{{ formatHoverDate(new Date(item.date)) }}</div>
              </div>
            </div>
          </div>

          <div class="rollout-timeline__status flex-shrink-0 w-100 sm:w-140 pl-10">
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
                  :class="item.row.currentStepChipClass"
                  :title="item.row.currentStepTitle"
                >
                  {{ item.row.currentStepTitle }}
                </span>
              </div>
            </template>
          </div>
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
  cursor: grab;
}

.rollout-timeline__axis-track {
  display: block;
  pointer-events: none;
}

.rollout-timeline__scroll--dragging {
  cursor: grabbing;
  user-select: none;
}

.rollout-timeline__tooltip {
  transform: translate(-50%, -130%);
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.rollout-timeline__edge-arrows {
  position: absolute;
  top: 0;
  pointer-events: none;
  z-index: 5;
}

.rollout-timeline__edge-arrow {
  pointer-events: auto;
  cursor: pointer;
}

.rollout-timeline__step-count-mode-item {
  background: white;
  border: 1px solid var(--color-gray-300, #d1d5db);
  border-radius: 0.25rem;
  padding: 0.15rem 0.5rem;
  color: var(--color-primary-700, #006874);
  cursor: pointer;
}

.rollout-timeline__step-count-mode-item:hover,
.rollout-timeline__step-count-mode-item--selected {
  border-color: var(--color-primary-600, #00838f);
  background: color-mix(in srgb, var(--color-primary-600, #00838f) 8%, white);
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

.rollout-timeline__timenav-item {
  background: white;
  border: 1px solid var(--color-gray-300, #d1d5db);
  border-radius: 0.25rem;
  padding: 0.15rem 0.5rem;
  color: var(--color-primary-700, #006874);
  cursor: pointer;
}

.rollout-timeline__timenav-item:hover {
  border-color: var(--color-primary-600, #00838f);
  background: color-mix(in srgb, var(--color-primary-600, #00838f) 8%, white);
}
</style>
