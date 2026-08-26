<script setup lang="ts">
import IconSymbolClose from '@kanton-basel-stadt/designsystem/icons/symbol/close'

export interface PhaseInfoDialogPhase {
  key: string
  title: string
  detailContent: string
}

const props = defineProps<{
  phase: PhaseInfoDialogPhase | null
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogEl = ref<HTMLDialogElement | null>(null)

watch(
  () => props.phase,
  async (phase) => {
    await nextTick()
    if (phase) {
      dialogEl.value?.showModal()
    } else {
      dialogEl.value?.close()
    }
  },
)

function onDialogClick(event: MouseEvent) {
  if (event.target === dialogEl.value) {
    emit('close')
  }
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="phase-info-dialog"
    @click="onDialogClick"
    @close="emit('close')"
  >
    <div v-if="phase" class="phase-info-dialog__content">
      <header class="phase-info-dialog__header">
        <h2 class="font-bold text-lg md:text-xl">{{ phase.title }}</h2>
        <button
          type="button"
          class="phase-info-dialog__close"
          aria-label="Schliessen"
          @click="emit('close')"
        >
          <component :is="IconSymbolClose" aria-hidden="true" class="w-16 h-16" />
        </button>
      </header>
      <div class="ck-content mt-15" v-html="phase.detailContent" />
    </div>
  </dialog>
</template>

<style scoped>
.phase-info-dialog {
  border: none;
  border-radius: var(--radius-large, 12px);
  padding: 0;
  max-width: 480px;
  width: calc(100vw - 40px);
}

.phase-info-dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.phase-info-dialog__content {
  padding: 20px;
}

.phase-info-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.phase-info-dialog__close {
  cursor: pointer;
  background: none;
  border: none;
  padding: 2px;
  flex-shrink: 0;
}
</style>
