import { supabase } from "@/integrations/supabase/client";

export interface HostelReportInput {
  hostel_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
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
