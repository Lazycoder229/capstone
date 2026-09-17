"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BadgePercent,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Info,
  Layers,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  Radio,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Wifi,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
// Types & Data Models (Matching Module 10 in dbdesign.md)
// ---------------------------------------------------------------------------

export type EmploymentStatus = "active" | "on_leave" | "terminated"
export type SalaryType = "daily" | "monthly"
export type AttendanceStatus = "on_time" | "late" | "overtime" | "incomplete" | "absent"
export type AttendanceMethod = "rfid" | "manual" | "pin"
export type PayrollStatus = "open" | "processing" | "closed"

export interface EmployeeProfile {
  id: string
  userId: string
  employeeNumber: string
  name: string
  email: string
  contactNumber: string
  position: string
  department: string
  rfidCardUid: string | null
  dateHired: string
  employmentStatus: EmploymentStatus
  basicSalary: number
  salaryType: SalaryType
  dailyRate: number
  hourlyRate: number
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  department: string
  logDate: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  lateMinutes: number
  overtimeHours: number
  status: AttendanceStatus
  method: AttendanceMethod
  rfidCardUidUsed: string | null
  notes: string | null
}

export interface ShiftSchedule {
  id: string
  userId: string
  employeeName: string
  position: string
  department: string
  shiftDate: string
  startTime: string
  endTime: string
  station: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  position: string
  department: string
  periodStart: string
  periodEnd: string
  daysWorked: number
  basicPay: number
  overtimePay: number
  grossPay: number
  deductions: {
    sss: number
    philHealth: number
    pagIbig: number
    tardiness: number
    cashAdvance: number
    total: number
  }
  netPay: number
  status: "paid" | "pending"
}

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const INITIAL_EMPLOYEES: EmployeeProfile[] = [
  {
    id: "emp-1",
    userId: "usr-2",
    employeeNumber: "PRIME-001",
    name: "Carlos Mendoza",
    email: "carlos.m@primerestaurant.ph",
    contactNumber: "+63 918 222 3333",
    position: "Store Manager",
    department: "Management",
    rfidCardUid: "E2000019060B0101",
    dateHired: "2024-01-15",
    employmentStatus: "active",
    basicSalary: 28000,
    salaryType: "monthly",
    dailyRate: 1076.92,
    hourlyRate: 134.62,
  },
  {
    id: "emp-2",
    userId: "usr-3",
    employeeNumber: "PRIME-002",
    name: "Juan Reyes",
    email: "juan.r@primerestaurant.ph",
    contactNumber: "+63 919 333 4444",
    position: "Head Cashier",
    department: "Cashier",
    rfidCardUid: "E2000019060B0102",
    dateHired: "2024-06-01",
    employmentStatus: "active",
    basicSalary: 610,
    salaryType: "daily",
    dailyRate: 610,
    hourlyRate: 76.25,
  },
  {
    id: "emp-3",
    userId: "usr-4",
    employeeNumber: "PRIME-003",
    name: "Maria Cruz",
    email: "maria.c@primerestaurant.ph",
    contactNumber: "+63 920 444 5555",
    position: "Cashier / Server",
    department: "Cashier",
    rfidCardUid: "E2000019060B0103",
    dateHired: "2025-02-10",
    employmentStatus: "active",
    basicSalary: 610,
    salaryType: "daily",
    dailyRate: 610,
    hourlyRate: 76.25,
  },
  {
    id: "emp-4",
    userId: "usr-5",
    employeeNumber: "PRIME-004",
    name: "Lia Santos",
    email: "lia.s@primerestaurant.ph",
    contactNumber: "+63 921 555 6666",
    position: "Kitchen Lead & Roaster",
    department: "Kitchen",
    rfidCardUid: "E2000019060B0104",
    dateHired: "2024-03-20",
    employmentStatus: "active",
    basicSalary: 22000,
    salaryType: "monthly",
    dailyRate: 846.15,
    hourlyRate: 105.77,
  },
  {
    id: "emp-5",
    userId: "usr-6",
    employeeNumber: "PRIME-005",
    name: "Angelo Santos",
    email: "angelo.s@primerestaurant.ph",
    contactNumber: "+63 922 666 7777",
    position: "Dining Server",
    department: "Service",
    rfidCardUid: "E2000019060B0105",
    dateHired: "2025-05-12",
    employmentStatus: "active",
    basicSalary: 610,
    salaryType: "daily",
    dailyRate: 610,
    hourlyRate: 76.25,
  },
  {
    id: "emp-6",
    userId: "usr-7",
    employeeNumber: "PRIME-006",
    name: "Danilo Ramos",
    email: "danilo.r@primerestaurant.ph",
    contactNumber: "+63 923 777 8888",
    position: "Grill Cook",
    department: "Kitchen",
    rfidCardUid: "E2000019060B0106",
    dateHired: "2025-07-01",
    employmentStatus: "active",
    basicSalary: 650,
    salaryType: "daily",
    dailyRate: 650,
    hourlyRate: 81.25,
  },
]

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-1",
    employeeId: "emp-1",
    employeeName: "Carlos Mendoza",
    employeeNumber: "PRIME-001",
    department: "Management",
    logDate: "2026-09-17",
    clockIn: "07:54 AM",
    clockOut: null,
    totalHours: null,
    lateMinutes: 0,
    overtimeHours: 0,
    status: "on_time",
    method: "rfid",
    rfidCardUidUsed: "E2000019060B0101",
    notes: "RFID tap station 1",
  },
  {
    id: "att-2",
    employeeId: "emp-2",
    employeeName: "Juan Reyes",
    employeeNumber: "PRIME-002",
    department: "Cashier",
    logDate: "2026-09-17",
    clockIn: "08:14 AM",
    clockOut: null,
    totalHours: null,
    lateMinutes: 14,
    overtimeHours: 0,
    status: "late",
    method: "rfid",
    rfidCardUidUsed: "E2000019060B0102",
    notes: "Late 14 mins — traffic along Taft",
  },
  {
    id: "att-3",
    employeeId: "emp-4",
    employeeName: "Lia Santos",
    employeeNumber: "PRIME-004",
    department: "Kitchen",
    logDate: "2026-09-17",
    clockIn: "07:45 AM",
    clockOut: null,
    totalHours: null,
    lateMinutes: 0,
    overtimeHours: 0,
    status: "on_time",
    method: "rfid",
    rfidCardUidUsed: "E2000019060B0104",
    notes: "RFID tap station 1 (Morning roast prep)",
  },
  {
    id: "att-4",
    employeeId: "emp-3",
    employeeName: "Maria Cruz",
    employeeNumber: "PRIME-003",
    department: "Cashier",
    logDate: "2026-09-16",
    clockIn: "08:00 AM",
    clockOut: "05:15 PM",
    totalHours: 9.25,
    lateMinutes: 0,
    overtimeHours: 1.25,
    status: "overtime",
    method: "rfid",
    rfidCardUidUsed: "E2000019060B0103",
    notes: "Overtime dinner peak rush",
  },
  {
    id: "att-5",
    employeeId: "emp-5",
    employeeName: "Angelo Santos",
    employeeNumber: "PRIME-005",
    department: "Service",
    logDate: "2026-09-16",
    clockIn: "09:00 AM",
    clockOut: "05:00 PM",
    totalHours: 8.0,
    lateMinutes: 0,
    overtimeHours: 0,
    status: "on_time",
    method: "rfid",
    rfidCardUidUsed: "E2000019060B0105",
    notes: "Standard floor shift",
  },
]

const INITIAL_SCHEDULES: ShiftSchedule[] = [
  { id: "sch-1", userId: "usr-2", employeeName: "Carlos Mendoza", position: "Store Manager", department: "Management", shiftDate: "2026-09-17", startTime: "08:00", endTime: "17:00", station: "Manager Office & Floor" },
  { id: "sch-2", userId: "usr-3", employeeName: "Juan Reyes", position: "Head Cashier", department: "Cashier", shiftDate: "2026-09-17", startTime: "08:00", endTime: "17:00", station: "Counter POS Station 1" },
  { id: "sch-3", userId: "usr-5", employeeName: "Lia Santos", position: "Kitchen Lead", department: "Kitchen", shiftDate: "2026-09-17", startTime: "07:30", endTime: "16:30", station: "Charcoal Roaster Station" },
  { id: "sch-4", userId: "usr-4", employeeName: "Maria Cruz", position: "Cashier", department: "Cashier", shiftDate: "2026-09-17", startTime: "12:00", endTime: "21:00", station: "Counter POS Station 2 (Closing)" },
  { id: "sch-5", userId: "usr-6", employeeName: "Angelo Santos", position: "Dining Server", department: "Service", shiftDate: "2026-09-17", startTime: "11:00", endTime: "20:00", station: "Main Dining & Patio" },
  { id: "sch-6", userId: "usr-7", employeeName: "Danilo Ramos", position: "Grill Cook", department: "Kitchen", shiftDate: "2026-09-17", startTime: "10:00", endTime: "19:00", station: "BBQ & Sisig Grill Line" },
]

const INITIAL_PAYROLL: PayrollRecord[] = [
  {
    id: "pr-1",
    employeeId: "emp-1",
    employeeName: "Carlos Mendoza",
    employeeNumber: "PRIME-001",
    position: "Store Manager",
    department: "Management",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    daysWorked: 13,
    basicPay: 14000,
    overtimePay: 1200,
    grossPay: 15200,
    deductions: { sss: 630, philHealth: 350, pagIbig: 100, tardiness: 0, cashAdvance: 0, total: 1080 },
    netPay: 14120,
    status: "paid",
  },
  {
    id: "pr-2",
    employeeId: "emp-2",
    employeeName: "Juan Reyes",
    employeeNumber: "PRIME-002",
    position: "Head Cashier",
    department: "Cashier",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    daysWorked: 12,
    basicPay: 7320,
    overtimePay: 450,
    grossPay: 7770,
    deductions: { sss: 420, philHealth: 220, pagIbig: 100, tardiness: 120, cashAdvance: 500, total: 1360 },
    netPay: 6410,
    status: "paid",
  },
  {
    id: "pr-3",
    employeeId: "emp-4",
    employeeName: "Lia Santos",
    employeeNumber: "PRIME-004",
    position: "Kitchen Lead",
    department: "Kitchen",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    daysWorked: 13,
    basicPay: 11000,
    overtimePay: 1850,
    grossPay: 12850,
    deductions: { sss: 580, philHealth: 310, pagIbig: 100, tardiness: 0, cashAdvance: 0, total: 990 },
    netPay: 11860,
    status: "paid",
  },
  {
    id: "pr-4",
    employeeId: "emp-5",
    employeeName: "Angelo Santos",
    employeeNumber: "PRIME-005",
    position: "Dining Server",
    department: "Service",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    daysWorked: 11,
    basicPay: 6710,
    overtimePay: 0,
    grossPay: 6710,
    deductions: { sss: 380, philHealth: 200, pagIbig: 100, tardiness: 75, cashAdvance: 0, total: 755 },
    netPay: 5955,
    status: "paid",
  },
]

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState("directory")

  // Employees state
  const [employees, setEmployees] = useState<EmployeeProfile[]>(INITIAL_EMPLOYEES)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null)
  const [isEmployeeSheetOpen, setIsEmployeeSheetOpen] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null)

  // Employee Form state
  const [empForm, setEmpForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    position: "",
    department: "Service",
    employeeNumber: "",
    rfidCardUid: "",
    dateHired: new Date().toISOString().split("T")[0],
    employmentStatus: "active" as EmploymentStatus,
    basicSalary: 610,
    salaryType: "daily" as SalaryType,
  })

  // Attendance state
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE)
  const [attendanceFilterDate, setAttendanceFilterDate] = useState("all")
  const [simulatedCardUid, setSimulatedCardUid] = useState("")
  const [selectedTapEmployeeId, setSelectedTapEmployeeId] = useState<string>("emp-2")
  const [lastTapResult, setLastTapResult] = useState<{
    employeeName: string
    type: "in" | "out"
    time: string
    status: string
    cardUid: string
  } | null>(null)

  // Schedules state
  const [schedules, setSchedules] = useState<ShiftSchedule[]>(INITIAL_SCHEDULES)
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false)
  const [newShift, setNewShift] = useState({
    employeeId: "emp-2",
    shiftDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    station: "Counter POS Station 1",
  })

  // Payroll state
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(INITIAL_PAYROLL)
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null)
  const [payrollPeriod, setPayrollPeriod] = useState("Sep 1–15, 2026")

  // ---------------------------------------------------------------------------
  // Handlers — Employee Management
  // ---------------------------------------------------------------------------

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null)
    const nextNum = `PRIME-00${employees.length + 1}`
    const mockRfid = `E2000019060B010${employees.length + 1}`
    setEmpForm({
      name: "",
      email: "",
      contactNumber: "+63 9",
      position: "Cashier",
      department: "Cashier",
      employeeNumber: nextNum,
      rfidCardUid: mockRfid,
      dateHired: new Date().toISOString().split("T")[0],
      employmentStatus: "active",
      basicSalary: 610,
      salaryType: "daily",
    })
    setIsEmployeeSheetOpen(true)
  }

  const handleOpenEditEmployee = (emp: EmployeeProfile) => {
    setEditingEmployee(emp)
    setEmpForm({
      name: emp.name,
      email: emp.email,
      contactNumber: emp.contactNumber,
      position: emp.position,
      department: emp.department,
      employeeNumber: emp.employeeNumber,
      rfidCardUid: emp.rfidCardUid || "",
      dateHired: emp.dateHired,
      employmentStatus: emp.employmentStatus,
      basicSalary: emp.basicSalary,
      salaryType: emp.salaryType,
    })
    setIsEmployeeSheetOpen(true)
  }

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!empForm.name.trim()) {
      toast.error("Employee full name is required")
      return
    }

    const dailyRate = empForm.salaryType === "daily" ? empForm.basicSalary : empForm.basicSalary / 26
    const hourlyRate = dailyRate / 8

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((item) =>
          item.id === editingEmployee.id
            ? {
                ...item,
                name: empForm.name.trim(),
                email: empForm.email.trim(),
                contactNumber: empForm.contactNumber.trim(),
                position: empForm.position.trim(),
                department: empForm.department,
                rfidCardUid: empForm.rfidCardUid.trim() || null,
                dateHired: empForm.dateHired,
                employmentStatus: empForm.employmentStatus,
                basicSalary: Number(empForm.basicSalary),
                salaryType: empForm.salaryType,
                dailyRate: Math.round(dailyRate * 100) / 100,
                hourlyRate: Math.round(hourlyRate * 100) / 100,
              }
            : item
        )
      )
      toast.success("Employee record updated successfully")
    } else {
      const newEmp: EmployeeProfile = {
        id: `emp-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        employeeNumber: empForm.employeeNumber,
        name: empForm.name.trim(),
        email: empForm.email.trim(),
        contactNumber: empForm.contactNumber.trim(),
        position: empForm.position.trim(),
        department: empForm.department,
        rfidCardUid: empForm.rfidCardUid.trim() || null,
        dateHired: empForm.dateHired,
        employmentStatus: empForm.employmentStatus,
        basicSalary: Number(empForm.basicSalary),
        salaryType: empForm.salaryType,
        dailyRate: Math.round(dailyRate * 100) / 100,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
      }
      setEmployees((prev) => [...prev, newEmp])
      toast.success("New employee added to roster")
    }

    setIsEmployeeSheetOpen(false)
  }

  const handleGenerateRfid = () => {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
    const newUid = `E2000019${randomHex}`
    setEmpForm((prev) => ({ ...prev, rfidCardUid: newUid }))
    toast.info(`Generated RFID Badge UID: ${newUid}`)
  }

  // ---------------------------------------------------------------------------
  // Handlers — RFID Attendance Simulator
  // ---------------------------------------------------------------------------

  const handleSimulateRfidTap = (empIdToTap?: string) => {
    const empId = empIdToTap || selectedTapEmployeeId
    const targetEmp = employees.find((e) => e.id === empId)
    if (!targetEmp) {
      toast.error("Employee not found")
      return
    }

    if (!targetEmp.rfidCardUid) {
      toast.error(`${targetEmp.name} does not have an assigned RFID card badge`)
      return
    }

    const todayStr = new Date().toISOString().split("T")[0]
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // Check if employee has an open clock-in today
    const existingLog = attendanceLogs.find(
      (log) => log.employeeId === targetEmp.id && log.logDate === todayStr && !log.clockOut
    )

    if (existingLog) {
      // Clocking OUT
      const totalHoursWorked = 8.5
      const overtime = totalHoursWorked > 8 ? totalHoursWorked - 8 : 0

      setAttendanceLogs((prev) =>
        prev.map((log) =>
          log.id === existingLog.id
            ? {
                ...log,
                clockOut: nowTimeStr,
                totalHours: totalHoursWorked,
                overtimeHours: overtime,
                status: overtime > 0 ? "overtime" : log.status,
                notes: `RFID tap clock-out at station 1 (${totalHoursWorked} hrs logged)`,
              }
            : log
        )
      )

      setLastTapResult({
        employeeName: targetEmp.name,
        type: "out",
        time: nowTimeStr,
        status: "Shift Completed",
        cardUid: targetEmp.rfidCardUid,
      })

      toast.success(`RFID Tap: ${targetEmp.name} Clocked OUT`, {
        description: `Clock out time: ${nowTimeStr} · Total: ${totalHoursWorked} hrs`,
      })
    } else {
      // Clocking IN
      // Check schedule for today
      const schedule = schedules.find((s) => s.userId === targetEmp.userId && s.shiftDate === todayStr)
      let lateMins = 0
      let status: AttendanceStatus = "on_time"

      const currentHour = new Date().getHours()
      const currentMin = new Date().getMinutes()
      if (currentHour > 8 || (currentHour === 8 && currentMin > 10)) {
        lateMins = (currentHour - 8) * 60 + currentMin
        status = "late"
      }

      const newLog: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: targetEmp.id,
        employeeName: targetEmp.name,
        employeeNumber: targetEmp.employeeNumber,
        department: targetEmp.department,
        logDate: todayStr,
        clockIn: nowTimeStr,
        clockOut: null,
        totalHours: null,
        lateMinutes: lateMins,
        overtimeHours: 0,
        status,
        method: "rfid",
        rfidCardUidUsed: targetEmp.rfidCardUid,
        notes: lateMins > 0 ? `Late by ${lateMins} mins via RFID station` : "On-time RFID tap",
      }

      setAttendanceLogs((prev) => [newLog, ...prev])

      setLastTapResult({
        employeeName: targetEmp.name,
        type: "in",
        time: nowTimeStr,
        status: lateMins > 0 ? `Late (${lateMins} mins)` : "On Time",
        cardUid: targetEmp.rfidCardUid,
      })

      if (lateMins > 0) {
        toast.warning(`RFID Tap: ${targetEmp.name} Clocked IN (Late)`, {
          description: `Clock in: ${nowTimeStr} · ${lateMins} minutes tardy`,
        })
      } else {
        toast.success(`RFID Tap: ${targetEmp.name} Clocked IN`, {
          description: `Clock in: ${nowTimeStr} · Status: On-Time`,
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Handlers — Shift Scheduling
  // ---------------------------------------------------------------------------

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault()
    const targetEmp = employees.find((emp) => emp.id === newShift.employeeId)
    if (!targetEmp) return

    const shiftItem: ShiftSchedule = {
      id: `sch-${Date.now()}`,
      userId: targetEmp.userId,
      employeeName: targetEmp.name,
      position: targetEmp.position,
      department: targetEmp.department,
      shiftDate: newShift.shiftDate,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      station: newShift.station,
    }

    setSchedules((prev) => [...prev, shiftItem])
    setIsAddShiftOpen(false)
    toast.success(`Shift scheduled for ${targetEmp.name}`)
  }

  // ---------------------------------------------------------------------------
  // Handlers — Payroll
  // ---------------------------------------------------------------------------

  const handleComputePayroll = () => {
    toast.info("Computing payroll from attendance records...", { duration: 1500 })
    setTimeout(() => {
      toast.success("Payroll computation completed", {
        description: `Successfully generated payslips for ${employees.length} active employees.`,
      })
    }, 1200)
  }

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    let list = [...employees]
    if (departmentFilter !== "all") {
      list = list.filter((e) => e.department.toLowerCase() === departmentFilter.toLowerCase())
    }
    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeNumber.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          (e.rfidCardUid && e.rfidCardUid.toLowerCase().includes(q))
      )
    }
    return list
  }, [employees, departmentFilter, employeeSearch])

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-right" />
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Staff, RFID Attendance & Payroll</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Employee roster, RFID card time-clock logs, weekly shift scheduling, and statutory payroll.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "directory" && (
              <Button
                onClick={handleOpenAddEmployee}
                size="sm"
                className="h-9 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <UserPlus className="size-3.5" />
                <span>Add Employee</span>
              </Button>
            )}

            {activeTab === "scheduling" && (
              <Button
                onClick={() => setIsAddShiftOpen(true)}
                size="sm"
                className="h-9 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="size-3.5" />
                <span>Assign Shift</span>
              </Button>
            )}

            {activeTab === "payroll" && (
              <Button
                onClick={handleComputePayroll}
                size="sm"
                className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Coins className="size-3.5" />
                <span>Compute Period Payroll</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border bg-card shadow-xs">
            <CardContent className="p-3 sm:p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Staff</span>
                <Users className="size-3.5 text-amber-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold">{employees.length} Employees</div>
              <div className="text-[10px] text-muted-foreground">
                {employees.filter((e) => e.rfidCardUid).length} RFID Badges Assigned
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-xs">
            <CardContent className="p-3 sm:p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Present Today</span>
                <Clock className="size-3.5 text-emerald-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {attendanceLogs.filter((a) => a.logDate === "2026-09-17").length} Checked In
              </div>
              <div className="text-[10px] text-muted-foreground">
                {attendanceLogs.filter((a) => a.status === "late" && a.logDate === "2026-09-17").length} Tardy Taps
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-xs">
            <CardContent className="p-3 sm:p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Shifts</span>
                <Calendar className="size-3.5 text-sky-500" />
              </div>
              <div className="text-lg sm:text-xl font-bold">{schedules.length} Scheduled</div>
              <div className="text-[10px] text-muted-foreground">Across 3 Store Stations</div>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-xs">
            <CardContent className="p-3 sm:p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Payroll Period</span>
                <Banknote className="size-3.5 text-purple-500" />
              </div>
              <div className="text-sm sm:text-base font-bold truncate">{payrollPeriod}</div>
              <div className="text-[10px] text-muted-foreground">Cutoff Status: Open</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/60 border border-border">
            <TabsTrigger value="directory" className="text-xs py-2 gap-1.5">
              <Users className="size-3.5" />
              <span>Employee Directory</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs py-2 gap-1.5">
              <Radio className="size-3.5 text-emerald-500" />
              <span>RFID Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="text-xs py-2 gap-1.5">
              <Calendar className="size-3.5" />
              <span>Shift Schedules</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs py-2 gap-1.5">
              <Banknote className="size-3.5" />
              <span>Payroll & Payslips</span>
            </TabsTrigger>
          </TabsList>

          {/* =============================================================== */}
          {/* TAB 1: EMPLOYEE DIRECTORY                                       */}
          {/* =============================================================== */}
          <TabsContent value="directory" className="space-y-4">
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="size-4 text-amber-500" />
                      Employee Roster & RFID Badges
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Master directory of restaurant staff, employment contracts, and assigned RFID cards.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                        <SelectItem value="Kitchen">Kitchen</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employee name, ID number, RFID UID, position..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-medium uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Emp ID</th>
                          <th className="py-2.5 px-3">Staff Name</th>
                          <th className="py-2.5 px-3">Position & Dept</th>
                          <th className="py-2.5 px-3">RFID Card Badge</th>
                          <th className="py-2.5 px-3">Salary Rate</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-muted-foreground">
                              {emp.employeeNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-foreground">{emp.name}</div>
                              <div className="text-[10px] text-muted-foreground">{emp.contactNumber}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-foreground">{emp.position}</div>
                              <Badge variant="outline" className="text-[9px] py-0 text-muted-foreground">
                                {emp.department}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              {emp.rfidCardUid ? (
                                <div className="flex items-center gap-1.5">
                                  <Radio className="size-3 text-emerald-500 animate-pulse" />
                                  <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-medium">
                                    {emp.rfidCardUid}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-amber-500 text-[10px] font-medium flex items-center gap-1">
                                  <AlertCircle className="size-3" /> No Card Assigned
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums">
                              <div className="font-semibold text-foreground">
                                ₱{emp.basicSalary.toLocaleString()}{" "}
                                <span className="text-[10px] font-normal text-muted-foreground">/{emp.salaryType}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                ~₱{emp.hourlyRate.toFixed(2)}/hr
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  emp.employmentStatus === "active"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                }`}
                              >
                                {emp.employmentStatus.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditEmployee(emp)}
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  title="Edit Employee"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 2: RFID ATTENDANCE & TIME CLOCK                             */}
          {/* =============================================================== */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Interactive RFID Tap Station (Left Column) */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border border-emerald-500/40 bg-gradient-to-b from-card to-emerald-500/5 shadow-xs">
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <Radio className="size-4 text-emerald-500 animate-pulse" />
                        RFID Tap Simulator Station
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                        Reader #1 (Active)
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Simulates staff tapping their physical RFID smart card onto the restaurant entrance terminal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Select Staff Card to Tap</Label>
                      <Select value={selectedTapEmployeeId} onValueChange={setSelectedTapEmployeeId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{emp.name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({emp.rfidCardUid || "No UID"})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-emerald-500/40 text-center space-y-3">
                      <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                        <Radio className="size-8 animate-pulse" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground">Ready for Card Contact</div>
                        <p className="text-[10px] text-muted-foreground">
                          Hold RFID card within 5cm of terminal surface to clock in / out.
                        </p>
                      </div>

                      <Button
                        onClick={() => handleSimulateRfidTap()}
                        className="w-full h-10 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                      >
                        <Zap className="size-4" />
                        <span>Tap RFID Card Now</span>
                      </Button>
                    </div>

                    {/* Last Tap Confirmation Card */}
                    {lastTapResult && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-200">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            {lastTapResult.employeeName}
                          </span>
                          <Badge className="text-[9px] bg-emerald-600 text-white">
                            {lastTapResult.type === "in" ? "CLOCKED IN" : "CLOCKED OUT"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex justify-between">
                          <span>Timestamp: {lastTapResult.time}</span>
                          <span>{lastTapResult.status}</span>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-600/80">
                          UID: {lastTapResult.cardUid}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Records Table (Right Column) */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="border bg-card shadow-xs">
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="size-4 text-emerald-500" />
                        Daily Attendance Ledger
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {attendanceLogs.length} Records
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Time tracking records captured through RFID scans and authorized manual overrides.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-medium uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Staff Name</th>
                              <th className="py-2.5 px-3">In / Out</th>
                              <th className="py-2.5 px-3">Hours</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {attendanceLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 font-medium whitespace-nowrap">{log.logDate}</td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-foreground">{log.employeeName}</div>
                                  <div className="text-[10px] text-muted-foreground">{log.department}</div>
                                </td>
                                <td className="py-2.5 px-3 tabular-nums whitespace-nowrap">
                                  <div className="font-medium text-emerald-600 dark:text-emerald-400">
                                    IN: {log.clockIn}
                                  </div>
                                  <div className="text-muted-foreground text-[10px]">
                                    OUT: {log.clockOut || "— Active —"}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 tabular-nums font-semibold">
                                  {log.totalHours ? `${log.totalHours} hrs` : "In Progress"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      log.status === "on_time"
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                        : log.status === "late"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                        : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                    }`}
                                  >
                                    {log.status === "late" ? `Late (${log.lateMinutes}m)` : log.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                    <Radio className="size-2.5 text-emerald-500" />
                                    RFID
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 3: SHIFT SCHEDULING                                         */}
          {/* =============================================================== */}
          <TabsContent value="scheduling" className="space-y-4">
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="size-4 text-sky-500" />
                      Weekly Shift Schedule & Station Roster
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manages daily shifts, station assignments (Counter, Kitchen, Dining Floor), and trading hours coverage.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsAddShiftOpen(true)}
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <Plus className="size-3.5" />
                    <span>Assign New Shift</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {schedules.map((sch) => (
                    <div
                      key={sch.id}
                      className="border border-border rounded-lg p-3.5 space-y-2.5 bg-background hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-foreground">{sch.employeeName}</div>
                        <Badge variant="outline" className="text-[9px]">
                          {sch.department}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3 text-sky-500" />
                          <span className="font-mono font-medium text-foreground">
                            {sch.startTime} – {sch.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Utensils className="size-3 text-amber-500" />
                          <span className="truncate">{sch.station}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3 text-purple-500" />
                          <span>{sch.shiftDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============================================================== */}
          {/* TAB 4: PAYROLL & PAYSLIPS                                       */}
          {/* =============================================================== */}
          <TabsContent value="payroll" className="space-y-4">
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Banknote className="size-4 text-purple-500" />
                      Payroll Summary & Payslips
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Official bi-monthly salary calculations, overtime pay, and statutory deductions (SSS, PhilHealth, Pag-IBIG).
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={payrollPeriod} onValueChange={setPayrollPeriod}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sep 1–15, 2026">Sep 1–15, 2026</SelectItem>
                        <SelectItem value="Sep 16–30, 2026">Sep 16–30, 2026</SelectItem>
                        <SelectItem value="Aug 16–31, 2026">Aug 16–31, 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-medium uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Staff Member</th>
                          <th className="py-2.5 px-3">Days Worked</th>
                          <th className="py-2.5 px-3">Basic Pay</th>
                          <th className="py-2.5 px-3">Overtime</th>
                          <th className="py-2.5 px-3">Gross Salary</th>
                          <th className="py-2.5 px-3">Total Deductions</th>
                          <th className="py-2.5 px-3">Net Take-Home</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {payrollRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-foreground">{rec.employeeName}</div>
                              <div className="text-[10px] text-muted-foreground">{rec.position}</div>
                            </td>
                            <td className="py-2.5 px-3 tabular-nums">{rec.daysWorked} days</td>
                            <td className="py-2.5 px-3 tabular-nums font-mono">₱{rec.basicPay.toLocaleString()}</td>
                            <td className="py-2.5 px-3 tabular-nums font-mono">₱{rec.overtimePay.toLocaleString()}</td>
                            <td className="py-2.5 px-3 tabular-nums font-mono font-semibold">
                              ₱{rec.grossPay.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums font-mono text-rose-600 dark:text-rose-400">
                              -₱{rec.deductions.total.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ₱{rec.netPay.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayslip(rec)}
                                className="h-7 text-xs gap-1"
                              >
                                <FileText className="size-3" />
                                <span>Payslip</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
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
      {/* Add / Edit Employee Sheet                                         */}
      {/* ================================================================= */}
      <Sheet open={isEmployeeSheetOpen} onOpenChange={setIsEmployeeSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="size-5 text-amber-500" />
              {editingEmployee ? "Edit Employee Profile" : "Register New Employee"}
            </SheetTitle>
            <SheetDescription>
              Complete staff identity, compensation details, and RFID badge serial.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveEmployee} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name <span className="text-rose-500">*</span></Label>
              <Input
                value={empForm.name}
                onChange={(e) => setEmpForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Juan De La Cruz"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Employee Number</Label>
                <Input
                  value={empForm.employeeNumber}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, employeeNumber: e.target.value }))}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Department</Label>
                <Select
                  value={empForm.department}
                  onValueChange={(val) => setEmpForm((prev) => ({ ...prev, department: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Job Position</Label>
                <Input
                  value={empForm.position}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="e.g. Cashier, Grill Cook"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Contact Number</Label>
                <Input
                  value={empForm.contactNumber}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* RFID Card UID Assignment with Generator */}
            <div className="space-y-1.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Radio className="size-3.5 text-emerald-500" />
                  RFID Badge Card UID
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateRfid}
                  className="h-6 text-[10px] text-emerald-600 hover:text-emerald-700 p-1"
                >
                  Generate UID
                </Button>
              </div>
              <Input
                value={empForm.rfidCardUid}
                onChange={(e) => setEmpForm((prev) => ({ ...prev, rfidCardUid: e.target.value }))}
                placeholder="Scan or input RFID UID (e.g. E2000019060B0102)"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                This UID is used by the entrance terminal scanner to authenticate clock-ins.
              </p>
            </div>

            {/* Compensation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Salary Type</Label>
                <Select
                  value={empForm.salaryType}
                  onValueChange={(val) => setEmpForm((prev) => ({ ...prev, salaryType: val as SalaryType }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Rate</SelectItem>
                    <SelectItem value="monthly">Monthly Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rate (₱)</Label>
                <Input
                  type="number"
                  min="0"
                  value={empForm.basicSalary}
                  onChange={(e) => setEmpForm((prev) => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                  className="h-9 text-xs font-semibold font-mono"
                />
              </div>
            </div>

            <SheetFooter className="pt-3 gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEmployeeSheetOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                {editingEmployee ? "Update Employee" : "Save Employee"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ================================================================= */}
      {/* Assign Shift Modal                                                */}
      {/* ================================================================= */}
      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddShift}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Assign Work Shift</DialogTitle>
              <DialogDescription className="text-xs">
                Schedule a staff member to a shift slot and store work station.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Employee</Label>
                <Select
                  value={newShift.employeeId}
                  onValueChange={(val) => setNewShift((prev) => ({ ...prev, employeeId: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Shift Date</Label>
                <Input
                  type="date"
                  value={newShift.shiftDate}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, shiftDate: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Start Time</Label>
                  <Input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">End Time</Label>
                  <Input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assigned Station</Label>
                <Select
                  value={newShift.station}
                  onValueChange={(val) => setNewShift((prev) => ({ ...prev, station: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Counter POS Station 1">Counter POS Station 1</SelectItem>
                    <SelectItem value="Counter POS Station 2 (Closing)">Counter POS Station 2 (Closing)</SelectItem>
                    <SelectItem value="Charcoal Roaster Station">Charcoal Roaster Station</SelectItem>
                    <SelectItem value="BBQ & Sisig Grill Line">BBQ & Sisig Grill Line</SelectItem>
                    <SelectItem value="Main Dining & Patio">Main Dining & Patio</SelectItem>
                    <SelectItem value="Manager Office & Floor">Manager Office & Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddShiftOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 text-xs bg-sky-600 hover:bg-sky-700 text-white">
                Confirm Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Official Payslip Printable Viewer Modal                           */}
      {/* ================================================================= */}
      <Dialog open={!!selectedPayslip} onOpenChange={(open) => !open && setSelectedPayslip(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center justify-between">
              <span>Employee Payslip</span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {selectedPayslip?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              PRIME: Point-of-sale Restaurant Integrated Management Ecosystem
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-4 py-2 text-xs">
              {/* Header Box */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">{selectedPayslip.employeeName}</span>
                  <span className="font-mono text-muted-foreground">{selectedPayslip.employeeNumber}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>{selectedPayslip.position} · {selectedPayslip.department}</span>
                  <span>Period: {selectedPayslip.periodStart} to {selectedPayslip.periodEnd}</span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {/* Earnings */}
                <div className="space-y-2 p-3 rounded-lg border border-border bg-background">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                    Earnings
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Basic Pay ({selectedPayslip.daysWorked}d):</span>
                    <span className="font-mono font-medium text-foreground">₱{selectedPayslip.basicPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Overtime Pay:</span>
                    <span className="font-mono font-medium text-foreground">₱{selectedPayslip.overtimePay.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between font-bold">
                    <span>Gross Pay:</span>
                    <span className="font-mono text-emerald-600">₱{selectedPayslip.grossPay.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 p-3 rounded-lg border border-border bg-background">
                  <div className="font-semibold text-rose-700 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                    Deductions
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>SSS Contribution:</span>
                    <span className="font-mono">₱{selectedPayslip.deductions.sss}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>PhilHealth:</span>
                    <span className="font-mono">₱{selectedPayslip.deductions.philHealth}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Pag-IBIG Fund:</span>
                    <span className="font-mono">₱{selectedPayslip.deductions.pagIbig}</span>
                  </div>
                  {selectedPayslip.deductions.tardiness > 0 && (
                    <div className="flex justify-between text-rose-600 text-[11px]">
                      <span>Tardiness:</span>
                      <span className="font-mono">₱{selectedPayslip.deductions.tardiness}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between font-bold">
                    <span>Total Deductions:</span>
                    <span className="font-mono text-rose-600">₱{selectedPayslip.deductions.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Take Home Pay */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-semibold">
                    Net Take-Home Pay
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₱{selectedPayslip.netPay.toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => toast.success("Payslip PDF sent to printer")}
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Printer className="size-3.5" />
                  <span>Print Slip</span>
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPayslip(null)}
              className="h-8 text-xs w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
