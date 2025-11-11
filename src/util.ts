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

export function getCurrentWeek() {
  let endDate = new Date();
  // endDate = new Date("2025-11-23T12:00:00Z"); // for testing

  // find next friday and work back to monday.
  while (endDate.getDay() !== 5) {
    // I hate DST and all that crap, so lets do this in 6 hour chunks...
    endDate = new Date(endDate.getTime() + 6 * 3600_000);
  }
  let startDate = endDate;
  while (startDate.getDay() !== 1) {
    startDate = new Date(startDate.getTime() - 6 * 3600_000);
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}
