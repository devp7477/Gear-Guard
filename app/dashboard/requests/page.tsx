import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RequestsKanban } from "@/components/requests-kanban"
import { RequestsList } from "@/components/requests-list"

export default async function RequestsPage() {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from("maintenance_requests")
    .select(
      `
      *,
      equipment:equipment_id(equipment_name, category),
      requested_by:profiles!maintenance_requests_created_by_id_fkey(full_name),
      assigned_to:profiles!maintenance_requests_assigned_technician_id_fkey(full_name),
      assigned_team:maintenance_teams(name)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching requests:", error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Requests</h1>
          <p className="text-muted-foreground">Track and manage all maintenance work orders</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Error loading requests: {error.message}
        </div>
      )}

      {/* Tabs for views */}
      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="space-y-0">
          <RequestsKanban requests={requests || []} />
        </TabsContent>
        <TabsContent value="list" className="space-y-0">
          <RequestsList requests={requests || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
