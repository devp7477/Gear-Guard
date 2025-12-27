import type React from "react"
import { TopNav } from "@/components/top-nav"
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect("/auth/sign-in")
  }

  // Sync Clerk user with Supabase profiles table
  try {
    const supabase = await createClient()
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clerkUser.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new users
      console.error("Error fetching profile:", fetchError)
    }

    // Create or update profile
    if (!existingProfile) {
      // Create new profile
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress || "",
        full_name: clerkUser.fullName || clerkUser.firstName || "User",
        role: "technician", // Default role
        avatar_url: clerkUser.imageUrl || null,
      }, {
        onConflict: "id"
      })

      if (upsertError) {
        console.error("Error creating user profile:", upsertError.message || upsertError)
      }
    } else {
      // Update existing profile with latest Clerk data
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          email: clerkUser.emailAddresses[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress || existingProfile.email,
          full_name: clerkUser.fullName || clerkUser.firstName || existingProfile.full_name,
          avatar_url: clerkUser.imageUrl || existingProfile.avatar_url,
        })
        .eq("id", clerkUser.id)

      if (updateError) {
        console.error("Error updating user profile:", updateError.message || updateError)
      }
    }
  } catch (error: any) {
    // Don't block the page if profile sync fails
    console.error("Unexpected error syncing profile:", error?.message || error)
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <main className="p-6">{children}</main>
    </div>
  )
}
