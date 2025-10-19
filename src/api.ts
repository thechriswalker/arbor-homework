import { sql } from "./db";
import { Session, SessionExpiredError } from "./login";

const DEFAULT_CACHE_DURATION = 1 * 3600_000; // 1 hour

export function createAPIFunction<P, T>(
  endpoint: (p: P) => string,
  parser: (resp: any) => T,
  cacheDuration: number = DEFAULT_CACHE_DURATION
) {
  return async function (
    s: Session,
    params: P,
    force: boolean = false
  ): Promise<T> {
    const url = endpoint(params);
    // check DB
    const db = await sql;
    const tooOld = new Date(Date.now() - cacheDuration).toISOString();
    const rows = await db<Array<{ response: string }>>`
            SELECT response FROM api_cache WHERE id = ${url}${
      force ? db`` : db` AND requested_at > ${tooOld}`
    };
        `;
    if (rows.length === 1) {
      // use cache.
      //console.warn("API: using cache: ", url)
      return parser(JSON.parse(rows[0].response));
    }
    // make request
    //console.warn("API: making request: ", url)

    const req = await fetch(s.baseURL + url, {
      method: "GET",
      headers: {
        cookie: "mis=" + s.id,
      },
    });
    if (!req.ok) {
      if (req.status === 401) {
        // login required!
        throw new SessionExpiredError();
      }
      throw new Error(
        "bad status: " + endpoint + "[status=" + req.status + "]"
      );
    }
    const text = await req.text();
    await db`
            INSERT INTO api_cache (id, status, requested_at, response)
            VALUES (${url}, ${
      req.status
    }, ${new Date().toISOString()}, ${text});
        `;
    await db`
            UPDATE arbor_session SET last_used = ${new Date().toISOString()}
        `;
    return parser(JSON.parse(text));
  };
}
