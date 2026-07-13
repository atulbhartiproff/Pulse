import uuid
from datetime import UTC, date, datetime

from pydantic import EmailStr
from sqlalchemy import DateTime, Float, Index, Text, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    spotify_id: str | None = Field(default=None, unique=True, index=True, max_length=255)
    spotify_access_token: str | None = Field(default=None, sa_type=Text)
    spotify_refresh_token: str | None = Field(default=None, sa_type=Text)
    spotify_token_expires_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    last_sync: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list[Item] = Relationship(back_populates="owner", cascade_delete=True)
    tracks: list[Track] = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class SpotifyConnectionStatus(SQLModel):
    connected: bool
    spotify_id: str | None = None
    last_sync: datetime | None = None


class SpotifyAuthorizeUrl(SQLModel):
    success: bool
    authorization_url: str


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


class Track(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "spotify_track_id",
            "played_at",
            name="uq_track_user_spotify_track_played_at",
        ),
        Index("ix_track_user_played_at", "user_id", "played_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    spotify_track_id: str = Field(index=True, max_length=255)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    artist: str = Field(max_length=1000)
    album: str = Field(max_length=1000)
    track_name: str = Field(max_length=1000)
    duration_ms: int
    played_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    user: User | None = Relationship(back_populates="tracks")


class TrackAnalysis(SQLModel, table=True):
    track_id: uuid.UUID = Field(
        foreign_key="track.id", primary_key=True, ondelete="CASCADE"
    )
    mood: str = Field(max_length=50)
    energy: float = Field(sa_type=Float)
    valence: float = Field(sa_type=Float)
    danceability: float = Field(sa_type=Float)
    tempo: float = Field(sa_type=Float)
    confidence: float = Field(sa_type=Float)
    track: Track | None = Relationship()


class DailySummary(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_summary_user_date"),
        Index("ix_daily_summary_user_date", "user_id", "date"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    date: date
    total_minutes: float = Field(default=0)
    happy_minutes: float = Field(default=0)
    sad_minutes: float = Field(default=0)
    calm_minutes: float = Field(default=0)
    energetic_minutes: float = Field(default=0)
    dominant_mood: str = Field(default="unclassified", max_length=50)
    ai_summary: str | None = Field(default=None)


class DailySummaryPublic(SQLModel):
    date: date
    total_minutes: float
    happy_minutes: float
    sad_minutes: float
    calm_minutes: float
    energetic_minutes: float
    dominant_mood: str
    ai_summary: str | None


class ListeningRank(SQLModel):
    name: str
    play_count: int


class TrackHistoryPublic(SQLModel):
    id: uuid.UUID
    spotify_track_id: str
    artist: str
    album: str
    track_name: str
    duration_ms: int
    played_at: datetime


class AnalyticsDashboard(SQLModel):
    today: DailySummaryPublic | None
    weekly_trend: list[DailySummaryPublic]
    monthly_trend: list[DailySummaryPublic]
    top_artist: ListeningRank | None
    top_song: ListeningRank | None
    latest_ai_insight: str | None


class DailyHistoryPublic(SQLModel):
    summary: DailySummaryPublic | None
    tracks: list[TrackHistoryPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
