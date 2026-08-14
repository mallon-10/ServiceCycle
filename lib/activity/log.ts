import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database.types";

type SubjectType = "customer" | "asset" | "opportunity" | "service";

/**
 * Records one timeline entry. Also doubles as the automation audit trail —
 * automation-triggered entries use an `auto_`-prefixed eventType by
 * convention, filterable without a second table (see 0014_activity_log.sql).
 * Never throws: a failed log write shouldn't roll back the actual mutation.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  params: {
    tenantId: string;
    subjectType: SubjectType;
    subjectId: string;
    eventType: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("activity_log").insert({
      tenant_id: params.tenantId,
      subject_type: params.subjectType,
      subject_id: params.subjectId,
      event_type: params.eventType,
      description: params.description,
      metadata: (params.metadata ?? {}) as Json,
    });
  } catch {
    // Best-effort — a logging failure must never block the primary action.
  }
}
