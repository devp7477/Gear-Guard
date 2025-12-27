import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; search?: string }> | { stage?: string; search?: string }
}) {
  // Handle both Promise and direct object (for compatibility)
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  
  const supabase = await createClient()

  // Build query with filters
  let requestsQuery = supabase
    .from("maintenance_requests")
    .select(`
      *,
      equipment:equipment_id(equipment_name),
      assigned_technician:profiles!maintenance_requests_assigned_technician_id_fkey(full_name),
      requested_by_profile:profiles!maintenance_requests_created_by_id_fkey(full_name),
      assigned_team_info:maintenance_teams!maintenance_requests_maintenance_team_id_fkey(name)
    `)

  // Apply stage filter if provided
  if (params.stage && params.stage !== "all") {
    requestsQuery = requestsQuery.eq("stage", params.stage)
  }

  // Apply search filter if provided
  if (params.search) {
    requestsQuery = requestsQuery.or(
      `subject.ilike.%${params.search}%,description.ilike.%${params.search}%`
    )
  }

  const [{ data: equipment }, { data: requests, error: requestsError }, { data: profiles }] = await Promise.all([
    supabase.from("equipment").select("*"),
    requestsQuery.order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("*"),
  ])

  if (requestsError) {
    console.error("Error fetching requests:", requestsError)
  }

  // Critical Equipment (status = 'faulty' or health < 50)
  const criticalEquipment =
    equipment?.filter((e) => e.status === "faulty" || (e.health_percentage && e.health_percentage < 50)).length || 0

  // Technician Load (assuming 8 hour workday per technician)
  const totalTechnicians = profiles?.length || 1
  const totalHoursScheduled = requests?.reduce((sum, r) => sum + (r.duration_hours || 0), 0) || 0
  const technicianUtilization = Math.min(Math.round((totalHoursScheduled / (totalTechnicians * 8)) * 100), 100)

  // Open Requests (new + in_progress) and overdue - calculate from ALL requests, not filtered
  const { data: allRequests } = await supabase
    .from("maintenance_requests")
    .select("stage, scheduled_date")
    .limit(1000)
  
  const openRequests = allRequests?.filter((r) => r.stage === "new" || r.stage === "in_progress").length || 0
  const overdueRequests =
    allRequests?.filter((r) => {
      if (!r.scheduled_date) return false
      return new Date(r.scheduled_date) < new Date() && r.stage !== "repaired" && r.stage !== "scrap"
    }).length || 0

  const statusColors = {
    new: "bg-yellow-100 text-yellow-800 border-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    repaired: "bg-green-100 text-green-800 border-green-200",
    scrap: "bg-gray-100 text-gray-800 border-gray-200",
  }

  const statusLabels = {
    new: "New",
    in_progress: "In Progress",
    repaired: "Repaired",
    scrap: "Scrap",
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-6">
          {/* Critical Equipment (Red) */}
          <div className="w-64 rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-2xl font-bold text-red-900">{criticalEquipment} Units</p>
            <p className="mt-1 text-sm font-medium text-red-700">Critical Equipment</p>
            <p className="mt-1 text-xs text-red-600">Needs Maintenance</p>
          </div>

          {/* Technician Load (Blue) */}
          <div className="w-64 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 text-center">
            <p className="text-2xl font-bold text-blue-900">{technicianUtilization}% Utilized</p>
            <p className="mt-1 text-sm font-medium text-blue-700">Technician Load</p>
            <p className="mt-1 text-xs text-blue-600">Assign Carefully</p>
          </div>

          {/* Open Requests (Green) */}
          <div className="w-64 rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
            <p className="text-2xl font-bold text-green-900">{openRequests} Pending</p>
            <p className="mt-1 text-sm font-medium text-green-700">Open Requests</p>
            <p className="mt-1 text-xs text-green-600">{overdueRequests} Overdue</p>
          </div>
        </div>
      </div>

      {requestsError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Error loading requests: {requestsError.message}
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Technician</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Equipment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests && requests.length > 0 ? (
              requests.map((request) => (
                <tr key={request.id} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/dashboard/requests/${request.id}`} className="hover:underline">
                      {request.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{request.requested_by_profile?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{request.assigned_technician?.full_name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        request.priority === "high" || request.priority === "critical"
                          ? "bg-red-100 text-red-700"
                          : request.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {request.priority || "low"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[request.stage as keyof typeof statusColors]}>
                      {statusLabels[request.stage as keyof typeof statusLabels] || request.stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{request.equipment?.equipment_name || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {params.stage || params.search
                    ? `No maintenance requests found matching your filters.${params.stage ? ` (Filter: ${params.stage})` : ""}`
                    : "No maintenance requests found. Click \"New\" to create your first request."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
