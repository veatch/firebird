-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spotify_playlist_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "total_tracks" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "spotify_track_id" TEXT NOT NULL,
    "track_name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_rankings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "spotify_track_id" TEXT NOT NULL,
    "track_name" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_name" TEXT NOT NULL,
    "popularity_score" DOUBLE PRECISION NOT NULL,
    "years_appeared" INTEGER NOT NULL,
    "total_appearances" INTEGER NOT NULL,
    "average_rank" DOUBLE PRECISION NOT NULL,
    "best_rank" INTEGER NOT NULL,
    "worst_rank" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_spotify_id_key" ON "users"("spotify_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_spotify_playlist_id_key" ON "playlists"("spotify_playlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_user_id_spotify_playlist_id_key" ON "playlists"("user_id", "spotify_playlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlist_id_spotify_track_id_key" ON "playlist_tracks"("playlist_id", "spotify_track_id");

-- CreateIndex
CREATE UNIQUE INDEX "song_rankings_user_id_spotify_track_id_key" ON "song_rankings"("user_id", "spotify_track_id");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_rankings" ADD CONSTRAINT "song_rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
