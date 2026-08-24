<script setup lang="ts">
const { dashboard } = useAppConfig()

const EXTERNAL_LINK_HINT =
  'Externer Link, wird in einem neuen Tab oder Fenster geöffnet'
</script>

<template>
  <div class="border-b border-gray-400">
    <header class="page-header grid items-center relative container is-wide">
      <div
        class="flex items-center relative z-30"
        style="grid-area: L"
      >
        <BSLogo :href="dashboard?.logoHref || 'https://www.bs.ch'" />
      </div>

      <div
        class="flex gap-10 justify-end"
        style="grid-area: M"
      >
        <a
          :href="dashboard?.aboutLink || 'https://www.bs.ch'"
          target="_blank"
          rel="noopener noreferrer"
          class="button is-sm is-link"
        >
          {{ dashboard?.aboutLabel || 'Über uns' }}
          <span class="sr-only">{{ EXTERNAL_LINK_HINT }}</span>
        </a>
      </div>
    </header>
  </div>
</template>
