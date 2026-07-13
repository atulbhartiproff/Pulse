export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">Pulse - {currentYear}</p>
        <p className="text-xs text-muted-foreground/70">A focused dark workspace</p>
      </div>
    </footer>
  )
}
