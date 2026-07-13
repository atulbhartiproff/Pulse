from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Track, User
from app.services.analytics_cache import analytics_cache
from app.services.daily_summaries import daily_summary_service
from app.services.spotify import SpotifyRecentlyPlayedItem, spotify_oauth
from app.services.spotify_tokens import spotify_token_refresh_service


class SpotifyHistorySyncService:
    """Imports recently played Spotify tracks into Pulse's event timeline."""

    def sync_user(
        self, session: Session, user: User, now: datetime | None = None
    ) -> int:
        access_token = spotify_token_refresh_service.get_valid_access_token(session, user)
        played_items = spotify_oauth.fetch_recently_played(
            access_token, after=user.last_sync
        )
        tracks = self._new_tracks(session, user, played_items)
        session.add_all(tracks)
        session.flush()
        for played_date in {track.played_at.date() for track in tracks}:
            daily_summary_service.upsert_for_date(session, user, played_date)
        user.last_sync = now or datetime.now(UTC)
        session.add(user)
        session.commit()
        analytics_cache.invalidate_user(user.id)
        return len(tracks)

    def _new_tracks(
        self,
        session: Session,
        user: User,
        played_items: list[SpotifyRecentlyPlayedItem],
    ) -> list[Track]:
        incoming_keys = {
            (item.track.id, item.played_at)
            for item in played_items
            if item.track.id
        }
        if not incoming_keys:
            return []

        spotify_track_ids = [key[0] for key in incoming_keys]
        played_at_values = [key[1] for key in incoming_keys]
        existing_keys = set(
            session.exec(
                select(Track.spotify_track_id, Track.played_at).where(
                    Track.user_id == user.id,
                    Track.spotify_track_id.in_(spotify_track_ids),
                    Track.played_at.in_(played_at_values),
                )
            ).all()
        )
        new_tracks = []
        for item in played_items:
            item_key = (item.track.id, item.played_at)
            if item_key in existing_keys:
                continue
            new_tracks.append(self._track_from_item(user, item))
            existing_keys.add(item_key)
        return new_tracks

    @staticmethod
    def _track_from_item(user: User, item: SpotifyRecentlyPlayedItem) -> Track:
        return Track(
            spotify_track_id=item.track.id,
            user_id=user.id,
            artist=", ".join(artist.name for artist in item.track.artists),
            album=item.track.album.name,
            track_name=item.track.name,
            duration_ms=item.track.duration_ms,
            played_at=item.played_at,
        )


spotify_history_sync_service = SpotifyHistorySyncService()
