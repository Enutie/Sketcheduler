<template>
  <div class="warmup-session-container">
    <h2>Drawabox Warm-up Session</h2>

    <div v-if="!isSessionActive && !allAvailableWarmups.length" class="message info">
      <p>Your warm-up pool is currently empty.</p>
      <p>Complete Lesson 1 to add exercises to your warm-up pool.</p>
    </div>

    <div v-if="!isSessionActive && selectedExercises.length" class="selected-exercises-preview">
      <h3>Your Warm-ups for this Session:</h3>
      <ul>
        <li v-for="exercise in selectedExercises" :key="exercise.id">
          <span>{{ exercise.name }}</span>
          <a
            v-if="exercise.examplePageUrl"
            :href="exercise.examplePageUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="example-link"
          >
            (View Example)
          </a>
        </li>
      </ul>
    </div>

    <div class="controls">
      <button
        @click="handleGetOrStartWarmups"
        :disabled="isSessionActive || (!allAvailableWarmups.length && !selectedExercises.length)"
      >
        {{ mainButtonText }}
      </button>
      <button
        v-if="isSessionActive"
        @click="stopWarmupSession(true)" 
        class="stop-button"
      >
        Stop Session Early
      </button>
    </div>

    <div v-if="isSessionActive" class="session-active-display">
      <h3>Now Warming Up ({{ formattedTimeLeft }} remaining):</h3>
      <ul>
        <li v-for="exercise in selectedExercises" :key="exercise.id">
          <span>{{ exercise.name }}</span>
          <a
            v-if="exercise.examplePageUrl"
            :href="exercise.examplePageUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="example-link"
          >
            (View Example)
          </a>
        </li>
      </ul>
      <p class="instruction">
        Do what you can of these exercises in the allotted time.
      </p>
    </div>

    <div v-if="sessionCompleteMessage" class="message completion">
      {{ sessionCompleteMessage }}
    </div>

    <div class="settings">
      <label for="sessionDuration">Session Duration (minutes): </label>
      <select id="sessionDuration" v-model.number="sessionDurationMinutes" :disabled="isSessionActive">
        <option value="1">1 (Test)</option>
        <option value="10">10</option>
        <option value="12">12</option>
        <option value="15">15</option>
      </select>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import allWarmupsData from '/src/data/warmups.json'; 
import type { WarmupExercise } from '/src/types/warmup'; 

const DEFAULT_SESSION_DURATION_MINUTES = 10;
const EXERCISES_TO_PICK_MIN = 2;
const EXERCISES_TO_PICK_MAX = 3;

const allAvailableWarmups = ref<WarmupExercise[]>([]);
const selectedExercises = ref<WarmupExercise[]>([]);
const sessionDurationMinutes = ref<number>(DEFAULT_SESSION_DURATION_MINUTES);
const timeLeftSeconds = ref<number>(sessionDurationMinutes.value * 60);
const isSessionActive = ref<boolean>(false);
const timerId = ref<number | null>(null);
const sessionCompleteMessage = ref<string>('');

const formattedTimeLeft = computed<string>(() => {
  const minutes = Math.floor(timeLeftSeconds.value / 60);
  const seconds = timeLeftSeconds.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const mainButtonText = computed<string>(() => {
  if (isSessionActive.value) {
    return `Session in Progress... (${formattedTimeLeft.value})`;
  }
  if (selectedExercises.value.length > 0) {
    return `Start ${sessionDurationMinutes.value}-Minute Warm-up Session`;
  }
  if (allAvailableWarmups.value.length === 0) {
    return 'No Warm-ups Available';
  }
  return 'Get Warm-up Exercises';
});

onMounted(() => {
  if (allWarmupsData && Array.isArray(allWarmupsData) && allWarmupsData.length > 0) {
    allAvailableWarmups.value = allWarmupsData as WarmupExercise[];
  } else {
    console.warn('Warm-up data is empty, not an array, or not in the expected format.');
    allAvailableWarmups.value = []; 
  }
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
    Math.max(1, 
      Math.floor(Math.random() * (EXERCISES_TO_PICK_MAX - EXERCISES_TO_PICK_MIN + 1)) + EXERCISES_TO_PICK_MIN
    )
  );

  const picked: WarmupExercise[] = [];
  const usedIndices = new Set<number>();

  let attempts = 0;
  const maxAttempts = pool.length * 2;

  while (picked.length < numToPick && usedIndices.size < pool.length && attempts < maxAttempts) {
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
      sessionCompleteMessage.value = `🎉 ${sessionDurationMinutes.value}-minute warm-up session complete! Great job!`;
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
    sessionCompleteMessage.value = 'Warm-up session stopped early.';
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
.warmup-session-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: sans-serif;
  text-align: center;
  background-color: #f9f9f9;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

h3 {
  color: #555;
  margin-top: 20px;
  margin-bottom: 10px;
}

.controls {
  margin: 20px 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #007bff; 
  color: white;
  transition: background-color 0.2s ease-in-out;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button.stop-button {
  background-color: #dc3545; 
}
button.stop-button:hover:not(:disabled) {
  background-color: #c82333;
}

.selected-exercises-preview ul,
.session-active-display ul {
  list-style: none;
  padding: 0;
  margin-bottom: 15px;
}

.selected-exercises-preview li,
.session-active-display li {
  background-color: #e9ecef;
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 4px;
  color: #333;
}

.session-active-display .instruction {
  font-style: italic;
  color: #666;
  margin-top: 15px;
}

.message {
  padding: 15px;
  margin: 20px 0;
  border-radius: 5px;
  text-align: center;
}
.message.info {
  background-color: #e0f7fa; 
  color: #006064; 
  border: 1px solid #b2ebf2;
}
.message.completion {
  background-color: #d4edda; 
  color: #155724; 
  border: 1px solid #c3e6cb;
  font-weight: bold;
}

.settings {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}
.settings label {
  margin-right: 10px;
}
.settings select {
  padding: 5px;
  border-radius: 4px;
}
</style>