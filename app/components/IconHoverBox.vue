<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
import IconSymbolCircleWarning from '@kanton-basel-stadt/designsystem/icons/symbol/circle-warning'

const props = withDefaults(defineProps<{
  title: string
  titleAddon?: string | null
  body?: string | null
  ariaLabel?: string
}>(), {
  titleAddon: null,
  body: null,
  ariaLabel: undefined,
})

const open = ref(false)

const triggerLabel = computed(() => {
  const base = props.ariaLabel || props.title
  return `${base} – Infos anzeigen`
})

function isTouchLike() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/** On phones/tablets hover is unreliable - click/tap toggles the box. */
function onTriggerClick(event: MouseEvent) {
  if (!isTouchLike()) return
  event.preventDefault()
  open.value = !open.value
}
</script>

<template>
  <HoverCardRoot v-model:open="open" :open-delay="150" :close-delay="100">
    <HoverCardTrigger
      as="button"
      type="button"
      class="inline-flex items-center justify-center p-4 -my-5 rounded-full border border-transparent bg-transparent cursor-pointer transition-colors duration-150 hover:bg-black/5 hover:border-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      :class="open ? 'bg-black/5 border-primary-600' : ''"
      :aria-label="triggerLabel"
      :aria-expanded="open"
      @click="onTriggerClick"
    >
      <IconSymbolCircleWarning
        class="w-20 h-20 text-primary-600 transform rotate-180"
        aria-hidden="true"
      />
    </HoverCardTrigger>

    <HoverCardPortal>
      <HoverCardContent
        side="top"
        :side-offset="6"
        :avoid-collisions="true"
        :collision-padding="8"
        class="z-50 w-[min(360px,calc(100vw-16px))] rounded-large border border-primary-600 bg-green-50 p-15 pr-50 shadow-[0_10px_25px_#BABABA] outline-none"
      >
        <div class="flex flex-wrap items-baseline mr-20">
          <strong class="text-base mr-[6px] text-primary-600">
            {{ title }}
          </strong>
          <span v-if="titleAddon" class="text-sm text-gray-900">({{ titleAddon }})</span>
        </div>

        <div v-if="$slots.body" class="ck-content mt-10 text-sm text-gray-900 hyphens-none">
          <slot name="body" />
        </div>
        <p v-else-if="body" class="mb-0 mt-10 text-sm text-gray-900 hyphens-none">
          {{ body }}
        </p>
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
