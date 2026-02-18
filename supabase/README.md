# Supabase – Geo Intelligence

## Destination contexts (Geo Service)

The **Geo Intelligence Service** uses the `destination_contexts` table for destination-specific knowledge: best areas, average cost, transport options, popular attractions.

### Setup

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Run the migration: copy and execute the contents of `migrations/20250217000000_destination_contexts.sql`.

This creates the table and seeds **Goa**, **Manali**, and **Jaipur**. The API server uses your existing `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); if set, it will read from this table. If the table is missing or empty, the geo service falls back to built-in static datasets (Goa, Manali, Jaipur, Kerala, Rajasthan).

### Adding more destinations

Insert into `destination_contexts` with columns: `slug`, `display_name`, `country`, `best_areas` (jsonb), `average_cost` (jsonb), `transport_options` (jsonb), `popular_attractions` (jsonb), `coordinates` (jsonb), `timezone`, `best_season`, `tags` (text[]).
