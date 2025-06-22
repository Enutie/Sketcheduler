<template>
  <div class="warmup-session-container">
    <h2>Drawabox Warm-up Session</h2>

    <!-- Progress Selection -->
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

    <!-- Available Exercises Summary -->
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
  selectedExercises.value = []; // Clear selected exercises when pool changes
  sessionCompleteMessage.value = '';
  saveProgress();
};

onMounted(() => {
  // Load lessons data
  if (warmupsData && (warmupsData as WarmupsData).lessons && Array.isArray((warmupsData as WarmupsData).lessons)) {
    allLessons.value = (warmupsData as WarmupsData).lessons;
  } else {
    console.warn('Warmups data is not in the expected format.');
    allLessons.value = [];
  }
  
  // Load saved progress
  loadProgress();
  
  // Update available warmups based on saved progress
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
.warmup-session-container {
  max-width: 800px;
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

h4 {
  color: #666;
  margin-top: 15px;
  margin-bottom: 8px;
}

.progress-section {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: left;
}

.progress-instruction {
  color: #666;
  margin-bottom: 15px;
  font-style: italic;
}

.progress-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.progress-item label {
  cursor: pointer;
  user-select: none;
}

.available-exercises-summary {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
  text-align: left;
}

.exercises-by-lesson {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-exercises {
  font-size: 0.9em;
}

.lesson-exercises strong {
  color: #333;
  display: block;
  margin-bottom: 3px;
}

.exercise-names {
  color: #666;
  margin-left: 15px;
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

.example-link {
  color: #007bff;
  text-decoration: none;
  margin-left: 8px;
  font-size: 0.9em;
}

.example-link:hover {
  text-decoration: underline;
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