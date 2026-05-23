import { supabase } from "@/integrations/supabase/client";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface HostelReportInput {
  hostel_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
}

export interface HostelReportRow {
  id: string;
  hostel_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  hostels: { name: string; slug: string | null } | null;
  reporter: { full_name: string } | null;
}

export async function submitHostelReport(input: HostelReportInput) {
  const { error } = await supabase.from("hostel_reports").insert({
    hostel_id: input.hostel_id,
    reporter_id: input.reporter_id,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error) throw error;
}

export async function listMyReports(reporterId: string) {
  const { data, error } = await supabase
    .from("hostel_reports")
    .select("id, hostel_id, reason, details, status, created_at, hostels(name, slug)")
    .eq("reporter_id", reporterId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminListReports(): Promise<HostelReportRow[]> {
  const { data, error } = await supabase
    .from("hostel_reports")
    .select(
      "id, hostel_id, reporter_id, reason, details, status, admin_notes, created_at, hostels(name, slug), reporter:profiles!hostel_reports_reporter_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false });
  if (error) {
    // Fallback without profile join if FK alias not present
    const { data: d2, error: e2 } = await supabase
      .from("hostel_reports")
      .select("id, hostel_id, reporter_id, reason, details, status, admin_notes, created_at, hostels(name, slug)")
      .order("created_at", { ascending: false });
    if (e2) throw e2;
    return ((d2 ?? []) as any[]).map((r) => ({ ...r, reporter: null })) as HostelReportRow[];
  }
  return (data ?? []) as unknown as HostelReportRow[];
}

export async function adminUpdateReport(id: string, status: ReportStatus, adminNotes?: string) {
  const { error } = await supabase
    .from("hostel_reports")
    .update({ status, admin_notes: adminNotes ?? null })
    .eq("id", id);
  if (error) throw error;
}
