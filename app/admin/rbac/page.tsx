"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit2,
  FileText,
  Key,
  Layers,
  Lock,
  Plus,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ---------------------------------------------------------------------------
// Types & Permission Definitions (Matching Module 2 in dbdesign.md)
// ---------------------------------------------------------------------------

export interface PermissionItem {
  id: string
  code: string
  name: string
  description: string
}

export interface PermissionModuleGroup {
  module: string
  label: string
  icon: React.ElementType
  permissions: PermissionItem[]
}

export interface RoleRecord {
  id: string
  name: string
  description: string
  isSystem: boolean
  color: string
  permissions: string[] // array of permission codes
}

export interface StaffUserRecord {
  id: string
  name: string
  email: string
  contactNumber: string
  roleId: string
  isActive: boolean
  lastLoginAt: string | null
}

const PERMISSION_MODULES: PermissionModuleGroup[] = [
  {
    module: "orders",
    label: "POS & Live Orders",
    icon: Utensils,
    permissions: [
      { id: "p-ord-create", code: "orders:create", name: "Create Orders", description: "Take counter orders and dine-in table requests" },
      { id: "p-ord-view", code: "orders:view", name: "View Live Orders", description: "Access live order queues and status boards" },
      { id: "p-ord-pay", code: "orders:settle_payment", name: "Settle Payments", description: "Collect cash, card, and GCash payments" },
      { id: "p-ord-reprint", code: "orders:reprint_receipt", name: "Reprint Receipts", description: "Reprint customer receipts and order stubs" },
    ],
  },
  {
    module: "voids",
    label: "Discounts & Voids",
    icon: ShieldAlert,
    permissions: [
      { id: "p-void-approve", code: "voids:approve", name: "Approve Order Voids", description: "Authorize item cancellations and whole order refunds" },
      { id: "p-disc-senior", code: "discounts:senior_pwd", name: "Apply Senior/PWD Discount", description: "Apply 20% statutory Senior and PWD discounts" },
      { id: "p-disc-custom", code: "discounts:custom", name: "Apply Custom Discounts", description: "Grant promotional, VIP, or manager price overrides" },
    ],
  },
  {
    module: "menu",
    label: "Menu & Categories",
    icon: Layers,
    permissions: [
      { id: "p-menu-view", code: "menu:view", name: "View Menu Items", description: "Browse all food and beverage offerings" },
      { id: "p-menu-edit", code: "menu:manage", name: "Create & Edit Dishes", description: "Modify pricing, recipes, and dish descriptions" },
      { id: "p-menu-avail", code: "menu:toggle_availability", name: "Toggle 86 / Sold Out", description: "Mark ingredients and menu items as unavailable" },
    ],
  },
  {
    module: "inventory",
    label: "Inventory & Stock",
    icon: Building2,
    permissions: [
      { id: "p-inv-view", code: "inventory:view", name: "View Stock Levels", description: "Inspect ingredient inventory and reorder alerts" },
      { id: "p-inv-adjust", code: "inventory:stock_in", name: "Stock In & Restock", description: "Record deliveries and warehouse restocks" },
      { id: "p-inv-waste", code: "inventory:waste", name: "Log Spoilage & Waste", description: "Record kitchen spoilage and expired supplies" },
    ],
  },
  {
    module: "reports",
    label: "Reports & Financials",
    icon: FileText,
    permissions: [
      { id: "p-rep-sales", code: "reports:sales_view", name: "View Sales Analytics", description: "Access revenue, order volume, and sales trends" },
      { id: "p-rep-exp", code: "reports:expenses_manage", name: "Manage Expenses", description: "Create, edit, and delete operational expense records" },
      { id: "p-rep-export", code: "reports:export", name: "Export Financial Reports", description: "Download CSV and Excel summaries for accounting" },
    ],
  },
  {
    module: "employees",
    label: "Staff & RFID Attendance",
    icon: Users,
    permissions: [
      { id: "p-emp-view", code: "employees:view", name: "View Staff Profiles", description: "View employee contact and role records" },
      { id: "p-emp-manage", code: "employees:manage", name: "Manage Employees", description: "Hire, update, and manage employee profiles" },
      { id: "p-emp-rfid", code: "employees:rfid_attendance", name: "RFID Time Clock & Override", description: "Monitor RFID taps and adjust manual attendance" },
      { id: "p-emp-payroll", code: "employees:payroll", name: "Process Payroll & Deductions", description: "Compute salary cutoffs, print official payslips" },
    ],
  },
  {
    module: "settings",
    label: "System Settings",
    icon: Lock,
    permissions: [
      { id: "p-set-view", code: "settings:view", name: "View POS Settings", description: "Inspect store profile and printer settings" },
      { id: "p-set-edit", code: "settings:manage", name: "Configure POS & Hardware", description: "Edit tax rates, receipt formatting, and device configs" },
      { id: "p-set-rbac", code: "settings:rbac", name: "Manage Roles & Permissions", description: "Create custom roles and alter permission matrix" },
    ],
  },
]

const ALL_PERMISSION_CODES = PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.code))

const INITIAL_ROLES: RoleRecord[] = [
  {
    id: "role-owner",
    name: "Owner / Administrator",
    description: "Unrestricted master access to all system modules, finances, staff, and hardware settings.",
    isSystem: true,
    color: "#e11d48", // Rose
    permissions: [...ALL_PERMISSION_CODES],
  },
  {
    id: "role-manager",
    name: "Store Manager",
    description: "Supervises live operations, voids, inventory management, shift schedules, and daily reports.",
    isSystem: true,
    color: "#f59e0b", // Amber
    permissions: [
      "orders:create", "orders:view", "orders:settle_payment", "orders:reprint_receipt",
      "voids:approve", "discounts:senior_pwd", "discounts:custom",
      "menu:view", "menu:manage", "menu:toggle_availability",
      "inventory:view", "inventory:stock_in", "inventory:waste",
      "reports:sales_view", "reports:expenses_manage",
      "employees:view", "employees:rfid_attendance",
      "settings:view",
    ],
  },
  {
    id: "role-cashier",
    name: "Head Cashier",
    description: "Handles counter ordering, table assignment, cash/card/GCash settlements, and Senior/PWD discounts.",
    isSystem: true,
    color: "#10b981", // Emerald
    permissions: [
      "orders:create", "orders:view", "orders:settle_payment", "orders:reprint_receipt",
      "discounts:senior_pwd",
      "menu:view", "menu:toggle_availability",
      "employees:rfid_attendance",
    ],
  },
  {
    id: "role-kitchen",
    name: "Kitchen Staff",
    description: "Views KOT tickets, marks order items ready, monitors ingredient stock, and logs kitchen waste.",
    isSystem: true,
    color: "#3b82f6", // Blue
    permissions: [
      "orders:view",
      "menu:view", "menu:toggle_availability",
      "inventory:view", "inventory:waste",
      "employees:rfid_attendance",
    ],
  },
  {
    id: "role-server",
    name: "Dining Server / Waiter",
    description: "Takes customer orders on mobile tablets, checks table availability, and clocks attendance.",
    isSystem: false,
    color: "#8b5cf6", // Purple
    permissions: [
      "orders:create", "orders:view",
      "menu:view",
      "employees:rfid_attendance",
    ],
  },
]

const INITIAL_USERS: StaffUserRecord[] = [
  { id: "usr-1", name: "Admin User", email: "admin@primerestaurant.ph", contactNumber: "+63 917 111 2222", roleId: "role-owner", isActive: true, lastLoginAt: "Just now" },
  { id: "usr-2", name: "Carlos Mendoza", email: "carlos.m@primerestaurant.ph", contactNumber: "+63 918 222 3333", roleId: "role-manager", isActive: true, lastLoginAt: "Today at 10:15 AM" },
  { id: "usr-3", name: "Juan Reyes", email: "juan.r@primerestaurant.ph", contactNumber: "+63 919 333 4444", roleId: "role-cashier", isActive: true, lastLoginAt: "Today at 8:02 AM" },
  { id: "usr-4", name: "Maria Cruz", email: "maria.c@primerestaurant.ph", contactNumber: "+63 920 444 5555", roleId: "role-cashier", isActive: true, lastLoginAt: "Yesterday at 9:30 PM" },
  { id: "usr-5", name: "Lia Santos", email: "lia.s@primerestaurant.ph", contactNumber: "+63 921 555 6666", roleId: "role-kitchen", isActive: true, lastLoginAt: "Today at 7:55 AM" },
  { id: "usr-6", name: "Angelo Santos", email: "angelo.s@primerestaurant.ph", contactNumber: "+63 922 666 7777", roleId: "role-server", isActive: true, lastLoginAt: "Yesterday at 10:00 PM" },
]

export default function RbacPage() {
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES)
  const [users, setUsers] = useState<StaffUserRecord[]>(INITIAL_USERS)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("role-owner")
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles")
  const [searchQuery, setSearchQuery] = useState("")

  // Role dialogs
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [newRoleColor, setNewRoleColor] = useState("#f59e0b")
  const [copyFromRoleId, setCopyFromRoleId] = useState("none")

  // Delete role dialog
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  // Quick user role assignment modal
  const [editingUser, setEditingUser] = useState<StaffUserRecord | null>(null)
  const [assignedRoleForUser, setAssignedRoleForUser] = useState<string>("")

  // Current active role in view
  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0]
  }, [roles, selectedRoleId])

  // Count users per role
  const userCountsByRole = useMemo(() => {
    const counts: Record<string, number> = {}
    users.forEach((u) => {
      counts[u.roleId] = (counts[u.roleId] || 0) + 1
    })
    return counts
  }, [users])

  // Toggle single permission on active role
  const handleTogglePermission = (code: string) => {
    if (activeRole.isSystem && activeRole.id === "role-owner") {
      toast.error("Owner / Administrator role must retain all system permissions")
      return
    }

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role
        const has = role.permissions.includes(code)
        const updatedPermissions = has
          ? role.permissions.filter((p) => p !== code)
          : [...role.permissions, code]
        return { ...role, permissions: updatedPermissions }
      })
    )
    toast.success("Permission updated")
  }

  // Grant all permissions for module
  const handleGrantModule = (group: PermissionModuleGroup) => {
    if (activeRole.isSystem && activeRole.id === "role-owner") return
    const codes = group.permissions.map((p) => p.code)
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role
        const merged = Array.from(new Set([...role.permissions, ...codes]))
        return { ...role, permissions: merged }
      })
    )
    toast.success(`Granted all ${group.label} permissions`)
  }

  // Revoke all permissions for module
  const handleRevokeModule = (group: PermissionModuleGroup) => {
    if (activeRole.isSystem && activeRole.id === "role-owner") return
    const codes = group.permissions.map((p) => p.code)
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role
        const filtered = role.permissions.filter((p) => !codes.includes(p))
        return { ...role, permissions: filtered }
      })
    )
    toast.info(`Revoked all ${group.label} permissions`)
  }

  // Create new custom role
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast.error("Role name is required")
      return
    }

    let initialPermissions: string[] = []
    if (copyFromRoleId !== "none") {
      const source = roles.find((r) => r.id === copyFromRoleId)
      if (source) initialPermissions = [...source.permissions]
    }

    const newRole: RoleRecord = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || "Custom restaurant staff role",
      isSystem: false,
      color: newRoleColor,
      permissions: initialPermissions,
    }

    setRoles((prev) => [...prev, newRole])
    setSelectedRoleId(newRole.id)
    setIsCreateRoleOpen(false)
    setNewRoleName("")
    setNewRoleDesc("")
    setCopyFromRoleId("none")
    toast.success("Custom role created successfully")
  }

  // Delete custom role
  const handleConfirmDeleteRole = () => {
    if (!deletingRoleId) return
    const roleToDelete = roles.find((r) => r.id === deletingRoleId)
    if (roleToDelete?.isSystem) {
      toast.error("System roles cannot be deleted")
      setDeletingRoleId(null)
      return
    }

    // Reassign users of this role to Cashier default
    setUsers((prev) =>
      prev.map((u) => (u.roleId === deletingRoleId ? { ...u, roleId: "role-cashier" } : u))
    )

    setRoles((prev) => prev.filter((r) => r.id !== deletingRoleId))
    setSelectedRoleId("role-owner")
    setDeletingRoleId(null)
    toast.success("Role deleted and assigned users moved to Cashier")
  }

  // Save updated role for user
  const handleSaveUserRole = () => {
    if (!editingUser || !assignedRoleForUser) return
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, roleId: assignedRoleForUser } : u))
    )
    setEditingUser(null)
    toast.success("Staff role updated successfully")
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = [...users]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.contactNumber.toLowerCase().includes(q)
      )
    }
    return list
  }, [users, searchQuery])

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-right" />
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Roles & Access Control</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Manage system roles, granular module permissions, and staff authorization rules.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setIsCreateRoleOpen(true)}
              size="sm"
              className="h-9 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="size-3.5" />
              <span>Create Role</span>
            </Button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "roles" | "users")} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
            <TabsList className="bg-muted/60 p-1 border border-border h-9">
              <TabsTrigger value="roles" className="text-xs py-1.5 gap-1.5">
                <ShieldCheck className="size-3.5" />
                <span>Roles & Permission Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs py-1.5 gap-1.5">
                <Users className="size-3.5" />
                <span>Staff Role Assignments ({users.length})</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "users" && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* TAB 1: ROLES & PERMISSION MATRIX                                */}
          {/* =============================================================== */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Role Picker List (Left Column) */}
              <div className="lg:col-span-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Configured Roles ({roles.length})
                </div>

                <div className="space-y-2">
                  {roles.map((role) => {
                    const isSelected = role.id === selectedRoleId
                    const userCount = userCountsByRole[role.id] || 0
                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/5 shadow-xs"
                            : "border-border bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                            <span className="font-semibold text-xs truncate">{role.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {role.isSystem ? (
                              <Badge variant="outline" className="text-[9px] py-0 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                System
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-rose-500 hover:text-rose-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeletingRoleId(role.id)
                                }}
                                title="Delete custom role"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                          {role.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                          <span>{role.permissions.length} of {ALL_PERMISSION_CODES.length} permissions</span>
                          <span className="font-medium text-foreground">{userCount} staff assigned</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Permission Matrix for Selected Role (Right Column) */}
              <div className="lg:col-span-8 space-y-4">
                <Card className="border bg-card shadow-xs">
                  <CardHeader className="p-4 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="size-3 rounded-full" style={{ backgroundColor: activeRole.color }} />
                          <CardTitle className="text-base font-bold">{activeRole.name}</CardTitle>
                          {activeRole.isSystem && (
                            <Badge variant="outline" className="text-[9px]">System Preset</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">{activeRole.description}</CardDescription>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {activeRole.permissions.length} Active Permissions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-5">
                    {activeRole.isSystem && activeRole.id === "role-owner" && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                        <ShieldCheck className="size-4 shrink-0 text-amber-600" />
                        <span>
                          The Owner / Administrator role has full master permissions across all features and cannot be restricted.
                        </span>
                      </div>
                    )}

                    {/* Modules & Permissions Accordions/Blocks */}
                    <div className="space-y-4">
                      {PERMISSION_MODULES.map((group) => {
                        const Icon = group.icon
                        const totalInGroup = group.permissions.length
                        const activeInGroup = group.permissions.filter((p) =>
                          activeRole.permissions.includes(p.code)
                        ).length
                        const allChecked = totalInGroup > 0 && activeInGroup === totalInGroup

                        return (
                          <div
                            key={group.module}
                            className="border border-border rounded-lg overflow-hidden bg-background"
                          >
                            {/* Module Header Bar */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                  <Icon className="size-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-foreground">{group.label}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {activeInGroup} of {totalInGroup} allowed
                                  </div>
                                </div>
                              </div>

                              {(!activeRole.isSystem || activeRole.id !== "role-owner") && (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleGrantModule(group)}
                                    className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    All
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeModule(group)}
                                    className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    None
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Permission Items List */}
                            <div className="divide-y divide-border/60">
                              {group.permissions.map((perm) => {
                                const isAllowed = activeRole.permissions.includes(perm.code)
                                const isLocked = activeRole.isSystem && activeRole.id === "role-owner"

                                return (
                                  <div
                                    key={perm.code}
                                    className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                                  >
                                    <div className="space-y-0.5 pr-4 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-foreground">{perm.name}</span>
                                        <code className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                          {perm.code}
                                        </code>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">{perm.description}</p>
                                    </div>

                                    <Switch
                                      checked={isAllowed}
                                      disabled={isLocked}
                                      onCheckedChange={() => handleTogglePermission(perm.code)}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 2: STAFF ROLE ASSIGNMENTS                                   */}
          {/* =============================================================== */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserCog className="size-4 text-amber-500" />
                  Staff User Accounts & Role Mapping
                </CardTitle>
                <CardDescription className="text-xs">
                  Active login accounts mapped to RBAC authorization rules in the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-medium uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Staff Member</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3">Assigned Role</th>
                          <th className="py-2.5 px-3">Account Status</th>
                          <th className="py-2.5 px-3">Last Login</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.map((user) => {
                          const userRole = roles.find((r) => r.id === user.roleId)
                          return (
                            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-foreground">{user.name}</div>
                                <div className="text-[11px] text-muted-foreground">{user.email}</div>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                {user.contactNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium"
                                  style={{
                                    borderColor: `${userRole?.color || "#6b7280"}50`,
                                    color: userRole?.color || "inherit",
                                  }}
                                >
                                  {userRole?.name || "Unassigned"}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                >
                                  Active
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                                {user.lastLoginAt || "Never"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user)
                                    setAssignedRoleForUser(user.roleId)
                                  }}
                                  className="h-7 text-xs px-2"
                                >
                                  Change Role
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ================================================================= */}
      {/* Create Custom Role Dialog                                         */}
      {/* ================================================================= */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Create Custom System Role</DialogTitle>
              <DialogDescription className="text-xs">
                Define a new restaurant staff role and optionally clone permissions from an existing preset.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Role Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Barista, Kitchen Expediter, Inventory Auditor"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role Description</Label>
                <Textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Summarize the responsibilities and scope of this role..."
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Badge Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="h-9 w-12 p-1 cursor-pointer"
                    />
                    <Input
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Clone Permissions From</Label>
                  <Select value={copyFromRoleId} onValueChange={(val) => setCopyFromRoleId(val ?? "none")}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Start Empty (0 Perms)</SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateRoleOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Change Staff Role Dialog                                          */}
      {/* ================================================================= */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Change Staff Role</DialogTitle>
            <DialogDescription className="text-xs">
              Assign a new authorization role to <span className="font-semibold text-foreground">{editingUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Select Role</Label>
              <Select value={assignedRoleForUser} onValueChange={(val) => setAssignedRoleForUser(val ?? "")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span>{r.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveUserRole}
              className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Apply Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Delete Custom Role Confirmation Dialog                            */}
      {/* ================================================================= */}
      <AlertDialog open={!!deletingRoleId} onOpenChange={(open) => !open && setDeletingRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Delete Custom Role?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently remove this role. Any staff members currently assigned to this role will automatically be reassigned to the default Head Cashier role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteRole}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
