<script setup lang="ts">
import { ref, reactive } from 'vue';
import { supabase } from '@/services/supabaseClient'; // Adjust path if needed
import type { Lesson, Exercise, ExerciseInput } from '@/types/supabase'; // Adjust path if needed

// --- Component State ---

// Input fields
const lessonName = ref<string>('');
const exercises = reactive<ExerciseInput[]>([
  // Start with one empty exercise row for convenience
  { name: '', description: '' }
]);

// UI Feedback
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const createdLessonId = ref<string | null>(null); // To optionally display the new ID

// --- Functions ---

// Add a new blank exercise input row
const addExerciseInput = () => {
  exercises.push({ name: '', description: '' });
};

// Remove an exercise input row
const removeExerciseInput = (index: number) => {
  if (exercises.length > 1) { // Prevent removing the last one easily
    exercises.splice(index, 1);
  }
};

// Main function to handle the submission
const handleCreateLesson = async () => {
  // Basic validation
  if (!lessonName.value.trim()) {
    error.value = 'Lesson name cannot be empty.';
    return;
  }
  const validExercises = exercises.filter(ex => ex.name.trim());
  if (validExercises.length === 0) {
    error.value = 'At least one exercise with a name is required.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;
  createdLessonId.value = null;

  try {
    // --- Step 1: Insert the new lesson ---
    const lessonToInsert = {
      name: lessonName.value.trim(),
      // Set date_completed to the current time using ISO format
      date_completed: new Date().toISOString(),
    };

    console.log('Inserting lesson:', lessonToInsert);

    // Use .select() to get the inserted row back, including the generated ID
    // Use .single() because we expect only one row returned from inserting one record
    const { data: newLesson, error: lessonError } = await supabase
      .from('lessons')
      .insert(lessonToInsert)
      .select() // Select all columns of the newly inserted row
      .single(); // Expect a single object, not an array

    // --- Error Handling for Lesson Insertion ---
    if (lessonError) {
      console.error('Error inserting lesson:', lessonError);
      throw new Error(`Failed to create lesson: ${lessonError.message}`); // Throw to be caught by outer catch
    }

    if (!newLesson || !newLesson.id) {
      console.error('Lesson insertion succeeded but no data/id returned:', newLesson);
      throw new Error('Failed to retrieve the ID of the newly created lesson.');
    }

    const newLessonId = newLesson.id;
    createdLessonId.value = newLessonId; // Store for potential display
    console.log('Lesson created successfully with ID:', newLessonId);

    // --- Step 2: Prepare and Insert Exercises ---
    const exercisesToInsert = validExercises.map(ex => ({
      name: ex.name.trim(),
      description: ex.description?.trim() || null, // Use null if description is empty/whitespace
      lesson_id: newLessonId, // Link to the newly created lesson
    }));

    console.log('Inserting exercises:', exercisesToInsert);

    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(exercisesToInsert); // Insert the array of exercises

    // --- Error Handling for Exercise Insertion ---
    if (exercisesError) {
      console.error('Error inserting exercises:', exercisesError);
      // NOTE: At this point, the lesson *is* created. You might want more sophisticated
      // error handling here, like attempting to delete the created lesson (rollback),
      // or informing the user that the lesson was created but exercises failed.
      throw new Error(`Lesson created, but failed to add exercises: ${exercisesError.message}`);
    }

    console.log('Exercises created successfully for lesson:', newLessonId);

    // --- Success ---
    successMessage.value = `Successfully created lesson "${lessonName.value}" and ${exercisesToInsert.length} exercise(s)!`;
    // Optionally clear the form
    lessonName.value = '';
    exercises.length = 0; // Clear array
    exercises.push({ name: '', description: '' }); // Add back one empty row

  } catch (err: any) {
    console.error('HandleCreateLesson error:', err);
    // Display the error thrown from the try block
    error.value = err.message || 'An unexpected error occurred.';
    // Ensure any specific error messages from Supabase are shown if possible
    if (err.details) error.value += ` (${err.details})`;

  } finally {
    isLoading.value = false;
  }
};

</script>

<template>
  <div class="lesson-creator">
    <h2>Create New Lesson</h2>

    <form @submit.prevent="handleCreateLesson">
      <!-- Lesson Name Input -->
      <div class="form-group">
        <label for="lessonName">Lesson Name:</label>
        <input
          id="lessonName"
          v-model="lessonName"
          type="text"
          required
          :disabled="isLoading"
        />
      </div>

      <!-- Exercises Input -->
      <h3>Exercises</h3>
      <div
        v-for="(exercise, index) in exercises"
        :key="index"
        class="exercise-group form-group"
      >
        <label :for="'exName' + index">Exercise {{ index + 1 }} Name:</label>
        <input
          :id="'exName' + index"
          v-model="exercise.name"
          type="text"
          required
          :disabled="isLoading"
          placeholder="Exercise Name"
        />

        <label :for="'exDesc' + index">Description (Optional):</label>
        <input
          :id="'exDesc' + index"
          v-model="exercise.description"
          type="text"
          :disabled="isLoading"
          placeholder="Exercise Description"
        />

        <button
          type="button"
          @click="removeExerciseInput(index)"
          :disabled="isLoading || exercises.length <= 1"
          class="button-remove"
          title="Remove Exercise"
        >
          × <!-- Cross symbol -->
        </button>
      </div>

      <button
        type="button"
        @click="addExerciseInput"
        :disabled="isLoading"
        class="button-add"
      >
        + Add Another Exercise
      </button>

      <!-- Submission Button -->
      <div class="form-actions">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating...' : 'Create Lesson and Exercises' }}
        </button>
      </div>
    </form>

    <!-- Feedback Messages -->
    <div v-if="isLoading" class="loading">Working...</div>
    <div v-if="error" class="error-message">
      Error: {{ error }}
    </div>
    <div v-if="successMessage" class="success-message">
      {{ successMessage }} (Lesson ID: {{ createdLessonId }})
    </div>
  </div>
</template>

<style scoped>
.lesson-creator {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2, h3 {
  text-align: center;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box; /* Include padding in width */
}

.exercise-group {
  border: 1px dashed #eee;
  padding: 10px;
  margin-bottom: 10px;
  position: relative; /* For positioning the remove button */
  background-color: #fff;
}

.exercise-group input {
  margin-bottom: 5px; /* Space between name and description */
}

.button-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ffdddd;
  border: 1px solid #ffaaaa;
  color: #c00;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-weight: bold;
  cursor: pointer;
  line-height: 20px; /* Center the cross */
  text-align: center;
}
.button-remove:disabled {
    background-color: #eee;
    border-color: #ddd;
    color: #999;
    cursor: not-allowed;
}
.button-remove:hover:not(:disabled) {
    background-color: #ffcccc;
}


.button-add {
  display: block; /* Make it take its own line */
  margin: 10px 0 20px 0; /* Space around the button */
  padding: 8px 12px;
  cursor: pointer;
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.form-actions button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading,
.error-message,
.success-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.loading {
  color: #555;
  background-color: #eee;
}

.error-message {
  color: #D8000C;
  background-color: #FFD2D2;
  border: 1px solid #D8000C;
}

.success-message {
  color: #4F8A10;
  background-color: #DFF2BF;
  border: 1px solid #4F8A10;
}
</style>