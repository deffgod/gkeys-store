import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface SidebarItem {
  id: string
  label: string
  path: string
  badge?: string | number
}

export interface UserStats {
  totalGames: number
  totalSaved: number
  daysSinceRegistration: number
}

export interface ProfileSidebarProps {
  userName: string
  userStats?: UserStats
  items: SidebarItem[]
  onLogout?: () => void
  className?: string
  showUserStats?: boolean
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  userName,
  userStats,
  items,
  onLogout,
  className,
  showUserStats = true
}) => {
  const location = useLocation()

  return (
    <aside className={cn("flex flex-col gap-1 min-w-[220px] design-mobile:w-full", className)}>
      {/* User Stats Card */}
      {userStats && showUserStats && (
        <Card className="p-5 mb-6 design-mobile:hidden">
          <h3 className="text-lg font-semibold mb-4 text-design-text">{userName}</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-design-text-secondary">Games Purchased</span>
              <span className="text-sm font-semibold text-design-text">{userStats.totalGames}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-design-text-secondary">Total Saved</span>
              <span className="text-sm font-semibold text-design-primary">€{userStats.totalSaved.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-design-text-secondary">Member for</span>
              <span className="text-sm font-semibold text-design-text">{userStats.daysSinceRegistration} days</span>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-1 design-mobile:flex-row design-mobile:overflow-x-auto design-mobile:gap-2 design-mobile:pb-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center justify-between px-6 py-4 rounded-design-md text-base transition-design-all text-left whitespace-nowrap",
                isActive
                  ? "bg-[#E5E7EB] text-[#1F2937] font-medium"
                  : "text-design-text hover:bg-design-surface/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="default" className="ml-2 text-xs bg-design-primary text-black">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="px-6 py-4 text-base text-left text-design-primary hover:opacity-80 transition-opacity mt-6 design-mobile:mt-4"
        >
          Log Out
        </button>
      )}
    </aside>
  )
}

export default ProfileSidebar
