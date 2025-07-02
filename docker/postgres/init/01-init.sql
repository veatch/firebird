-- Firebird Songs Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a dedicated schema for the application (optional but recommended)
CREATE SCHEMA IF NOT EXISTS firebird;

-- Set search path to include our schema
SET search_path TO firebird, public;

-- Create users table for session management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlists table for cached playlist data
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    spotify_playlist_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    year INTEGER,
    track_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, spotify_playlist_id)
);

-- Create song_rankings table for calculated song rankings
CREATE TABLE IF NOT EXISTS song_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artist_name VARCHAR(500) NOT NULL,
    popularity_score FLOAT NOT NULL,
    years_appeared INTEGER[] NOT NULL,
    average_rank FLOAT NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_year ON playlists(year);
CREATE INDEX IF NOT EXISTS idx_song_rankings_user_id ON song_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_song_rankings_popularity ON song_rankings(popularity_score DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON SCHEMA firebird TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA firebird TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA firebird TO postgres;

-- Insert some helpful comments
COMMENT ON TABLE users IS 'Stores user authentication data from Spotify OAuth';
COMMENT ON TABLE playlists IS 'Caches playlist data from Spotify API to reduce API calls';
COMMENT ON TABLE song_rankings IS 'Stores calculated popularity scores for songs across multiple years'; 