export function consistentStringify(obj: any): string {
  if (Array.isArray(obj)) {
    return "[" + obj.map((x) => consistentStringify(x)).join(",") + "]";
  }
  if (isPlainObject(obj)) {
    const keys = Object.keys(obj) as Array<string>;
    keys.sort(); // <- this is the secret sauce.
    return (
      "{" +
      keys
        .map(
          (k: string) => `${JSON.stringify(k)}: ${consistentStringify(obj[k])}`
        )
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(obj);
}

function isObject(o: any) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

export function isPlainObject(o: any) {
  if (isObject(o) === false) return false;

  // If has modified constructor
  const ctor = o.constructor;
  if (ctor === undefined) return true;

  // If has modified prototype
  const prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty("isPrototypeOf") === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}
