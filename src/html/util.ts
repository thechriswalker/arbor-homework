type ClassDef = string | Record<string, boolean>;

export function cx(...classes: Array<ClassDef>): string {
  const c = classes.flatMap((cc) => {
    if (typeof cc == "string") {
      return [cc];
    }
    return Object.entries(cc).flatMap(([k, v]) => {
      if (v) {
        return [k];
      }
      return [];
    });
  });

  return c.filter(Boolean).join(" ");
}

export function getTabState(key: string): string {
  const params = new URLSearchParams(location.search);
  return params.get("tab_" + key) || "";
}

export function setTabState(key: string, v: string) {
  const u = new URL(location.href);
  const params = u.searchParams;
  if (v) {
    params.set("tab_" + key, v);
  } else {
    params.delete("tab_" + key);
  }
  const href = u.href;
  if (href !== location.href) {
    history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate", {}));
  }
}

export function withTabState(url: string): string {
  const u = new URL(url, location.href);
  new URLSearchParams(location.search)
    .entries()
    .filter(([k]) => k.startsWith("tab_"))
    .forEach(([k, v]) => {
      u.searchParams.set(k, v);
    });

  return u.href;
}
