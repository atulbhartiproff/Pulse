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

export type DashboardBundle = {
  dashboard: AnalyticsDashboard
  history: DailyHistory
}

export const getTodayIsoDate = () => new Date().toISOString().slice(0, 10)

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