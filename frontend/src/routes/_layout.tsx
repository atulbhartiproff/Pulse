import { Link as RouterLink, Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router"
import { ChevronDown, Clock3, LayoutDashboard, LogOut, Menu, Settings2, Sparkles } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { getInitials } from "@/utils"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

type NavItem = {
  label: string
  to: "/" | "/items" | "/admin" | "/settings"
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "History", to: "/items", icon: Clock3 },
  { label: "Analytics", to: "/admin", icon: Sparkles },
  { label: "Settings", to: "/settings", icon: Settings2 },
]

function Layout() {
  const { user: currentUser, logout } = useAuth()
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Menu />
                    <span className="sr-only">Open navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="border-white/10 bg-slate-950 text-slate-50"
                >
                  <SheetHeader className="space-y-3 border-b border-white/10 px-6 py-6">
                    <SheetTitle className="text-left text-lg tracking-[0.2em] uppercase text-cyan-300">
                      Pulse
                    </SheetTitle>
                    <p className="text-left text-sm text-slate-400">
                      Navigate the workspace
                    </p>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 p-4">
                    {navItems.map((item) => {
                      const isActive = currentPath === item.to

                      return (
                        <SheetClose asChild key={item.label}>
                          <RouterLink
                            to={item.to}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                              isActive
                                ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </RouterLink>
                        </SheetClose>
                      )
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <RouterLink to="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]">
                <span className="text-sm font-semibold tracking-[0.24em] text-cyan-300">
                  P
                </span>
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold tracking-[0.28em] uppercase text-white">
                  Pulse
                </span>
                <span className="text-xs text-slate-400">
                  Analytics workspace
                </span>
              </div>
            </RouterLink>

            <nav className="ml-6 hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = currentPath === item.to

                return (
                  <Button
                    key={item.label}
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-10 rounded-full px-4 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white hover:bg-white/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <RouterLink to={item.to}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </RouterLink>
                  </Button>
                )
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Appearance />
              <Separator orientation="vertical" className="hidden h-8 bg-white/10 md:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-slate-100 hover:bg-white/10"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-cyan-400/20 text-xs font-semibold text-cyan-100">
                        {getInitials(currentUser?.full_name || currentUser?.email || "Pulse")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                      {currentUser?.full_name || currentUser?.email || "Account"}
                    </span>
                    <ChevronDown className="size-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-white/10 bg-slate-950 text-slate-50">
                  <DropdownMenuLabel className="space-y-1 px-3 py-2">
                    <div className="text-sm font-medium text-white">
                      {currentUser?.full_name || "Pulse user"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentUser?.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <RouterLink to="/settings">
                    <DropdownMenuItem className="cursor-pointer gap-2 px-3 py-2 text-slate-200 focus:bg-white/10 focus:text-white">
                      <Settings2 className="size-4" />
                      Settings
                    </DropdownMenuItem>
                  </RouterLink>
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer gap-2 px-3 py-2 text-slate-200 focus:bg-white/10 focus:text-white"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-950/10 backdrop-blur sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
