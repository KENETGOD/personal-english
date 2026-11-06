// Route groups are not part of the URL, so the (app) paths are listed here.
const PRIVATE_PREFIXES = ["/settings"];

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
