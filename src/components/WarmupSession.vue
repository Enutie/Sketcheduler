<template>
  <div>
    <h1>The warm-up</h1>
    <p class="page-sub">
      Two or three exercises from the Drawabox work you've already done, against
      a timer. Then you go draw.
    </p>

    <!-- ---- the session ---- -->
    <section>
      <div v-if="!allAvailableWarmups.length" class="empty-pool">
        <p>
          The pool is empty. Mark what you've finished under
          <a href="#progress">Progress</a> below — every completed lesson or
          challenge adds its exercises.
        </p>
      </div>

      <template v-else>
        <ul v-if="selectedExercises.length" class="exercise-cards">
          <li
            v-for="exercise in selectedExercises"
            :key="exercise.id"
            class="card banded exercise-card"
          >
            <span class="exercise-name">{{ exercise.name }}</span>
            <a
              v-if="exercise.examplePageUrl"
              :href="exercise.examplePageUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="example-link"
            >
              example →
            </a>
          </li>
        </ul>

        <div v-if="isSessionActive" class="timer-block">
          <span class="timer">{{ formattedTimeLeft }}</span>
          <p class="timer-note">
            do what you can of these in the time — quality of attempt over
            quantity
          </p>
        </div>

        <div class="controls">
          <div class="duration-chips" role="group" aria-label="Session duration">
            <button
              v-for="minutes in DURATION_OPTIONS"
              :key="minutes"
              type="button"
              class="chip"
              :class="{ active: sessionDurationMinutes === minutes }"
              :disabled="isSessionActive"
              @click="sessionDurationMinutes = minutes"
            >
              {{ minutes }} min
            </button>
          </div>

          <button
            v-if="!isSessionActive"
            class="btn btn-primary"
            @click="handleGetOrStartWarmups"
          >
            {{ mainButtonText }}
          </button>
          <button
            v-else
            class="btn btn-secondary"
            @click="stopWarmupSession(true)"
          >
            Stop early
          </button>
        </div>
      </template>

      <p v-if="sessionCompleteMessage" class="completion-message">
        {{ sessionCompleteMessage }}
      </p>
    </section>

    <!-- ---- the pool ---- -->
    <section v-if="allAvailableWarmups.length">
      <div class="section-header">
        <h2>The pool</h2>
        <span class="mono-note"
          >{{ allAvailableWarmups.length }} exercises · fed by your
          progress</span
        >
      </div>
      <ul class="pool-list">
        <li v-for="milestone in completedMilestonesData" :key="milestone.id">
          <strong>{{ milestone.name }}</strong>
          <span class="pool-exercises">{{
            milestone.exercises.map((e) => e.name).join(' · ')
          }}</span>
        </li>
      </ul>
    </section>

    <!-- ---- progress ---- -->
    <section id="progress">
      <div class="section-header">
        <h2>Progress</h2>
        <span class="mono-note">mark what you've actually finished</span>
      </div>
      <div class="milestone-list">
        <label
          v-for="milestone in allMilestones"
          :key="milestone.id"
          class="milestone-item"
          :class="{ checked: completedMilestones.includes(milestone.id) }"
        >
          <input
            type="checkbox"
            v-model="completedMilestones"
            :value="milestone.id"
            @change="updateAvailableWarmups"
          />
          <span>{{ milestone.name }}</span>
          <span class="mono-note"
            >{{ milestone.exercises.length }}
            {{ milestone.exercises.length === 1 ? 'exercise' : 'exercises' }}</span
          >
        </label>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import warmupsData from '../data/warmups.json';
import type { Exercise, Milestone, WarmupsData } from '../types/warmup';

const DURATION_OPTIONS = [10, 12, 15] as const;
const DEFAULT_SESSION_DURATION_MINUTES = 10;
const EXERCISES_TO_PICK_MIN = 2;
const EXERCISES_TO_PICK_MAX = 3;
const PROGRESS_KEY = 'sketcheduler-progress';
const LEGACY_PROGRESS_KEY = 'drawabox-progress';

const allMilestones = ref<Milestone[]>([]);
const completedMilestones = ref<string[]>([]);
const allAvailableWarmups = ref<Exercise[]>([]);
const selectedExercises = ref<Exercise[]>([]);
const sessionDurationMinutes = ref<number>(DEFAULT_SESSION_DURATION_MINUTES);
const timeLeftSeconds = ref<number>(sessionDurationMinutes.value * 60);
const isSessionActive = ref<boolean>(false);
const timerId = ref<number | null>(null);
const sessionCompleteMessage = ref<string>('');

const completedMilestonesData = computed<Milestone[]>(() => {
  return allMilestones.value.filter((milestone) =>
    completedMilestones.value.includes(milestone.id),
  );
});

const formattedTimeLeft = computed<string>(() => {
  const minutes = Math.floor(timeLeftSeconds.value / 60);
  const seconds = timeLeftSeconds.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const mainButtonText = computed<string>(() => {
  if (selectedExercises.value.length > 0) {
    return `Start the ${sessionDurationMinutes.value}-minute session`;
  }
  return 'Pick exercises';
});

const loadProgress = (): void => {
  const saved =
    localStorage.getItem(PROGRESS_KEY) ??
    localStorage.getItem(LEGACY_PROGRESS_KEY);
  if (saved) {
    try {
      completedMilestones.value = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved progress, starting fresh');
      completedMilestones.value = [];
    }
  }
};

const saveProgress = (): void => {
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify(completedMilestones.value),
  );
};

const updateAvailableWarmups = (): void => {
  const availableExercises: Exercise[] = [];

  completedMilestones.value.forEach((milestoneId) => {
    const milestone = allMilestones.value.find((m) => m.id === milestoneId);
    if (milestone) {
      availableExercises.push(...milestone.exercises);
    }
  });

  allAvailableWarmups.value = availableExercises;
  selectedExercises.value = [];
  sessionCompleteMessage.value = '';
  saveProgress();
};

onMounted(() => {
  const data = warmupsData as WarmupsData;
  if (data && Array.isArray(data.milestones)) {
    allMilestones.value = data.milestones;
  } else {
    console.warn('Warmups data is not in the expected format.');
    allMilestones.value = [];
  }

  loadProgress();

  updateAvailableWarmups();

  timeLeftSeconds.value = sessionDurationMinutes.value * 60;
});

onBeforeUnmount(() => {
  stopWarmupSession();
});

watch(sessionDurationMinutes, (newDuration) => {
  if (!isSessionActive.value) {
    timeLeftSeconds.value = newDuration * 60;
  }
});

const pickExercisesForSession = (): void => {
  if (allAvailableWarmups.value.length === 0) {
    selectedExercises.value = [];
    return;
  }

  const pool = [...allAvailableWarmups.value];
  const numToPick = Math.min(
    pool.length,
    Math.max(
      1,
      Math.floor(
        Math.random() * (EXERCISES_TO_PICK_MAX - EXERCISES_TO_PICK_MIN + 1),
      ) + EXERCISES_TO_PICK_MIN,
    ),
  );

  const picked: Exercise[] = [];
  const usedIndices = new Set<number>();

  let attempts = 0;
  const maxAttempts = pool.length * 2;

  while (
    picked.length < numToPick &&
    usedIndices.size < pool.length &&
    attempts < maxAttempts
  ) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    if (!usedIndices.has(randomIndex)) {
      picked.push(pool[randomIndex]);
      usedIndices.add(randomIndex);
    }
    attempts++;
  }
  selectedExercises.value = picked;
  sessionCompleteMessage.value = '';
};

const startWarmupSession = (): void => {
  if (isSessionActive.value || selectedExercises.value.length === 0) return;

  isSessionActive.value = true;
  timeLeftSeconds.value = sessionDurationMinutes.value * 60;
  sessionCompleteMessage.value = '';

  timerId.value = setInterval(() => {
    if (timeLeftSeconds.value > 0) {
      timeLeftSeconds.value--;
    } else {
      stopWarmupSession();
      sessionCompleteMessage.value = 'Session over. Go draw.';
      selectedExercises.value = [];
    }
  }, 1000);
};

const stopWarmupSession = (early: boolean = false): void => {
  if (timerId.value !== null) {
    clearInterval(timerId.value);
    timerId.value = null;
  }
  isSessionActive.value = false;
  if (early) {
    sessionCompleteMessage.value = 'Stopped early — it happens.';
  }
};

const handleGetOrStartWarmups = (): void => {
  if (selectedExercises.value.length === 0) {
    pickExercisesForSession();
  } else {
    startWarmupSession();
  }
};
</script>

<style scoped>
h1 {
  font-weight: 800;
  font-size: clamp(28px, 5.5vw, 32px);
  line-height: 1.1;
}

.page-sub {
  margin: var(--s3) 0 var(--s5);
  max-width: 560px;
  color: var(--muted);
}

/* ---- session ---- */

.empty-pool {
  border: 1px dashed var(--border);
  padding: var(--s4);
  font-size: 15px;
  color: var(--muted);
}

.empty-pool p {
  margin: 0;
}

.empty-pool a {
  color: var(--red-text);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 2px solid var(--red-text);
}

.exercise-cards {
  list-style: none;
  margin: 0 0 var(--s4);
  padding: 0;
  display: grid;
  gap: var(--s3);
}

.exercise-card {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--s2);
}

.exercise-name {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 18px;
  color: var(--text);
}

.example-link {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--red-text);
  text-decoration: none;
}

.example-link:hover {
  color: var(--text);
}

.timer-block {
  margin-bottom: var(--s4);
}

.timer {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: clamp(40px, 9vw, 64px);
  color: var(--text);
  line-height: 1;
}

.timer-note {
  margin: var(--s2) 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--s3) var(--s4);
}

.duration-chips {
  display: flex;
  gap: var(--s2);
}

.completion-message {
  margin: var(--s4) 0 0;
  padding: var(--s3) var(--s4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--red);
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 15px;
  color: var(--text);
}

/* ---- pool ---- */

.pool-list {
  list-style: none;
  margin: var(--s3) 0 0;
  padding: 0;
  display: grid;
  gap: var(--s3);
}

.pool-list li {
  border-bottom: 1px solid var(--border-faint);
  padding-bottom: var(--s3);
}

.pool-list strong {
  display: block;
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
}

.pool-exercises {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  line-height: 1.8;
}

/* ---- progress ---- */

.milestone-list {
  margin-top: var(--s3);
  display: grid;
  gap: var(--s2);
}

.milestone-item {
  display: flex;
  align-items: baseline;
  gap: var(--s2) var(--s3);
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
}

.milestone-item.checked {
  border-left: 4px solid var(--brass);
  padding-left: 13px;
}

.milestone-item input[type='checkbox'] {
  accent-color: var(--red);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  align-self: center;
  cursor: pointer;
}

.milestone-item > span:first-of-type {
  font-family: var(--font-head);
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  flex: 1;
}
</style>
