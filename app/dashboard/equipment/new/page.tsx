import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { currentUser } from "@clerk/nextjs/server"

export default async function NewEquipmentPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect("/auth/sign-in")
  }

  async function createEquipment(formData: FormData) {
    "use server"

    const supabase = await createClient()
    const user = await currentUser()
    if (!user) return

    const equipmentData = {
      equipment_name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      physical_location: formData.get("location") as string,
      serial_number: formData.get("serial_number") as string,
      purchase_date: formData.get("purchase_date") as string || null,
      warranty_details: formData.get("warranty_expiry") as string || null,
      status: (formData.get("status") as string) || "operational",
    }

    const { error } = await supabase.from("equipment").insert(equipmentData)

    if (!error) {
      redirect("/dashboard/equipment")
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/equipment">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Equipment</h1>
          <p className="text-muted-foreground">Create a new equipment record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEquipment} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="e.g., Industrial Chiller #1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" name="category" required placeholder="e.g., HVAC, Electrical" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Equipment description..." rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" required placeholder="e.g., Building A - Floor 2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input id="serial_number" name="serial_number" placeholder="e.g., SN123456" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input id="purchase_date" name="purchase_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input id="warranty_expiry" name="warranty_expiry" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="operational">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="faulty">Faulty</SelectItem>
                  <SelectItem value="scrap">Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Create Equipment
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/equipment">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
