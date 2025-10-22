import { sql } from "./db";

const CONSERVATIVE_SESSION_EXPIRY = 30 * 60_000; // 30 minutes

export class SessionExpiredError extends Error {
  constructor(msg: string) {
    super("session expired: " + msg);
  }
}

export type Session = {
  baseURL: string;
  id: string;
};

export async function login(
  baseURL: string,
  username: string,
  password: string
): Promise<Session> {
  // we should get and store session data in the DB so we don't have to requests a session
  const r = await fetch(baseURL + "/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ items: [{ username, password }] }),
  });
  if (r.status === 200) {
    // all good!
    const cookies = r.headers.getSetCookie();
    const sessionID = cookies
      .map((x) => x.startsWith("mis=") && x.slice(4))
      .filter(Boolean)[0];
    if (sessionID) {
      const db = await sql;
      const now = new Date().toISOString();
      await db`
                INSERT INTO arbor_session (id, session, last_used) VALUES (0, ${sessionID}, ${now}) 
                ON CONFLICT DO UPDATE SET session = ${sessionID}, last_used = ${now};
            `;
      return { id: sessionID, baseURL };
    }
  }
  throw new Error("auth unsuccessfull");
}

export async function loginIfNeeded(
  baseURL: string,
  username: string,
  password: string
): Promise<Session> {
  const db = await sql;
  const rows = await db`SELECT * FROM arbor_session WHERE id = 0;`;
  if (rows.length > 0) {
    const { session, last_used } = rows[0];
    // if the session is less than 30mins old assume it is OK
    // the wording on the website says that it has a 45min timeout.
    // IF NOT USED. so we should probably bump the timer every API request...
    if (
      new Date(last_used).getTime() >
      Date.now() - CONSERVATIVE_SESSION_EXPIRY
    ) {
      // assume ok.
      return { id: session, baseURL };
    }
    if (await checkSessionValid(session, baseURL)) {
      return { id: session, baseURL };
    }
    // nope
    await db`DELETE FROM arbor_session WHERE id = 0;`;
  }

  // no session, so we need to login (it will insert)
  return login(baseURL, username, password);
}

async function checkSessionValid(
  sessionID: string,
  baseURL: string
): Promise<boolean> {
  try {
    const res = await fetch(
      baseURL + "/guardians/home-ui/dashboard?format=javascript",
      {
        headers: {
          cookie: "mis=" + sessionID,
        },
      }
    );
    return res.ok;
  } catch (e) {}
  return false;
}
