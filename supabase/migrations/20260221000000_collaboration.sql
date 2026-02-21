/*
  Collaboration Feature Migration
  - itinerary_collaborators: tracks who can access a shared itinerary
  - activity_votes: per-user vote on each activity
  - Extended RLS so collaborators can read (editors can write) shared data
*/

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Tables
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS itinerary_collaborators (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id   uuid REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  -- NULL until the invitee claims the invite after signing up
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email          text NOT NULL,
  role           text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  -- unique token used in the deep-link invite URL
  invite_token   uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_at     timestamptz DEFAULT now() NOT NULL,
  joined_at      timestamptz
);

CREATE TABLE IF NOT EXISTS activity_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote        smallint NOT NULL CHECK (vote IN (1, -1)),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (activity_id, user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Indexes
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_collab_itinerary  ON itinerary_collaborators(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_collab_user        ON itinerary_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_token       ON itinerary_collaborators(invite_token);
CREATE INDEX IF NOT EXISTS idx_votes_activity     ON activity_votes(activity_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE itinerary_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_votes          ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an accepted collaborator on this itinerary?
CREATE OR REPLACE FUNCTION is_collaborator(itin_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM itinerary_collaborators
    WHERE itinerary_id = itin_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$;

-- Helper: is the current user an accepted editor on this itinerary?
CREATE OR REPLACE FUNCTION is_editor(itin_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM itinerary_collaborators
    WHERE itinerary_id = itin_id
      AND user_id = auth.uid()
      AND status = 'accepted'
      AND role = 'editor'
  );
$$;

-- ── itinerary_collaborators policies ────────────────────────────────────────

-- Owner can manage collaborators on their itineraries
CREATE POLICY "Owner manages collaborators"
  ON itinerary_collaborators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
        AND itineraries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
        AND itineraries.user_id = auth.uid()
    )
  );

-- Collaborators can read their own row (to see invite status)
CREATE POLICY "Collaborator views own row"
  ON itinerary_collaborators FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Collaborator can update their own row (to accept/decline invite)
CREATE POLICY "Collaborator updates own row"
  ON itinerary_collaborators FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Extended itineraries policies for collaborators ──────────────────────────

-- Allow accepted collaborators to SELECT shared itineraries
CREATE POLICY "Collaborators can view shared itineraries"
  ON itineraries FOR SELECT
  TO authenticated
  USING (is_collaborator(id));

-- ── Extended itinerary_days policies for collaborators ───────────────────────

CREATE POLICY "Collaborators can view shared days"
  ON itinerary_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_days.itinerary_id
        AND is_collaborator(itineraries.id)
    )
  );

-- ── Extended activities policies for collaborators ───────────────────────────

CREATE POLICY "Collaborators can view shared activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE itinerary_days.id = activities.day_id
        AND is_collaborator(itineraries.id)
    )
  );

CREATE POLICY "Editors can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE itinerary_days.id = activities.day_id
        AND is_editor(itineraries.id)
    )
  );

CREATE POLICY "Editors can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE itinerary_days.id = activities.day_id
        AND is_editor(itineraries.id)
    )
  );

CREATE POLICY "Editors can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE itinerary_days.id = activities.day_id
        AND is_editor(itineraries.id)
    )
  );

-- ── activity_votes policies ──────────────────────────────────────────────────

-- Anyone in the collaboration (owner or accepted collaborator) can vote
CREATE POLICY "Collaborators can vote"
  ON activity_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM activities
      JOIN itinerary_days ON itinerary_days.id = activities.day_id
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE activities.id = activity_votes.activity_id
        AND (
          itineraries.user_id = auth.uid()
          OR is_collaborator(itineraries.id)
        )
    )
  );

-- Users can update (change) their own vote
CREATE POLICY "Users can update own vote"
  ON activity_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete (remove) their own vote
CREATE POLICY "Users can delete own vote"
  ON activity_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Everyone in collaboration can read votes (so all see tallies)
CREATE POLICY "Collaborators can read votes"
  ON activity_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities
      JOIN itinerary_days ON itinerary_days.id = activities.day_id
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE activities.id = activity_votes.activity_id
        AND (
          itineraries.user_id = auth.uid()
          OR is_collaborator(itineraries.id)
        )
    )
  );
