import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'
const KEY = 'enutie-theme'

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function detectSystem(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const systemTheme = ref<Theme>(detectSystem())
try {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
    })
} catch {
}

export const themeOverride = ref<Theme | null>(stored())

export const activeTheme = ref<Theme>('light')

// An explicit toggle choice always wins (persisted, site-wide); with no
// choice yet, follow the visitor's OS colour-scheme preference.
watch(
  [themeOverride, systemTheme],
  ([override, system]) => {
    const theme = override ?? system
    activeTheme.value = theme
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : ''
  },
  { immediate: true },
)

export function setTheme(t: Theme) {
  themeOverride.value = t
  try {
    localStorage.setItem(KEY, t)
  } catch {
  }
}

export function toggleTheme() {
  setTheme(activeTheme.value === 'dark' ? 'light' : 'dark')
}
