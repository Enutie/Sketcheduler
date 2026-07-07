export interface Exercise {
  id: number;
  name: string;
  examplePageUrl?: string;
}

/** A Drawabox lesson or challenge whose completion feeds the warm-up pool. */
export interface Milestone {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface WarmupsData {
  milestones: Milestone[];
}
