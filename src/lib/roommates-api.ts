import { supabase } from "@/integrations/supabase/client";

export interface RoommatePost {
  id: string;
  author_id: string;
  title: string;
  institution_name: string;
  campus_area: string | null;
  budget_max: number;
  gender_preference: "any" | "male" | "female";
  move_in_date: string | null;
  about: string;
  contact: string;
  is_active: boolean;
  created_at: string;
}

export interface RoommatePostInput {
  title: string;
  institution_name: string;
  campus_area?: string;
  budget_max: number;
  gender_preference: "any" | "male" | "female";
  move_in_date?: string;
  about: string;
  contact: string;
}

export async function listRoommatePosts(): Promise<RoommatePost[]> {
  const { data, error } = await supabase
    .from("roommate_posts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as RoommatePost[];
}

export async function createRoommatePost(authorId: string, input: RoommatePostInput) {
  const { error } = await supabase.from("roommate_posts").insert({
    author_id: authorId,
    ...input,
    move_in_date: input.move_in_date || null,
    campus_area: input.campus_area || null,
  });
  if (error) throw error;
}

export async function deleteRoommatePost(id: string) {
  const { error } = await supabase.from("roommate_posts").delete().eq("id", id);
  if (error) throw error;
}
