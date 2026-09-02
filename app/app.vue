<script setup lang="ts">
import { withBase } from 'ufo'

const baseURL = useRuntimeConfig().app.baseURL

useHead({
  link: [
    { rel: 'icon', type: 'image/png', href: withBase('/icons/favicon.png', baseURL) },
    { rel: 'stylesheet', href: withBase('/fonts.css', baseURL) },
  ],
})
</script>

<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
