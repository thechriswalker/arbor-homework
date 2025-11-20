import { sql } from "./db";
import { maybeTriggerGarbageCollection } from "./garbage_collection";
import { type Session, SessionExpiredError } from "./login";
import { consistentStringify } from "./util";

const DEFAULT_CACHE_DURATION = 1 * 3600_000; // 1 hour

type CallOptions = {
  endpoint: string;
  method: string;
  headers: {};
  body: any; // json
};

function forceOpts(opts: CallOptions | string): CallOptions {
  if (typeof opts === "string") {
    return {
      endpoint: opts,
      method: "GET",
      headers: {},
      body: null,
    };
  }
  return opts;
}

function toCacheableKey(key: string, opts: CallOptions) {
  return `${key} ${opts.method} ${opts.endpoint} ${consistentStringify(
    opts.body
  )}`;
}

export function createAPIFunction<P, T>(
  fnkey: string,
  endpoint: (p: P) => CallOptions | string,
  parser: (resp: any) => T,
  cacheDuration: number = DEFAULT_CACHE_DURATION
) {
  return async function (
    s: Session,
    params: P,
    force: boolean = false
  ): Promise<T> {
    const opts = forceOpts(endpoint(params));
    // maybe trigger garbage collection
    maybeTriggerGarbageCollection();
    // check DB
    const db = await sql;
    const cacheKey = toCacheableKey(fnkey, opts);
    const now = new Date();
    if (!force) {
      const expiry = new Date(now.getTime() - cacheDuration);
      console.log("checking expiry", expiry.toISOString());
      const rows = await db<Array<{ response: string }>>`
            SELECT response 
            FROM api_cache 
            WHERE id = ${cacheKey} 
              AND requested_at > ${expiry.toISOString()}
      `;

      if (rows.length === 1) {
        // use cache.
        console.warn("API: using cache: ", cacheKey);
        return parser(JSON.parse(rows[0]!.response));
      }
    }
    // make request
    console.warn("API: making request: ", cacheKey);
    let body: BodyInit | null = null;
    if (opts.body) {
      body =
        typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    }
    const req = await fetch(s.baseURL + opts.endpoint, {
      method: opts.method,
      headers: {
        cookie: "mis=" + s.id,
        ...opts.headers,
      },
      body,
    });
    if (!req.ok) {
      if (req.status === 401) {
        // login required!
        throw new SessionExpiredError(cacheKey);
      }
      throw new Error(
        "bad status: " + endpoint + "[status=" + req.status + "]"
      );
    }
    const text = await req.text();
    await db`
            INSERT INTO api_cache (id, status, requested_at, expires_at, response)
            VALUES (
                ${cacheKey}, 
                ${req.status}, 
                ${now.toISOString()}, 
                ${new Date(now.getTime() + cacheDuration).toISOString()}, 
                ${text}
            );
        `;
    await db`
            UPDATE arbor_session SET last_used = ${new Date().toISOString()}
        `;
    return parser(JSON.parse(text));
  };
}
