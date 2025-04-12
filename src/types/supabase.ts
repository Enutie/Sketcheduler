export interface Lesson {
    id: string; 
    created_at: string; 
    name: string;
    date_completed: string | null;
  }
  
  export interface Exercise {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    lesson_id: string;
  }
  
  export interface ExerciseInput {
    name: string;
    description?: string | null; 
  }