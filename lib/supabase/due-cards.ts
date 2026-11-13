import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** Cards to review now (due and not suspended). RLS limits the count to the caller's own cards. */
export async function countDueCards(supabase: SupabaseClient<Database>) {
  const { count, error } = await supabase
    .from("srs_cards")
    .select("id", { count: "exact", head: true })
    .eq("suspended", false)
    .lte("due", new Date().toISOString());
  if (error) throw new Error("Could not count due reviews");
  return count ?? 0;
}
