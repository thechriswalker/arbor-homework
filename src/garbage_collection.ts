// this is a function that will run infreqently to remove old cache entries.

import { sql } from "./db";

// it runs on
let lastRun = 0;
const GC_INTERVAL = 86400_000 * 7; // 1 week
export function maybeTriggerGarbageCollection() {
  if (Date.now() - lastRun > GC_INTERVAL) {
    runGC().catch((err) => console.error(err));
  }
}

async function runGC(): Promise<void> {
  const db = await sql;
  await db`
        DELETE FROM api_cache WHERE expires_at < ${new Date().toISOString()}
    `;
}
