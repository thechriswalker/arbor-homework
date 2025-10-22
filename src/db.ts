import { SQL } from "bun";

const db = new SQL("sqlite://arbor.sqlitedb");

let initDeferral = Promise.withResolvers<SQL>();

init(null);

function init(err: Error | null) {
  if (err !== null) {
    initDeferral.reject(err);
    return;
  }
  // create base tables if needed.
  createInitialTables().then(
    () => {
      initDeferral.resolve(db);
    },
    (e) => {
      initDeferral.reject(e);
    }
  );
}

async function createInitialTables() {
  // api_cache stores responses for api calls
  // so I don't hammer the API. I can force an update
  // but by default all requests will check the table first
  // and make the request after checking expiry
  await db`
        CREATE TABLE IF NOT EXISTS api_cache (
            id TEXT PRIMARY_KEY NOT NULL,
            requested_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            status INTEGER NOT NULL,
            response TEXT NOT NULL
        );
    `;
  await db`
        CREATE TABLE IF NOT EXISTS arbor_session (
            id INT PRIMARY KEY NOT NULL,
            session TEXT NOT NULL,
            last_used DATETIME NOT NULL
        );
    `;
}

export const sql = initDeferral.promise;
