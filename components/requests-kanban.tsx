"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"

interface Request {
  id: string
  subject: string
  description: string
  priority: string
  stage: string
  equipment?: { equipment_name: string }
  requested_by?: { full_name: string }
  assigned_to?: { full_name: string }
  created_at: string
}

interface RequestsKanbanProps {
  requests: Request[]
}

const COLUMNS = [
  { id: "new", title: "New", color: "bg-yellow-100 border-yellow-200" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100 border-blue-200" },
  { id: "repaired", title: "Repaired", color: "bg-green-100 border-green-200" },
  { id: "scrap", title: "Scrap", color: "bg-gray-100 border-gray-200" },
]

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

function KanbanCard({ request, dragging }: { request: Request; dragging?: boolean }) {
  return (
    <Link key={request.id} href={`/dashboard/requests/${request.id}`}
      style={dragging ? { opacity: 0.4, cursor: "grabbing" } : {}}
    >
      <Card className={"transition-shadow hover:shadow-md cursor-pointer" + (dragging ? " ring-2 ring-primary" : "") }>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-none line-clamp-2">{request.subject}</h4>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
          {request.equipment && (
            <div className="text-xs text-muted-foreground">
              <ClipboardList className="inline h-3 w-3 mr-1" />
              {request.equipment.equipment_name}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Badge
              variant="outline"
              className={priorityColors[request.priority as keyof typeof priorityColors]}
            >
              {request.priority}
            </Badge>
          </div>
          {request.assigned_to && (
            <div className="text-xs text-muted-foreground">Assigned: {request.assigned_to.full_name}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function SortableKanbanCard({ id, request }: { id: string; request: Request }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard request={request} dragging={isDragging} />
    </div>
  )
}

export function RequestsKanban({ requests }: RequestsKanbanProps) {
  // Build column state from incoming props
  const initialColumns: Record<string, string[]> = {}
  COLUMNS.forEach((col) => {
    initialColumns[col.id] = requests.filter((r) => r.stage === col.id).map((r) => r.id)
  })
  const [columns, setColumns] = useState(initialColumns)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Needed for Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  // Used to get the request object by its id efficiently
  const requestsMap = Object.fromEntries(requests.map((r) => [r.id, r]))

  function handleDragStart(event: any) {
    setActiveId(event.active.id)
  }
  function handleDragEnd(event: any) {
    const { active, over } = event
    setActiveId(null)
    if (!active || !over) return

    // Find the column where the item was dropped
    const originCol = Object.keys(columns).find((col) => columns[col].includes(active.id))
    const destCol = over.id
    if (!originCol || !columns[destCol]) return
    if (originCol === destCol) return

    // Remove from the old column and add to the new one
    const originItems = columns[originCol].filter((id) => id !== active.id)
    const destItems = [active.id, ...columns[destCol]]
    const newColumns = { ...columns, [originCol]: originItems, [destCol]: destItems }
    setColumns(newColumns)

    // Update backend (fire & forget)
    fetch(`/api/requests/${active.id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destCol }),
    })
  }
  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="space-y-4" >
            <div className={`rounded-lg border-2 p-3 ${column.color}`}> 
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">{columns[column.id]?.length || 0}</Badge>
              </div>
            </div>
            <SortableContext id={column.id} items={columns[column.id]} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 min-h-[100px]">
                {columns[column.id]?.length ? (
                  columns[column.id].map((id) => (
                    <SortableKanbanCard key={id} id={id} request={requestsMap[id]} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">No requests</CardContent>
                  </Card>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeId && requestsMap[activeId] ? (
          <KanbanCard request={requestsMap[activeId]} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
