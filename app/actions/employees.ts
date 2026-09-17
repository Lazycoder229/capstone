"use server"

import {
  createEmployeeSchema,
  createSafeAction,
  rfidTapSchema,
  type CreateEmployeeInput,
  type RfidTapInput,
} from "@/lib/validations"
import { z } from "zod"
import { getDatabase } from "@/lib/database/data-source"
import {
  AttendanceLogEntity,
  AttendanceMethod,
  AttendanceStatus,
  AppUserEntity,
  EmployeeEntity,
  EmploymentStatus,
  SalaryType,
} from "@/lib/database/entities"
import { toPlain } from "@/lib/utils/serialize"
import { registerUser } from "@/lib/services/auth.service"

const createEmployeeWithAccountSchema = createEmployeeSchema.extend({
  name: z.string().min(1, "Staff name is required").max(100),
  email: z.string().email("A valid staff email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const createEmployeeWithAccountAction = createSafeAction(
  createEmployeeWithAccountSchema,
  async (input) => {
    const user = await registerUser({
      name: input.name,
      email: input.email,
      password: input.password,
    })
    if (!user) throw new Error("That staff email is already registered.")

    const db = await getDatabase()
    const employeeRepo = db.getRepository(EmployeeEntity)
    const employee = employeeRepo.create({
      id: crypto.randomUUID(),
      userId: user.id,
      employeeNumber: input.employeeNumber,
      position: input.position,
      department: input.department ?? null,
      rfidCardUid: input.rfidCardUid ?? null,
      dateHired: input.dateHired,
      employmentStatus: input.employmentStatus as EmploymentStatus,
      basicSalary: String(input.basicSalary),
      salaryType: input.salaryType as SalaryType,
    })
    await employeeRepo.save(employee)

    return { employeeId: employee.id, userId: user.id, message: "Staff account and employee profile created successfully." }
  },
)

export const createEmployeeAction = createSafeAction(
  createEmployeeSchema,
  async (input: CreateEmployeeInput) => {
    const db = await getDatabase()
    const employeeRepo = db.getRepository(EmployeeEntity)

    // Check if employeeNumber or rfidCardUid is already used
    const existing = await employeeRepo.findOne({
      where: [{ employeeNumber: input.employeeNumber }],
    })

    if (existing) {
      throw new Error(`Employee number '${input.employeeNumber}' is already registered.`)
    }

    if (input.rfidCardUid) {
      const existingRfid = await employeeRepo.findOne({
        where: { rfidCardUid: input.rfidCardUid },
      })
      if (existingRfid) {
        throw new Error(`RFID UID '${input.rfidCardUid}' is already assigned to another employee.`)
      }
    }

    const employee = employeeRepo.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      employeeNumber: input.employeeNumber,
      position: input.position,
      department: input.department ?? null,
      rfidCardUid: input.rfidCardUid ?? null,
      dateHired: input.dateHired,
      employmentStatus: input.employmentStatus as EmploymentStatus,
      basicSalary: String(input.basicSalary),
      salaryType: input.salaryType as SalaryType,
    })

    await employeeRepo.save(employee)
    return { employeeId: employee.id, message: "Employee registered successfully." }
  }
)

export const rfidTapAttendanceAction = createSafeAction(
  rfidTapSchema,
  async (input: RfidTapInput) => {
    const db = await getDatabase()
    const employeeRepo = db.getRepository(EmployeeEntity)
    const attendanceRepo = db.getRepository(AttendanceLogEntity)
    const userRepo = db.getRepository(AppUserEntity)

    const employee = await employeeRepo.findOne({
      where: { rfidCardUid: input.rfidCardUid },
    })

    if (!employee) {
      throw new Error("Unrecognized RFID badge. Please assign this card to an employee first.")
    }

    const user = await userRepo.findOne({ where: { id: employee.userId } })

    const now = input.timestamp ? new Date(input.timestamp) : new Date()
    const todayStr = now.toISOString().split("T")[0]

    // Find if employee already clocked in today without clocking out
    const activeLog = await attendanceRepo.findOne({
      where: {
        employeeId: employee.id,
        logDate: todayStr,
      },
      order: { clockIn: "DESC" },
    })

    if (!activeLog || activeLog.clockOut) {
      // CLOCK IN
      const shiftHour = 8 // Default 08:00 AM shift start
      const shiftMin = 0
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()
      const lateMinutes = Math.max(0, (currentHour - shiftHour) * 60 + (currentMin - shiftMin))

      const newLog = attendanceRepo.create({
        id: crypto.randomUUID(),
        employeeId: employee.id,
        logDate: todayStr,
        clockIn: now,
        clockOut: null,
        lateMinutes,
        status: lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME,
        method: AttendanceMethod.RFID,
        rfidCardUidUsed: input.rfidCardUid,
      })

      await attendanceRepo.save(newLog)

      return {
        action: "clock_in",
        employeeName: user?.name || employee.position,
        employeeNumber: employee.employeeNumber,
        timestamp: now.toISOString(),
        lateMinutes,
        status: newLog.status,
      }
    } else {
      // CLOCK OUT
      const clockInTime = new Date(activeLog.clockIn).getTime()
      const clockOutTime = now.getTime()
      const hoursWorked = Number(((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2))
      const overtimeHours = Number(Math.max(0, hoursWorked - 8).toFixed(2))

      activeLog.clockOut = now
      activeLog.totalHours = String(hoursWorked)
      activeLog.overtimeHours = String(overtimeHours)
      if (overtimeHours > 0) {
        activeLog.status = AttendanceStatus.OVERTIME
      }

      await attendanceRepo.save(activeLog)

      return {
        action: "clock_out",
        employeeNumber: employee.employeeNumber,
        timestamp: now.toISOString(),
        totalHours: hoursWorked,
        overtimeHours,
        status: activeLog.status,
      }
    }
  }
)

export async function fetchEmployeesData() {
  try {
    const db = await getDatabase()
    const empRepo = db.getRepository(EmployeeEntity)
    const attRepo = db.getRepository(AttendanceLogEntity)
    const userRepo = db.getRepository(AppUserEntity)

    let employees = await empRepo.find({ order: { employeeNumber: "ASC" } })
    const users = await userRepo.find()
    const userMap = new Map(users.map((user) => [user.id, user]))
    const logs = await attRepo.find({ order: { clockIn: "DESC" }, take: 50 })
    const empMap = new Map(employees.map((e) => [e.id, e]))

    const formattedLogs = logs.map((l) => {
      const emp = empMap.get(l.employeeId)
      return {
        id: l.id,
        employeeId: l.employeeId,
        employeeName: emp
          ? `${userMap.get(emp.userId)?.name || emp.position} (${emp.employeeNumber})`
          : "Staff",
        rfidCardUid: l.rfidCardUidUsed || emp?.rfidCardUid || "N/A",
        clockIn: new Date(l.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        clockOut: l.clockOut
          ? new Date(l.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : null,
        totalHours: l.totalHours ? Number(l.totalHours) : null,
        lateMinutes: l.lateMinutes,
        overtimeHours: Number(l.overtimeHours),
        status: l.status,
        method: l.method,
      }
    })

    const formattedEmployees = employees.map((e) => ({
      ...toPlain(e),
      name: `${userMap.get(e.userId)?.name || e.position} (${e.employeeNumber})`,
      basicSalary: Number(e.basicSalary),
    }))

    return {
      success: true,
      data: {
        employees: formattedEmployees,
        attendanceLogs: formattedLogs,
      },
    }
  } catch (error: any) {
    console.error("fetchEmployeesData error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch employees",
      data: { employees: [], attendanceLogs: [] },
    }
  }
}

