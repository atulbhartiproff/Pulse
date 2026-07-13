import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface HistoryErrorStateProps {
  errorMessage: string
  onRetry: () => void
}

export function HistoryErrorState({ errorMessage, onRetry }: HistoryErrorStateProps) {
  return (
    <div className="space-y-6">
      <Alert className="border-red-500/30 bg-red-500/10 text-red-50">
        <AlertTitle>Unable to load history</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      <Button onClick={onRetry} className="w-fit">
        Retry
      </Button>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-3/4 bg-white/10" />
        <Skeleton className="h-5 w-full bg-white/10" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="border-white/10 bg-white/5 text-slate-50">
            <CardHeader className="space-y-3 pb-0">
              <Skeleton className="h-5 w-24 bg-white/10" />
              <Skeleton className="h-8 w-36 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="border-white/10 bg-slate-950/80 text-slate-50">
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-40 bg-white/10" />
              <Skeleton className="h-4 w-56 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
              <Skeleton className="h-14 rounded-2xl bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
