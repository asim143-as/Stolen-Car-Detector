"use client"
import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type UserRow = { id: string; email: string; role: string; staff_status: string | null; created_at: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setRole(id: string, role: string) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) })
    load()
  }
  async function setStaffStatus(id: string, staff_status: string) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ staff_status }) })
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Users & roles</h1>

      <Card>
        <CardHeader><CardTitle>{users.length} account{users.length !== 1 && "s"}</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Administration status</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => setRole(u.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {u.role !== "administration" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : u.staff_status === "approved" ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">Pending</Badge>
                          <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => setStaffStatus(u.id, "approved")}><Check className="h-3 w-3" /> Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={() => setStaffStatus(u.id, "rejected")}><X className="h-3 w-3" /> Reject</Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
