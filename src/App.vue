<script setup lang="ts">
import SiteBanner from './components/SiteBanner.vue'
import SiteFooter from './components/SiteFooter.vue'
import WarmupSession from './components/WarmupSession.vue'
</script>

<template>
  <SiteBanner />
  <main class="shell">
    <WarmupSession />
  </main>
  <SiteFooter />
</template>
