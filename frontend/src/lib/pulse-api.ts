import { OpenAPI } from "@/client"
import { request } from "@/client/core/request"

export type DailySummary = {
  date: string
  total_minutes: number
  happy_minutes: number
  sad_minutes: number
  calm_minutes: number
  energetic_minutes: number
  dominant_mood: string
  ai_summary: string | null
}

export type ListeningRank = {
  name: string
  play_count: number
}

export type AnalyticsDashboard = {
  today: DailySummary | null
  weekly_trend: DailySummary[]
  monthly_trend: DailySummary[]
  top_artist: ListeningRank | null
  top_song: ListeningRank | null
  latest_ai_insight: string | null
}

export type TrackHistory = {
  id: string
  spotify_track_id: string
  artist: string
  album: string
  track_name: string
  duration_ms: number
  played_at: string
}

export type DailyHistory = {
  summary: DailySummary | null
  tracks: TrackHistory[]
  count: number
}

export type HistoryDay = DailyHistory & {
  date: string
}

export type HistoryFeed = {
  days: HistoryDay[]
  totalDays: number
  totalTracks: number
  totalMinutes: number
  summaryDays: number
}

export type DashboardBundle = {
  dashboard: AnalyticsDashboard
  history: DailyHistory
}

export type SpotifyConnectionStatus = {
  connected: boolean
  spotify_id: string | null
  last_sync: string | null
}

export type SpotifySyncResponse = {
  success: boolean
  tracks_imported: number
  last_sync: string
}

export const getTodayIsoDate = () => new Date().toISOString().slice(0, 10)

export type SpotifyAuthorizeUrlResponse = {
  success: boolean
  authorization_url: string
}

export const fetchSpotifyAuthorizeUrl = async (): Promise<SpotifyAuthorizeUrlResponse> => {
  return request<SpotifyAuthorizeUrlResponse>(OpenAPI, {
    method: "GET",
    url: "/api/v1/spotify/authorize",
  })
}

export const loadDashboardBundle = async (
  summaryDate: string = getTodayIsoDate(),
): Promise<DashboardBundle> => {
  const [dashboard, history] = await Promise.all([
    request<AnalyticsDashboard>(OpenAPI, {
      method: "GET",
      url: "/api/v1/analytics/dashboard",
    }),
    request<DailyHistory>(OpenAPI, {
      method: "GET",
      url: "/api/v1/analytics/history/{summary_date}",
      path: {
        summary_date: summaryDate,
      },
      query: {
        skip: 0,
        limit: 5,
      },
    }),
  ])

  return { dashboard, history }
}

export const loadHistoryFeed = async (
  days = 7,
  endDate = getTodayIsoDate(),
): Promise<HistoryFeed> => {
  const baseDate = new Date(`${endDate}T00:00:00Z`)

  const dayPromises = Array.from({ length: days }, async (_, index) => {
    const currentDate = new Date(baseDate)
    currentDate.setUTCDate(baseDate.getUTCDate() - index)
    const summaryDate = currentDate.toISOString().slice(0, 10)

    const history = await request<DailyHistory>(OpenAPI, {
      method: "GET",
      url: "/api/v1/analytics/history/{summary_date}",
      path: {
        summary_date: summaryDate,
      },
      query: {
        skip: 0,
        limit: 100,
      },
    })

    return {
      ...history,
      date: summaryDate,
    }
  })

  const dayResults = await Promise.all(dayPromises)
  const totalTracks = dayResults.reduce((sum, day) => sum + day.count, 0)
  const totalMinutes = dayResults.reduce(
    (sum, day) => sum + (day.summary?.total_minutes ?? 0),
    0,
  )
  const summaryDays = dayResults.filter((day) => day.summary !== null).length

  return {
    days: dayResults,
    totalDays: dayResults.length,
    totalTracks,
    totalMinutes,
    summaryDays,
  }
}

export const loadSpotifyStatus = async (): Promise<SpotifyConnectionStatus> => {
  return request<SpotifyConnectionStatus>(OpenAPI, {
    method: "GET",
    url: "/api/v1/spotify/status",
  })
}

export const disconnectSpotify = async (): Promise<{ message: string }> => {
  return request<{ message: string }>(OpenAPI, {
    method: "DELETE",
    url: "/api/v1/spotify/connection",
  })
}

export const syncSpotify = async (): Promise<SpotifySyncResponse> => {
  return request<SpotifySyncResponse>(OpenAPI, {
    method: "POST",
    url: "/api/v1/spotify/sync",
  })
}