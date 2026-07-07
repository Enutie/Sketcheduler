<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import WarmupSession from './components/WarmupSession.vue'

type Theme = 'light' | 'dark'

const THEME_KEY = 'sketcheduler-theme'

const stored = localStorage.getItem(THEME_KEY)
const theme = ref<Theme>(stored === 'dark' ? 'dark' : 'light')

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem(THEME_KEY, theme.value)
})

const toggleTheme = (): void => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header class="banner">
    <div class="banner-brand">
      <a href="https://enutie.com">ENUTIE</a>
      <span class="banner-suffix">/ sketcheduler</span>
    </div>
    <nav class="banner-nav">
      <a href="https://blog.enutie.com">Posts</a>
      <a href="https://enutie.com/games">Games</a>
      <button class="theme-toggle" type="button" @click="toggleTheme">
        {{ theme === 'dark' ? 'daylight' : 'lamplit' }}
      </button>
    </nav>
  </header>
  <div class="brass-band"></div>

  <main class="shell">
    <WarmupSession />
  </main>

  <footer class="site-footer">
    <span>© enutie 2026</span>
    <nav>
      <a href="https://enutie.com">home</a>
      <a href="https://blog.enutie.com">blog</a>
    </nav>
  </footer>
</template>
