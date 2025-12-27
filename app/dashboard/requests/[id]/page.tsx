import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MessageSquare, User, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const clerkUser = await currentUser()

  const { data: request } = await supabase
    .from("maintenance_requests")
    .select(
      `
      *,
      equipment:equipment_id(id, equipment_name, category),
      requested_by:profiles!maintenance_requests_created_by_id_fkey(full_name, email),
      assigned_to:profiles!maintenance_requests_assigned_technician_id_fkey(id, full_name, email),
      assigned_team:maintenance_teams(name)
    `,
    )
    .eq("id", id)
    .single()

  if (!request) {
    notFound()
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("maintenance_comments")
    .select("*, user:profiles!maintenance_comments_user_id_fkey(full_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: true })

  async function addComment(formData: FormData) {
    "use server"

    const supabase = await createClient()
    const user = await currentUser()
    const { id: requestId } = await params

    if (!user) return

    const content = formData.get("content") as string

    await supabase.from("maintenance_comments").insert({
      request_id: requestId,
      user_id: user.id,
      comment: content,
    })

    redirect(`/dashboard/requests/${requestId}`)
  }

  async function updateStatus(formData: FormData) {
    "use server"

    const supabase = await createClient()
    const { id: requestId } = await params
    const stage = formData.get("stage") as string

    const updateData: any = { stage }

    if (stage === "repaired") {
      // Update duration if provided
      const duration = formData.get("duration_hours")
      if (duration) {
        updateData.duration_hours = Number.parseFloat(duration as string)
      }
    }

    await supabase.from("maintenance_requests").update(updateData).eq("id", requestId)

    redirect(`/dashboard/requests/${requestId}`)
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  const statusColors = {
    new: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    repaired: "bg-green-100 text-green-800",
    scrap: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{request.subject}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={priorityColors[request.priority as keyof typeof priorityColors]}>
                {request.priority} priority
              </Badge>
              <Badge variant="outline" className={statusColors[request.stage as keyof typeof statusColors]}>
                {request.stage}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description || request.subject}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment list */}
              <div className="space-y-4">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.user?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                )}
              </div>

              {/* Add comment form */}
              <form action={addComment} className="space-y-3 pt-4 border-t">
                <Textarea name="content" placeholder="Add a comment..." required rows={3} />
                <Button type="submit">Add Comment</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateStatus} className="space-y-3">
                <Select name="stage" defaultValue={request.stage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="repaired">Repaired</SelectItem>
                    <SelectItem value="scrap">Scrap</SelectItem>
                  </SelectContent>
                </Select>
                {request.stage === "in_progress" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (Hours)</label>
                    <input
                      type="number"
                      name="duration_hours"
                      step="0.5"
                      placeholder="e.g., 2.5"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Update Status
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.equipment && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Equipment</div>
                  <Link
                    href={`/dashboard/equipment/${request.equipment.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {request.equipment.equipment_name}
                  </Link>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-sm font-medium">Requested By</div>
                <div className="text-sm text-muted-foreground">{request.requested_by?.full_name}</div>
              </div>

              {request.assigned_to && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Assigned To</div>
                  <div className="text-sm text-muted-foreground">{request.assigned_to.full_name}</div>
                </div>
              )}

              {request.assigned_team && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Assigned Team</div>
                  <div className="text-sm text-muted-foreground">{request.assigned_team.name}</div>
                </div>
              )}

              {request.scheduled_date && (
                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Scheduled Date
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(request.scheduled_date).toLocaleString()}
                  </div>
                </div>
              )}

              {request.duration_hours && (
                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <div className="text-sm text-muted-foreground">{request.duration_hours} hours</div>
                </div>
              )}

              <div className="space-y-1 pt-3 border-t">
                <div className="text-sm font-medium">Request Type</div>
                <div className="text-sm text-muted-foreground capitalize">{request.request_type}</div>
              </div>

              <div className="space-y-1 pt-3 border-t">
                <div className="text-sm font-medium">Created</div>
                <div className="text-sm text-muted-foreground">{new Date(request.created_at).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
