import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

abstract class IdEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string
}

abstract class TimestampedEntity extends IdEntity {
  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date
}

@Entity("users")
export class AppUserEntity extends IdEntity {
  @Column({ type: "varchar", length: 36, nullable: true }) roleId!: string | null
  @Column({ type: "varchar", length: 255, nullable: true, unique: true }) email!: string | null
  @Column({ type: "varchar", length: 255, nullable: true }) passwordHash!: string | null
  @Column({ type: "varchar", length: 100, nullable: true }) name!: string | null
  @Column({ type: "varchar", length: 20, nullable: true }) contactNumber!: string | null
  @Column({ default: true }) isActive!: boolean
  @Column({ type: "datetime", nullable: true }) lastLoginAt!: Date | null
  @Column({ type: "datetime", nullable: true }) emailVerified!: string | null
  @Column({ type: "varchar", length: 500, nullable: true }) image!: string | null
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
  @UpdateDateColumn({ type: "datetime" }) updatedAt!: Date

  @OneToMany(() => AccountEntity, (account) => account.user)
  accounts!: AccountEntity[]

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions!: SessionEntity[]
}

@Entity("accounts")
export class AccountEntity {
  @PrimaryGeneratedColumn("uuid") id!: string
  @Column({ length: 36 }) userId!: string
  @Column({ length: 255 }) type!: string
  @Column({ length: 255 }) provider!: string
  @Column({ length: 255 }) providerAccountId!: string
  @Column({ type: "text", nullable: true }) refresh_token!: string | null
  @Column({ type: "text", nullable: true }) access_token!: string | null
  @Column({ type: "bigint", nullable: true }) expires_at!: number | null
  @Column({ type: "text", nullable: true }) token_type!: string | null
  @Column({ type: "text", nullable: true }) scope!: string | null
  @Column({ type: "text", nullable: true }) id_token!: string | null
  @Column({ type: "text", nullable: true }) session_state!: string | null

  @ManyToOne(() => AppUserEntity, (user) => user.accounts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: AppUserEntity
}

@Entity("sessions")
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string
  @Column({ length: 255, unique: true }) sessionToken!: string
  @Column({ length: 36 }) userId!: string
  @Column({ type: "datetime" }) expires!: string

  @ManyToOne(() => AppUserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: AppUserEntity
}

@Entity("verification_tokens")
export class VerificationTokenEntity {
  @PrimaryGeneratedColumn("uuid") id!: string
  @Column({ length: 255 }) identifier!: string
  @Column({ length: 255 }) token!: string
  @Column({ type: "datetime" }) expires!: string
}

export const authEntities = {
  UserEntity: AppUserEntity,
  AccountEntity,
  SessionEntity,
  VerificationTokenEntity,
}

@Entity("roles")
export class RoleEntity extends TimestampedEntity {
  @Column({ length: 50, unique: true }) name!: string
  @Column({ type: "text", nullable: true }) description!: string | null
  @Column({ default: false }) isSystem!: boolean
}

@Entity("permissions")
export class PermissionEntity extends IdEntity {
  @Column({ length: 100, unique: true }) code!: string
  @Column({ length: 50 }) module!: string
  @Column({ type: "text", nullable: true }) description!: string | null
}

@Entity("role_permissions")
export class RolePermissionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 }) roleId!: string
  @PrimaryColumn({ type: "varchar", length: 36 }) permissionId!: string
}

@Entity("customers")
export class CustomerEntity extends TimestampedEntity {
  @Column({ type: "varchar", length: 255, unique: true, nullable: true }) email!: string | null
  @Column({ type: "varchar", length: 255, nullable: true }) password!: string | null
  @Column({ length: 100 }) name!: string
  @Column({ type: "varchar", length: 20, nullable: true }) contactNumber!: string | null
  @Column({ default: 0 }) loyaltyPointsBalance!: number
  @Column({ default: true }) isGuest!: boolean
}

@Entity("categories")
export class CategoryEntity extends IdEntity {
  @Column({ length: 100 }) name!: string
  @Column({ default: 0 }) sortOrder!: number
  @Column({ default: true }) isActive!: boolean
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("menu_items")
export class MenuItemEntity extends TimestampedEntity {
  @Column({ type: "varchar", length: 36 }) categoryId!: string
  @Column({ length: 150 }) name!: string
  @Column({ type: "text", nullable: true }) description!: string | null
  @Column({ type: "decimal", precision: 10, scale: 2 }) price!: string
  @Column({ type: "varchar", length: 500, nullable: true }) imageUrl!: string | null
  @Column({ default: true }) isAvailable!: boolean
  @Column({ type: "int", nullable: true }) stockQuantity!: number | null
}

export enum RestaurantTableStatus { AVAILABLE = "available", OCCUPIED = "occupied", RESERVED = "reserved" }
@Entity("restaurant_tables")
export class RestaurantTableEntity extends IdEntity {
  @Column({ length: 20, unique: true }) tableNumber!: string
  @Column() capacity!: number
  @Column({ type: "varchar", length: 500, nullable: true }) qrCodeUrl!: string | null
  @Column({ type: "enum", enum: RestaurantTableStatus, default: RestaurantTableStatus.AVAILABLE }) status!: RestaurantTableStatus
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

export enum OrderType { QR = "qr", COUNTER = "counter" }
export enum OrderStatus { PENDING = "pending", PREPARING = "preparing", READY = "ready", SERVED = "served", COMPLETED = "completed", CANCELLED = "cancelled" }
@Entity("orders")
export class OrderEntity extends TimestampedEntity {
  @Column({ length: 30, unique: true }) orderNumber!: string
  @Column({ type: "varchar", length: 36, nullable: true }) tableId!: string | null
  @Column({ type: "varchar", length: 36, nullable: true }) customerId!: string | null
  @Column({ type: "enum", enum: OrderType }) orderType!: OrderType
  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING }) status!: OrderStatus
  @Column({ type: "decimal", precision: 10, scale: 2 }) subtotal!: string
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) discount!: string
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) tax!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) total!: string
  @Column({ type: "varchar", length: 36, nullable: true }) createdByStaffId!: string | null
}

@Entity("order_items")
export class OrderItemEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 36 }) menuItemId!: string
  @Column() quantity!: number
  @Column({ type: "decimal", precision: 10, scale: 2 }) unitPrice!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) subtotal!: string
  @Column({ type: "varchar", length: 255, nullable: true }) notes!: string | null
}

@Entity("order_status_history")
export class OrderStatusHistoryEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 30 }) status!: string
  @Column({ type: "varchar", length: 36, nullable: true }) changedByStaffId!: string | null
  @CreateDateColumn({ type: "datetime" }) changedAt!: Date
}

export enum VoidStatus { PENDING = "pending", APPROVED = "approved", REJECTED = "rejected" }
@Entity("order_voids")
export class OrderVoidEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 36 }) requestedByStaffId!: string
  @Column({ type: "varchar", length: 36, nullable: true }) approvedByStaffId!: string | null
  @Column({ type: "text" }) reason!: string
  @Column({ type: "text", nullable: true }) resolutionNotes!: string | null
  @Column({ type: "enum", enum: VoidStatus, default: VoidStatus.PENDING }) status!: VoidStatus
  @CreateDateColumn({ type: "datetime" }) requestedAt!: Date
  @Column({ type: "datetime", nullable: true }) resolvedAt!: Date | null
}

export enum ReservationStatus { PENDING = "pending", CONFIRMED = "confirmed", CANCELLED = "cancelled", COMPLETED = "completed", NO_SHOW = "no_show" }
@Entity("reservations")
export class ReservationEntity extends IdEntity {
  @Column({ type: "varchar", length: 36, nullable: true }) customerId!: string | null
  @Column({ length: 100 }) customerName!: string
  @Column({ length: 20 }) contactNumber!: string
  @Column({ type: "varchar", length: 255, nullable: true }) email!: string | null
  @Column({ type: "varchar", length: 36, nullable: true }) tableId!: string | null
  @Column({ type: "date" }) reservationDate!: string
  @Column({ type: "time" }) reservationTime!: string
  @Column() numberOfGuests!: number
  @Column({ type: "enum", enum: ReservationStatus, default: ReservationStatus.PENDING }) status!: ReservationStatus
  @Column({ type: "text", nullable: true }) notes!: string | null
  @Column({ type: "varchar", length: 36, nullable: true }) createdByStaffId!: string | null
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

export enum PaymentMethod { CASH = "cash", GCASH = "gcash", CARD = "card", OTHER = "other" }
@Entity("payments")
export class PaymentEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 30, unique: true }) receiptNumber!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) amountPaid!: string
  @Column({ type: "enum", enum: PaymentMethod }) paymentMethod!: PaymentMethod
  @Column({ type: "varchar", length: 100, nullable: true }) referenceNumber!: string | null
  @Column({ length: 36 }) processedByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) paidAt!: Date
}

@Entity("loyalty_settings")
export class LoyaltySettingEntity extends IdEntity {
  @Column({ type: "decimal", precision: 5, scale: 2, default: 1 }) pointsPerPeso!: string
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0.5 }) pesoValuePerPoint!: string
  @UpdateDateColumn({ type: "datetime" }) updatedAt!: Date
}

export enum LoyaltyTransactionType { EARN = "earn", REDEEM = "redeem" }
@Entity("loyalty_transactions")
export class LoyaltyTransactionEntity extends IdEntity {
  @Column({ length: 36 }) customerId!: string
  @Column({ type: "varchar", length: 36, nullable: true }) orderId!: string | null
  @Column({ type: "enum", enum: LoyaltyTransactionType }) type!: LoyaltyTransactionType
  @Column() points!: number
  @Column() balanceAfter!: number
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("loyalty_rewards")
export class LoyaltyRewardEntity extends IdEntity {
  @Column({ length: 150 }) name!: string
  @Column() pointsCost!: number
  @Column({ type: "text", nullable: true }) description!: string | null
  @Column({ default: true }) isActive!: boolean
}

export enum EmploymentStatus { ACTIVE = "active", ON_LEAVE = "on_leave", TERMINATED = "terminated" }
export enum SalaryType { DAILY = "daily", MONTHLY = "monthly" }
@Entity("employees")
export class EmployeeEntity extends IdEntity {
  @Column({ length: 36, unique: true }) userId!: string
  @Column({ length: 20, unique: true }) employeeNumber!: string
  @Column({ length: 100 }) position!: string
  @Column({ type: "varchar", length: 100, nullable: true }) department!: string | null
  @Column({ type: "varchar", length: 50, unique: true, nullable: true }) rfidCardUid!: string | null
  @Column({ type: "date" }) dateHired!: string
  @Column({ type: "date", nullable: true }) dateTerminated!: string | null
  @Column({ type: "enum", enum: EmploymentStatus, default: EmploymentStatus.ACTIVE }) employmentStatus!: EmploymentStatus
  @Column({ type: "decimal", precision: 10, scale: 2 }) basicSalary!: string
  @Column({ type: "enum", enum: SalaryType }) salaryType!: SalaryType
}

export enum AttendanceStatus {
  ON_TIME = "on_time",
  LATE = "late",
  OVERTIME = "overtime",
  INCOMPLETE = "incomplete",
  ABSENT = "absent",
}

export enum AttendanceMethod {
  RFID = "rfid",
  MANUAL = "manual",
  PIN = "pin",
}

@Entity("attendance_logs")
export class AttendanceLogEntity extends IdEntity {
  @Column({ length: 36 }) employeeId!: string
  @Column({ type: "date" }) logDate!: string
  @Column({ type: "datetime" }) clockIn!: Date
  @Column({ type: "datetime", nullable: true }) clockOut!: Date | null
  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true }) totalHours!: string | null
  @Column({ type: "int", default: 0 }) lateMinutes!: number
  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 }) overtimeHours!: string
  @Column({ type: "enum", enum: AttendanceStatus, default: AttendanceStatus.ON_TIME }) status!: AttendanceStatus
  @Column({ type: "enum", enum: AttendanceMethod, default: AttendanceMethod.RFID }) method!: AttendanceMethod
  @Column({ type: "varchar", length: 50, nullable: true }) rfidCardUidUsed!: string | null
  @Column({ type: "text", nullable: true }) notes!: string | null
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("deduction_types")
export class DeductionTypeEntity extends IdEntity {
  @Column({ length: 100 }) name!: string
  @Column({ default: false }) isMandatory!: boolean
  @Column({ default: true }) isActive!: boolean
}

export enum PayrollStatus { OPEN = "open", PROCESSING = "processing", CLOSED = "closed" }
@Entity("payroll_periods")
export class PayrollPeriodEntity extends IdEntity {
  @Column({ type: "date" }) periodStart!: string
  @Column({ type: "date" }) periodEnd!: string
  @Column({ type: "enum", enum: PayrollStatus, default: PayrollStatus.OPEN }) status!: PayrollStatus
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("payroll_records")
export class PayrollRecordEntity extends IdEntity {
  @Column({ length: 36 }) employeeId!: string
  @Column({ length: 36 }) payrollPeriodId!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) grossPay!: string
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) totalDeductions!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) netPay!: string
  @Column({ length: 36 }) processedByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) processedAt!: Date
}

@Entity("payroll_deductions")
export class PayrollDeductionEntity extends IdEntity {
  @Column({ length: 36 }) payrollRecordId!: string
  @Column({ length: 36 }) deductionTypeId!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) amount!: string
  @Column({ type: "varchar", length: 255, nullable: true }) notes!: string | null
}

@Entity("employee_schedules")
export class EmployeeScheduleEntity extends IdEntity {
  @Column({ length: 36 }) userId!: string
  @Column({ type: "date" }) shiftDate!: string
  @Column({ type: "time" }) startTime!: string
  @Column({ type: "time" }) endTime!: string
  @Column({ length: 36 }) createdByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("discount_types")
export class DiscountTypeEntity extends IdEntity {
  @Column({ length: 100 }) name!: string
  @Column({ type: "decimal", precision: 5, scale: 2 }) percentage!: string
  @Column({ default: true }) requiresIdVerification!: boolean
  @Column({ default: true }) isActive!: boolean
}

@Entity("order_discounts")
export class OrderDiscountEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 36 }) discountTypeId!: string
  @Column({ type: "varchar", length: 50, nullable: true }) idNumber!: string | null
  @Column({ length: 100 }) holderName!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) discountAmount!: string
  @Column({ length: 36 }) appliedByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

export enum PromotionType { PERCENTAGE = "percentage", FIXED_AMOUNT = "fixed_amount", BUY_X_GET_Y = "buy_x_get_y" }
@Entity("promotions")
export class PromotionEntity extends IdEntity {
  @Column({ length: 150 }) name!: string
  @Column({ type: "text", nullable: true }) description!: string | null
  @Column({ type: "enum", enum: PromotionType }) promoType!: PromotionType
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true }) discountValue!: string | null
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true }) minSpend!: string | null
  @Column({ type: "date" }) startDate!: string
  @Column({ type: "date" }) endDate!: string
  @Column({ type: "int", nullable: true }) usageLimit!: number | null
  @Column({ default: 0 }) usageCount!: number
  @Column({ default: true }) isActive!: boolean
  @Column({ length: 36 }) createdByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("promotion_items")
export class PromotionItemEntity {
  @PrimaryColumn({ length: 36 }) promotionId!: string
  @PrimaryColumn({ length: 36 }) menuItemId!: string
}

@Entity("order_promotions")
export class OrderPromotionEntity extends IdEntity {
  @Column({ length: 36 }) orderId!: string
  @Column({ length: 36 }) promotionId!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) discountAmount!: string
  @CreateDateColumn({ type: "datetime" }) appliedAt!: Date
}

export enum PrinterLocation { KITCHEN = "kitchen", COUNTER = "counter" }
export enum ConnectionType { NETWORK = "network", USB = "usb", BLUETOOTH = "bluetooth" }
@Entity("printers")
export class PrinterEntity extends IdEntity {
  @Column({ length: 100 }) name!: string
  @Column({ type: "enum", enum: PrinterLocation }) location!: PrinterLocation
  @Column({ type: "enum", enum: ConnectionType }) connectionType!: ConnectionType
  @Column({ type: "varchar", length: 50, nullable: true }) ipAddress!: string | null
  @Column({ default: true }) isActive!: boolean
}

@Entity("audit_logs")
export class AuditLogEntity extends IdEntity {
  @Column({ type: "varchar", length: 36, nullable: true }) userId!: string | null
  @Column({ length: 100 }) action!: string
  @Column({ length: 50 }) entityType!: string
  @Column({ length: 36 }) entityId!: string
  @Column({ type: "json", nullable: true }) details!: object | null
  @Column({ type: "varchar", length: 45, nullable: true }) ipAddress!: string | null
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

export enum StockLogType {
  STOCK_IN = "stock_in",
  ADJUSTMENT = "adjustment",
  WASTE = "waste",
  CONSUMED = "consumed",
}

export enum StockItemType {
  INGREDIENT = "ingredient",
  MENU_ITEM = "menu_item",
}

@Entity("inventory_categories")
export class InventoryCategoryEntity extends IdEntity {
  @Column({ length: 100 }) name!: string
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("inventory_items")
export class InventoryItemEntity extends TimestampedEntity {
  @Column({ type: "varchar", length: 36, nullable: true }) categoryId!: string | null
  @Column({ length: 150 }) name!: string
  @Column({ length: 30 }) unit!: string
  @Column({ type: "decimal", precision: 10, scale: 3, default: 0 }) stockQuantity!: string
  @Column({ type: "decimal", precision: 10, scale: 3, nullable: true }) reorderThreshold!: string | null
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true }) unitCost!: string | null
  @Column({ type: "varchar", length: 150, nullable: true }) supplier!: string | null
  @Column({ default: true }) isActive!: boolean
}

@Entity("inventory_stock_logs")
export class InventoryStockLogEntity extends IdEntity {
  @Column({ type: "enum", enum: StockItemType, default: StockItemType.INGREDIENT }) itemType!: StockItemType
  @Column({ type: "varchar", length: 36, nullable: true }) inventoryItemId!: string | null
  @Column({ type: "varchar", length: 36, nullable: true }) menuItemId!: string | null
  @Column({ type: "enum", enum: StockLogType }) type!: StockLogType
  @Column({ type: "decimal", precision: 10, scale: 3 }) quantityChange!: string
  @Column({ type: "decimal", precision: 10, scale: 3, nullable: true }) quantityAfter!: string | null
  @Column({ type: "varchar", length: 255, nullable: true }) note!: string | null
  @Column({ length: 36 }) performedByStaffId!: string
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("menu_item_ingredients")
export class MenuItemIngredientEntity {
  @PrimaryColumn({ type: "varchar", length: 36 }) menuItemId!: string
  @PrimaryColumn({ type: "varchar", length: 36 }) inventoryItemId!: string
  @Column({ type: "decimal", precision: 10, scale: 3 }) quantityUsed!: string
}

@Entity("expense_categories")
export class ExpenseCategoryEntity extends IdEntity {
  @Column({ length: 100, unique: true }) name!: string
  @Column({ default: true }) isActive!: boolean
  @CreateDateColumn({ type: "datetime" }) createdAt!: Date
}

@Entity("expenses")
export class ExpenseEntity extends TimestampedEntity {
  @Column({ type: "varchar", length: 36 }) categoryId!: string
  @Column({ length: 255 }) description!: string
  @Column({ type: "decimal", precision: 10, scale: 2 }) amount!: string
  @Column({ type: "date" }) expenseDate!: string
  @Column({ type: "varchar", length: 100, nullable: true }) receiptReference!: string | null
  @Column({ type: "text", nullable: true }) notes!: string | null
  @Column({ type: "varchar", length: 36 }) recordedByStaffId!: string
}

@Entity("system_settings")
export class SystemSettingEntity extends IdEntity {
  @Column({ length: 150, default: "PRIME Roast & Grill" }) restaurantName!: string
  @Column({ length: 100, default: "Main Branch - Manila" }) branchName!: string
  @Column({ length: 50, default: "+63 917 123 4567" }) contactNumber!: string
  @Column({ length: 100, default: "contact@primerestaurant.ph" }) email!: string
  @Column({ type: "text" }) address!: string
  @Column({ type: "varchar", length: 50, nullable: true }) tinNumber!: string | null
  @Column({ type: "varchar", length: 50, nullable: true }) birMin!: string | null
  @Column({ length: 10, default: "₱" }) currencySymbol!: string
  @Column({ length: 10, default: "PHP" }) currencyCode!: string
  @Column({ length: 50, default: "Asia/Manila" }) timezone!: string
  @Column({ default: true }) vatEnabled!: boolean
  @Column({ type: "decimal", precision: 5, scale: 2, default: 12 }) vatRate!: string
  @Column({ default: true }) vatInclusive!: boolean
  @Column({ default: false }) serviceChargeEnabled!: boolean
  @Column({ type: "decimal", precision: 5, scale: 2, default: 5 }) serviceChargeRate!: string
  @Column({ default: true }) seniorPwdDiscountEnabled!: boolean
  @Column({ length: 20, default: "ORD-" }) orderNumberPrefix!: string
  @Column({ default: false }) autoAcceptQrOrders!: boolean
  @Column({ default: true }) requireTableSelection!: boolean
  @Column({ default: true }) managerApprovalForVoids!: boolean
  @Column({ type: "int", default: 10 }) lowStockThresholdAlert!: number
  @Column({ type: "text", nullable: true }) receiptHeader!: string | null
  @Column({ type: "text", nullable: true }) receiptFooter!: string | null
  @Column({ default: true }) printReceiptAuto!: boolean
  @Column({ default: true }) printKotAuto!: boolean
  @Column({ default: true }) showWifiOnReceipt!: boolean
  @Column({ type: "varchar", length: 100, nullable: true }) wifiSsid!: string | null
  @Column({ type: "varchar", length: 100, nullable: true }) wifiPassword!: string | null
  @Column({ length: 10, default: "08:00" }) openingTime!: string
  @Column({ length: 10, default: "22:00" }) closingTime!: string
  @Column({ default: true }) cashDrawerOpeningBalanceRequired!: boolean
  @UpdateDateColumn({ type: "datetime" }) updatedAt!: Date
}

export const domainEntities = [
  AccountEntity, SessionEntity, VerificationTokenEntity,
  RoleEntity, PermissionEntity, RolePermissionEntity, CustomerEntity,
  CategoryEntity, MenuItemEntity, RestaurantTableEntity, OrderEntity,
  OrderItemEntity, OrderStatusHistoryEntity, OrderVoidEntity, ReservationEntity,
  PaymentEntity, LoyaltySettingEntity, LoyaltyTransactionEntity, LoyaltyRewardEntity,
  EmployeeEntity, DeductionTypeEntity, PayrollPeriodEntity, PayrollRecordEntity,
  PayrollDeductionEntity, EmployeeScheduleEntity, DiscountTypeEntity,
  OrderDiscountEntity, PromotionEntity, PromotionItemEntity, OrderPromotionEntity,
  PrinterEntity, AuditLogEntity,
  InventoryCategoryEntity, InventoryItemEntity, InventoryStockLogEntity, MenuItemIngredientEntity,
  ExpenseCategoryEntity, ExpenseEntity,
  SystemSettingEntity,
  AttendanceLogEntity,
]


