import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.cwd(), "data/worker-state.json");

interface WorkerState {
  lastRun: number;
  lastRunHuman?: string;
  lastCloudSync: number;
  lastCloudSyncHuman?: string;
}

export function loadWorkerState(): WorkerState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("⚠️ Could not load state file, starting fresh:", e);
  }
  return { lastRun: 0, lastCloudSync: 0 };
}

export function saveWorkerState(state: Partial<WorkerState>) {
  try {
    const currentState = loadWorkerState();
    const newState = { ...currentState, ...state };

    // Update human-readable timestamps if the raw timestamps changed
    if (state.lastRun) {
      newState.lastRunHuman = new Date(state.lastRun).toLocaleString();
    }
    if (state.lastCloudSync) {
      newState.lastCloudSyncHuman = new Date(
        state.lastCloudSync,
      ).toLocaleString();
    }

    const stateDir = join(process.cwd(), "data");
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }

    writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
  } catch (e) {
    console.error("⚠️ Failed to save worker state:", e);
  }
}

export function updateLastRun() {
  saveWorkerState({ lastRun: Date.now() });
}

function updateLastCloudSync() {
  saveWorkerState({ lastCloudSync: Date.now() });
}
