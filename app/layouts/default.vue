<script setup lang="ts">
import LocalNavBar from '~/components/NavBar.vue'
</script>

<template>
  <div>
    <AppHeader />
    <LocalNavBar />
    <main class="container py-30 lg:py-50">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
