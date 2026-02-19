-- Geo Intelligence: destination-specific knowledge for itinerary generation.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI.

-- Table: destination_contexts
CREATE TABLE IF NOT EXISTS destination_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  best_areas jsonb NOT NULL DEFAULT '[]',
  average_cost jsonb NOT NULL DEFAULT '{}',
  transport_options jsonb NOT NULL DEFAULT '[]',
  popular_attractions jsonb NOT NULL DEFAULT '[]',
  coordinates jsonb,
  timezone text DEFAULT 'Asia/Kolkata',
  best_season text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (optional; use anon key for read-only from API)
ALTER TABLE destination_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on destination_contexts"
  ON destination_contexts FOR SELECT
  USING (true);

-- Seed: Goa
INSERT INTO destination_contexts (slug, display_name, country, best_areas, average_cost, transport_options, popular_attractions, coordinates, timezone, best_season, tags)
VALUES (
  'goa',
  'Goa',
  'India',
  '[
    {"name": "North Goa", "description": "Baga, Calangute, Anjuna – beaches, nightlife, water sports", "vibe": "vibrant"},
    {"name": "South Goa", "description": "Palolem, Agonda – quieter beaches, resorts", "vibe": "relaxed"},
    {"name": "Panjim & Old Goa", "description": "Heritage, churches, Portuguese architecture", "vibe": "cultural"}
  ]'::jsonb,
  '{"min_per_day": 3000, "max_per_day": 15000, "currency": "INR"}'::jsonb,
  '[
    {"type": "Scooter/Bike rental", "description": "Best for beaches and short hops", "avg_cost": 400},
    {"type": "Taxi/Ola/Uber", "description": "Airport and long distances", "avg_cost": 800},
    {"type": "Local buses", "description": "Budget option between towns", "avg_cost": 50},
    {"type": "Private cab (full day)", "description": "Sightseeing tours", "avg_cost": 2500}
  ]'::jsonb,
  '[
    {"name": "Baga Beach", "type": "beach", "description": "Water sports, shacks, nightlife"},
    {"name": "Dudhsagar Falls", "type": "nature", "description": "Four-tiered waterfall in Western Ghats"},
    {"name": "Basilica of Bom Jesus", "type": "heritage", "description": "UNESCO site, St. Francis Xavier"},
    {"name": "Fort Aguada", "type": "heritage", "description": "Portuguese fort, lighthouse, views"},
    {"name": "Anjuna Flea Market", "type": "shopping", "description": "Wednesday flea market"},
    {"name": "Palolem Beach", "type": "beach", "description": "Crescent beach, calm waters"}
  ]'::jsonb,
  '{"lat": 15.2993, "lng": 74.124}'::jsonb,
  'Asia/Kolkata',
  'November to February',
  ARRAY['beach', 'nightlife', 'heritage', 'relaxation']
) ON CONFLICT (slug) DO UPDATE SET
  best_areas = EXCLUDED.best_areas,
  average_cost = EXCLUDED.average_cost,
  transport_options = EXCLUDED.transport_options,
  popular_attractions = EXCLUDED.popular_attractions,
  updated_at = now();

-- Seed: Manali
INSERT INTO destination_contexts (slug, display_name, country, best_areas, average_cost, transport_options, popular_attractions, coordinates, timezone, best_season, tags)
VALUES (
  'manali',
  'Manali',
  'India',
  '[
    {"name": "Old Manali", "description": "Cafes, hostels, backpacker vibe", "vibe": "chill"},
    {"name": "Mall Road", "description": "Shopping, restaurants, central", "vibe": "touristy"},
    {"name": "Solang Valley", "description": "Adventure sports, snow, day trips", "vibe": "adventure"},
    {"name": "Vashisht", "description": "Hot springs, temples, quiet", "vibe": "peaceful"}
  ]'::jsonb,
  '{"min_per_day": 2500, "max_per_day": 12000, "currency": "INR"}'::jsonb,
  '[
    {"type": "Local taxi", "description": "Within Manali and short trips", "avg_cost": 500},
    {"type": "HRTC buses", "description": "To Rohtang, Solang, Leh", "avg_cost": 200},
    {"type": "Bike rental", "description": "Popular for Rohtang and nearby", "avg_cost": 1200},
    {"type": "Private cab (full day)", "description": "Solang, Rohtang, sightseeing", "avg_cost": 3500}
  ]'::jsonb,
  '[
    {"name": "Rohtang Pass", "type": "nature", "description": "High-altitude pass, snow, views"},
    {"name": "Solang Valley", "type": "adventure", "description": "Paragliding, skiing, zorbing"},
    {"name": "Hadimba Temple", "type": "heritage", "description": "Wooden temple in cedar forest"},
    {"name": "Vashisht Hot Springs", "type": "wellness", "description": "Natural hot water springs"},
    {"name": "Old Manali cafes", "type": "food", "description": "Israeli, continental, live music"},
    {"name": "Great Himalayan National Park", "type": "nature", "description": "UNESCO park, trekking"}
  ]'::jsonb,
  '{"lat": 32.2396, "lng": 77.1887}'::jsonb,
  'Asia/Kolkata',
  'March to June, September to November',
  ARRAY['mountains', 'adventure', 'snow', 'trekking']
) ON CONFLICT (slug) DO UPDATE SET
  best_areas = EXCLUDED.best_areas,
  average_cost = EXCLUDED.average_cost,
  transport_options = EXCLUDED.transport_options,
  popular_attractions = EXCLUDED.popular_attractions,
  updated_at = now();

-- Seed: Jaipur
INSERT INTO destination_contexts (slug, display_name, country, best_areas, average_cost, transport_options, popular_attractions, coordinates, timezone, best_season, tags)
VALUES (
  'jaipur',
  'Jaipur',
  'India',
  '[
    {"name": "MI Road / Bani Park", "description": "Hotels, restaurants, central", "vibe": "convenient"},
    {"name": "C-Scheme", "description": "Upscale cafes, boutiques", "vibe": "modern"},
    {"name": "Pink City (old)", "description": "Markets, Hawa Mahal, bazaars", "vibe": "cultural"},
    {"name": "Amer / Jaigarh", "description": "Near forts, heritage stays", "vibe": "heritage"}
  ]'::jsonb,
  '{"min_per_day": 2500, "max_per_day": 18000, "currency": "INR"}'::jsonb,
  '[
    {"type": "Auto-rickshaw", "description": "Short trips in city", "avg_cost": 100},
    {"type": "Ola/Uber", "description": "Comfortable city travel", "avg_cost": 200},
    {"type": "Taxi (full day)", "description": "Fort circuit, sightseeing", "avg_cost": 2500},
    {"type": "Elephant ride (Amber)", "description": "Up to Amber Fort", "avg_cost": 1100}
  ]'::jsonb,
  '[
    {"name": "Amber Fort", "type": "heritage", "description": "Hill fort, elephant rides, palaces"},
    {"name": "Hawa Mahal", "type": "heritage", "description": "Palace of Winds, facade"},
    {"name": "City Palace", "type": "heritage", "description": "Royal residence, museums"},
    {"name": "Jantar Mantar", "type": "heritage", "description": "Astronomical instruments"},
    {"name": "Johari Bazaar", "type": "shopping", "description": "Jewellery, handicrafts"},
    {"name": "Nahargarh Fort", "type": "heritage", "description": "Views, sunset point"}
  ]'::jsonb,
  '{"lat": 26.9124, "lng": 75.7873}'::jsonb,
  'Asia/Kolkata',
  'October to March',
  ARRAY['heritage', 'palaces', 'shopping', 'culture']
) ON CONFLICT (slug) DO UPDATE SET
  best_areas = EXCLUDED.best_areas,
  average_cost = EXCLUDED.average_cost,
  transport_options = EXCLUDED.transport_options,
  popular_attractions = EXCLUDED.popular_attractions,
  updated_at = now();
