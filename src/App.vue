<script setup lang="ts">
import SiteBanner from '@enutie/design/SiteBanner.vue'
import SiteFooter from '@enutie/design/SiteFooter.vue'
import { installSystemThemeSync } from '@enutie/design/theme'
import WarmupSession from './components/WarmupSession.vue'

installSystemThemeSync()
</script>

<template>
  <SiteBanner suffix="/ sketcheduler" />
  <main class="shell">
    <WarmupSession />
  </main>
  <SiteFooter />
</template>
