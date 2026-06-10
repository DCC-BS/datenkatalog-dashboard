<script setup lang="ts">
const link = 'https://www.bs.ch'
const aboutLink = 'https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog'
</script>

<template>
  <div class="border-b border-gray-400">
    <header class="page-header grid items-center relative container is-wide">
      <div class="flex items-center relative z-30" style="grid-area: L">
        <BSLogo :href="link" />
      </div>

      <div class="flex gap-10 justify-end" style="grid-area: M">
        <a
          :href="aboutLink"
          target="_blank"
          rel="noopener"
          class="button is-sm is-link"
        >
          Über uns
        </a>
      </div>
    </header>
  </div>
</template>
