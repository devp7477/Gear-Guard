"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useState, useEffect, useTransition } from "react"

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
    // Sync search value with URL
    setSearchValue(searchParams.get("search") || "")
  }, [searchParams])

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Requests", href: "/dashboard/requests" },
    { label: "Calendar", href: "/dashboard/calendar" },
    { label: "Equipment", href: "/dashboard/equipment" },
    { label: "Teams", href: "/dashboard/teams" },
  ]

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("stage")
    } else {
      params.set("stage", value)
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
      router.refresh()
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue.trim()) {
      params.set("search", searchValue.trim())
    } else {
      params.delete("search")
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
      router.refresh()
    })
  }

  const currentFilter = searchParams.get("stage") || "all"
  const isDashboard = pathname === "/dashboard"

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center gap-8 px-6">
        {/* Logo & Title */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">G</span>
          </div>
          <h1 className="whitespace-nowrap text-base font-semibold">GearGuard</h1>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Search + Filter + User */}
        <div className="ml-auto flex items-center gap-3">
          {isDashboard && (
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9" 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                disabled={isPending}
              />
            </form>
          )}

          {/* Only show filter on dashboard */}
          {mounted && isDashboard && (
            <Select value={currentFilter} onValueChange={handleFilterChange} disabled={isPending}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="repaired">Repaired</SelectItem>
                <SelectItem value="scrap">Scrap</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* User Button from Clerk */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-9 w-9"
              }
            }}
          />
        </div>
      </div>
    </header>
  )
}
