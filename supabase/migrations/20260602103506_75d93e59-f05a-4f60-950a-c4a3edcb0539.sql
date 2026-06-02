
-- 1. Bookings: students can only cancel own pending bookings (not approve themselves)
DROP POLICY IF EXISTS "Students can cancel own pending bookings" ON public.bookings;
CREATE POLICY "Students can cancel own pending bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND status = 'pending'::booking_status)
WITH CHECK (student_id = auth.uid() AND status = 'cancelled'::booking_status);

-- 2. Profiles: hide phone from broad SELECT via column-level GRANTs
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, role, institution_type, institution_name, avatar_url, created_at, updated_at, is_verified)
  ON public.profiles TO authenticated;
GRANT SELECT (id, full_name, role, institution_type, institution_name, avatar_url, created_at, updated_at, is_verified)
  ON public.profiles TO anon;

-- Self-access to own full profile (incl. phone)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Phone reveal limited to: self, admin, or counterparty on an approved booking
CREATE OR REPLACE FUNCTION public.get_contact_phone(_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _phone text;
BEGIN
  IF _profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    SELECT phone INTO _phone FROM public.profiles WHERE id = _profile_id;
    RETURN _phone;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.hostels h ON h.id = b.hostel_id
    WHERE b.status = 'approved'::booking_status
      AND (
        (b.student_id = auth.uid() AND h.owner_id = _profile_id)
        OR (h.owner_id = auth.uid() AND b.student_id = _profile_id)
      )
  ) THEN
    SELECT phone INTO _phone FROM public.profiles WHERE id = _profile_id;
    RETURN _phone;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_contact_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contact_phone(uuid) TO authenticated;

-- 3. Roommate posts: contact info is personal — restrict to authenticated viewers
DROP POLICY IF EXISTS "Anyone views active roommate posts" ON public.roommate_posts;
CREATE POLICY "Authenticated view active roommate posts"
ON public.roommate_posts
FOR SELECT
TO authenticated
USING ((is_active = true) OR (auth.uid() = author_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Realtime: lock down broadcast/presence channel access (we rely on postgres_changes,
-- which enforces source-table RLS; deny-all on realtime.messages prevents arbitrary
-- broadcast/presence subscriptions).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- 5. Trigger-only SECURITY DEFINER functions: revoke public/role EXECUTE
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_verification_decision() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_verification_decision() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_verification_decision() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_booking_slot_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_booking_slot_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_booking_slot_change() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_on_booking_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_booking_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_booking_change() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_on_verification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_verification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_verification() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_hostel_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_hostel_rating() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_hostel_rating() FROM authenticated;
