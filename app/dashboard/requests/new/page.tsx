"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@clerk/nextjs"

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [equipment, setEquipment] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Autofill fields
  const [selectedEquipment, setSelectedEquipment] = useState<string>("none")
  const [selectedTeam, setSelectedTeam] = useState<string>("none")
  const [selectedTech, setSelectedTech] = useState<string>("none")
  // Prefill for calendar
  const [requestType, setRequestType] = useState<string>(searchParams.get("type") || "corrective")
  const [scheduledDate, setScheduledDate] = useState<string>(searchParams.get("schedule") || "")

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const [equipmentRes, teamsRes, usersRes] = await Promise.all([
          supabase.from("equipment").select("id, equipment_name, category, assigned_team_id, default_technician_id").order("equipment_name"),
          supabase.from("maintenance_teams").select("id, name").order("name"),
          supabase.from("profiles").select("id, full_name").order("full_name")
        ])
        
        if (equipmentRes.data) setEquipment(equipmentRes.data)
        if (teamsRes.data) setTeams(teamsRes.data)
        if (usersRes.data) setUsers(usersRes.data)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load data. Please refresh the page.")
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEquipment === "none") {
      setSelectedTeam("none")
      setSelectedTech("none")
      return
    }
    const eq = equipment.find((e) => e.id === selectedEquipment)
    if (eq) {
      setSelectedTeam(eq.assigned_team_id || "none")
      setSelectedTech(eq.default_technician_id || "none")
    }
  }, [selectedEquipment, equipment])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isLoaded || !user) {
      setError("Please wait for authentication to complete.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()
      const eq = equipment.find((e) => e.id === selectedEquipment)
      
      const { error: insertError } = await supabase.from("maintenance_requests").insert({
        subject: formData.get("subject") as string,
        description: formData.get("description") as string,
        equipment_id: selectedEquipment === "none" ? null : selectedEquipment,
        priority: formData.get("priority") as string,
        stage: "new",
        created_by_id: user.id,
        assigned_technician_id: selectedTech === "none" ? null : selectedTech,
        maintenance_team_id: selectedTeam === "none" ? null : selectedTeam,
        scheduled_date: formData.get("scheduled_date") || null,
        duration_hours: formData.get("duration_hours") ? Number.parseFloat(formData.get("duration_hours") as string) : null,
        company: formData.get("company") as string || "My Company",
        request_type: formData.get("request_type") as string,
        category: eq?.category || null,
      })

      if (insertError) {
        console.error("Insert error:", insertError)
        setError(insertError.message || "Failed to create request. Please try again.")
        setLoading(false)
        return
      }

      router.push("/dashboard/requests")
    } catch (err: any) {
      console.error("Error creating request:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Maintenance Request</h1>
          <p className="text-muted-foreground">Create a new maintenance work order</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" name="subject" required placeholder="Brief description of the issue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" required placeholder="Detailed description..." rows={4} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input id="company" name="company" required placeholder="Company name" defaultValue="My Company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request_type">Request Type *</Label>
                <Select name="request_type" value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger id="request_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment</Label>
              <Select
                name="equipment_id"
                value={selectedEquipment}
                onValueChange={setSelectedEquipment}
              >
                <SelectTrigger id="equipment_id">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No equipment</SelectItem>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.equipment_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assigned_technician_id">Assign to Technician</Label>
                <Select
                  name="assigned_technician_id"
                  value={selectedTech}
                  onValueChange={setSelectedTech}
                >
                  <SelectTrigger id="assigned_technician_id">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_team_id">Assign to Team</Label>
                <Select
                  name="maintenance_team_id"
                  value={selectedTeam}
                  onValueChange={setSelectedTeam}
                >
                  <SelectTrigger id="maintenance_team_id">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input id="scheduled_date" name="scheduled_date" type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duration (Hours)</Label>
                <Input id="duration_hours" name="duration_hours" type="number" step="0.5" placeholder="e.g., 2.5" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Request"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
