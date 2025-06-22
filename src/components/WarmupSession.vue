<template>
  <div class="warmup-session-container">
    <h2>Drawabox Warm-up Session</h2>

    <div class="progress-section">
      <h3>Select Your Progress</h3>
      <p class="progress-instruction">Check off the lessons and challenges you've completed:</p>
      <div class="progress-options">
        <div
          v-for="lesson in allLessons"
          :key="lesson.id"
          class="progress-item"
        >
          <input
            type="checkbox"
            :id="lesson.id"
            v-model="completedLessons"
            :value="lesson.id"
            @change="updateAvailableWarmups"
          />
          <label :for="lesson.id">{{ lesson.name }}</label>
        </div>
      </div>
    </div>

    <div v-if="!isSessionActive && !allAvailableWarmups.length" class="message info">
      <p>Your warm-up pool is currently empty.</p>
      <p>Select completed lessons above to add exercises to your warm-up pool.</p>
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

    <div v-if="allAvailableWarmups.length" class="available-exercises-summary">
      <h4>Available Exercises ({{ allAvailableWarmups.length }} total):</h4>
      <div class="exercises-by-lesson">
        <div v-for="lesson in completedLessonsData" :key="lesson.id" class="lesson-exercises">
          <strong>{{ lesson.name }}:</strong>
          <span class="exercise-names">{{ lesson.exercises.map(e => e.name).join(', ') }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import warmupsData from '../data/warmups.json';

interface WarmupExercise {
  id: number;
  name: string;
  examplePageUrl?: string;
}

interface Lesson {
  id: string;
  name: string;
  exercises: WarmupExercise[];
}

interface WarmupsData {
  lessons: Lesson[];
}

const DEFAULT_SESSION_DURATION_MINUTES = 10;
const EXERCISES_TO_PICK_MIN = 2;
const EXERCISES_TO_PICK_MAX = 3;

const allLessons = ref<Lesson[]>([]);
const completedLessons = ref<string[]>([]);
const allAvailableWarmups = ref<WarmupExercise[]>([]);
const selectedExercises = ref<WarmupExercise[]>([]);
const sessionDurationMinutes = ref<number>(DEFAULT_SESSION_DURATION_MINUTES);
const timeLeftSeconds = ref<number>(sessionDurationMinutes.value * 60);
const isSessionActive = ref<boolean>(false);
const timerId = ref<number | null>(null);
const sessionCompleteMessage = ref<string>('');

const completedLessonsData = computed<Lesson[]>(() => {
  return allLessons.value.filter(lesson => completedLessons.value.includes(lesson.id));
});

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

const loadProgress = (): void => {
  const saved = localStorage.getItem('drawabox-progress');
  if (saved) {
    try {
      completedLessons.value = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved progress, starting fresh');
      completedLessons.value = [];
    }
  }
};

const saveProgress = (): void => {
  localStorage.setItem('drawabox-progress', JSON.stringify(completedLessons.value));
};

const updateAvailableWarmups = (): void => {
  const availableExercises: WarmupExercise[] = [];
  
  completedLessons.value.forEach(lessonId => {
    const lesson = allLessons.value.find(l => l.id === lessonId);
    if (lesson) {
      availableExercises.push(...lesson.exercises);
    }
  });
  
  allAvailableWarmups.value = availableExercises;
  selectedExercises.value = []; 
  sessionCompleteMessage.value = '';
  saveProgress();
};

onMounted(() => {
  if (warmupsData && (warmupsData as WarmupsData).lessons && Array.isArray((warmupsData as WarmupsData).lessons)) {
    allLessons.value = (warmupsData as WarmupsData).lessons;
  } else {
    console.warn('Warmups data is not in the expected format.');
    allLessons.value = [];
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

.warmup-session-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f0f2f5; 
  min-height: 100vh;
  color: #333; 
}

h2 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2rem; 
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.025em;
}

h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.25rem; 
  font-weight: 600;
}

h4 {
  color: #555;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem; 
  font-weight: 500;
}

.progress-section,
.selected-exercises-preview,
.session-active-display,
.available-exercises-summary,
.settings {
  background-color: #ffffff; 
  border: 1px solid #e0e0e0; 
  border-radius: 8px; 
  padding: 24px;
  margin-bottom: 24px;
  text-align: left;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); 
}

.progress-instruction {
  color: #555;
  margin-bottom: 16px;
  font-size: 1rem;
  font-weight: 500;
}

.progress-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  background-color: #f9f9f9;
  border: 1px solid #eee;
}

.progress-item:hover {
  background-color: #f0f0f0;
}

.progress-item:has(input:checked) {
  background-color: #10b981; 
  border-color: #059669;
  color: white;
}
.progress-item:has(input:checked) label {
  color: white; 
}


.progress-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
  cursor: pointer;
}

.progress-item label {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: #333; 
}

.available-exercises-summary {
  margin-top: 24px;
}

.exercises-by-lesson {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lesson-exercises {
  font-size: 0.95rem;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #3b82f6;
}

.lesson-exercises strong {
  color: #1f2937;
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.exercise-names {
  color: #555;
  line-height: 1.5;
}

.controls {
  margin: 24px 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

button {
  padding: 12px 24px; 
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: #3b82f6; 
  color: white;
  transition: background-color 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #2563eb; 
}

button:active:not(:disabled) {
  background-color: #1d4ed8; 
}

button:disabled {
  background-color: #adb5bd; 
  cursor: not-allowed;
}

button.stop-button {
  background-color: #ef4444; 
}

button.stop-button:hover:not(:disabled) {
  background-color: #dc2626; 
}

.selected-exercises-preview ul,
.session-active-display ul {
  list-style: none;
  padding: 0;
  margin-bottom: 16px;
  display: grid;
  gap: 10px;
}

.selected-exercises-preview li,
.session-active-display li {
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
  color: #1f2937;
  border-left: 3px solid #10b981; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.example-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 8px;
  background-color: #e7f3ff; 
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.example-link:hover {
  background-color: #d1e7ff;
  color: #1d4ed8;
}

.session-active-display {
  border: 1px solid #10b981; 
}

.session-active-display .instruction {
  font-style: italic;
  color: #047857; 
  margin-top: 16px;
  font-size: 1rem;
  text-align: center;
  background-color: #e6fffa; 
  padding: 12px;
  border-radius: 4px;
}

.message {
  padding: 16px 24px;
  margin: 24px 0;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  font-size: 1rem;
}

.message.info {
  background-color: #e0f2fe; 
  color: #0c5464; 
  border: 1px solid #b3e0f2;
}

.message.completion {
  background-color: #d4edda; 
  color: #155724; 
  border: 1px solid #c3e6cb;
}

.settings {
  text-align: center;
}

.settings label {
  margin-right: 12px;
  font-weight: 500;
  color: #374151;
}

.settings select {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da; 
  background-color: white;
  font-size: 0.95rem;
  font-weight: 500;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.settings select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25); 
}

.settings select:hover {
  border-color: #adb5bd;
}

@media (max-width: 640px) {
  .warmup-session-container {
    padding: 16px;
  }
  
  h2 {
    font-size: 1.75rem; 
    margin-bottom: 24px;
  }
  
  .progress-section,
  .selected-exercises-preview,
  .session-active-display,
  .message,
  .settings {
    padding: 16px;
  }
  
  .progress-options {
    grid-template-columns: 1fr; 
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  button {
    width: 100%;
    max-width: 300px; 
  }
}
</style>