-- Allow users to delete their own login session records.
-- Required for sign-out cleanup, session revocation, and stale session purging.
CREATE POLICY "users_delete_own_login_sessions"
  ON public.user_login_sessions FOR DELETE
  USING (user_id = auth.uid());
