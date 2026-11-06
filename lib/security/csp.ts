type CspOptions = { nonce: string; isDev: boolean; supabaseUrl: string };

/** Builds the Content-Security-Policy (docs/08 section 4.5) for one request. */
export function buildCsp({ nonce, isDev, supabaseUrl }: CspOptions): string {
  const supabase = new URL(supabaseUrl);
  const supabaseWs = `${supabase.protocol === "https:" ? "wss:" : "ws:"}//${supabase.host}`;
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev injects inline styles without a nonce (HMR); production stays strict.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data: blob:",
    `media-src 'self' blob: ${supabase.origin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabase.origin} ${supabaseWs}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
