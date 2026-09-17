import { NextRequest, NextResponse } from "next/server"
import { rfidTapSchema, validateApiRequest } from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { AttendanceLogEntity, AttendanceMethod, AttendanceStatus, EmployeeEntity } from "@/lib/database/entities"

export async function POST(req: NextRequest) {
  // Validate request body using Zod schema
  const validation = await validateApiRequest(req, rfidTapSchema)
  if ("errorResponse" in validation) {
    return validation.errorResponse
  }

  const { rfidCardUid, timestamp } = validation.data

  try {
    const db = await getDatabase()
    const employeeRepo = db.getRepository(EmployeeEntity)
    const attendanceRepo = db.getRepository(AttendanceLogEntity)

    const employee = await employeeRepo.findOne({
      where: { rfidCardUid },
    })

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Unregistered RFID card UID. Please register badge to staff first.",
        },
        { status: 404 }
      )
    }

    const now = timestamp ? new Date(timestamp) : new Date()
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
      // Clock In
      const shiftHour = 8
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
        rfidCardUidUsed: rfidCardUid,
      })

      await attendanceRepo.save(newLog)

      return NextResponse.json({
        success: true,
        action: "clock_in",
        employeeNumber: employee.employeeNumber,
        position: employee.position,
        timestamp: now.toISOString(),
        status: newLog.status,
        lateMinutes,
      })
    } else {
      // Clock Out
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

      return NextResponse.json({
        success: true,
        action: "clock_out",
        employeeNumber: employee.employeeNumber,
        position: employee.position,
        timestamp: now.toISOString(),
        totalHours: hoursWorked,
        overtimeHours,
        status: activeLog.status,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process RFID tap" },
      { status: 500 }
    )
  }
}
