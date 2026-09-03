import { Badge } from "@/components/ui/badge"

const STATUS_MAP: Record<string, { label: string; variant: "warning" | "secondary" | "success" | "destructive" }> = {
  pending: { label: "Pending", variant: "warning" },
  under_review: { label: "Under Review", variant: "secondary" },
  found: { label: "Found", variant: "success" },
  not_found: { label: "Not Found", variant: "destructive" },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}
