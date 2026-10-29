import { redirect } from "next/navigation";

export const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const list = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);
export const int = (fd: FormData, k: string, d = 0) => {
  const n = parseInt(s(fd, k).replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : d;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";

/** Only allow same-site relative redirects. */
export const safeNext = (n: string, fallback = "/") => (n.startsWith("/") && !n.startsWith("//") ? n : fallback);

/** Redirect back with an error message; keeps any #anchor after the query string. */
export const withParam = (path: string, key: string, value: string) => {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
};

export const fail = (path: string, msg: string): never => {
  redirect(withParam(path, "error", msg));
};
