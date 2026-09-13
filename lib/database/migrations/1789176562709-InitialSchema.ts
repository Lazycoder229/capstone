import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789176562709 implements MigrationInterface {
    name = 'InitialSchema1789176562709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`roleId\` varchar(36) NULL, \`email\` varchar(255) NULL, \`passwordHash\` varchar(255) NULL, \`name\` varchar(100) NULL, \`contactNumber\` varchar(20) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`lastLoginAt\` datetime NULL, \`emailVerified\` datetime NULL, \`image\` varchar(500) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`accounts\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`type\` varchar(255) NOT NULL, \`provider\` varchar(255) NOT NULL, \`providerAccountId\` varchar(255) NOT NULL, \`refresh_token\` text NULL, \`access_token\` text NULL, \`expires_at\` bigint NULL, \`token_type\` text NULL, \`scope\` text NULL, \`id_token\` text NULL, \`session_state\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`sessionToken\` varchar(255) NOT NULL, \`userId\` varchar(36) NOT NULL, \`expires\` datetime NOT NULL, UNIQUE INDEX \`IDX_8b5e2ec52e335c0fe16d7ec358\` (\`sessionToken\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`verification_tokens\` (\`id\` varchar(36) NOT NULL, \`identifier\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`expires\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(50) NOT NULL, \`description\` text NULL, \`isSystem\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(100) NOT NULL, \`module\` varchar(50) NOT NULL, \`description\` text NULL, UNIQUE INDEX \`IDX_8dad765629e83229da6feda1c1\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permissions\` (\`roleId\` varchar(36) NOT NULL, \`permissionId\` varchar(36) NOT NULL, PRIMARY KEY (\`roleId\`, \`permissionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`customers\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`email\` varchar(255) NULL, \`password\` varchar(255) NULL, \`name\` varchar(100) NOT NULL, \`contactNumber\` varchar(20) NULL, \`loyaltyPointsBalance\` int NOT NULL DEFAULT '0', \`isGuest\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_8536b8b85c06969f84f0c098b0\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`sortOrder\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`menu_items\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoryId\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`price\` decimal(10,2) NOT NULL, \`imageUrl\` varchar(500) NULL, \`isAvailable\` tinyint NOT NULL DEFAULT 1, \`stockQuantity\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`restaurant_tables\` (\`id\` varchar(36) NOT NULL, \`tableNumber\` varchar(20) NOT NULL, \`capacity\` int NOT NULL, \`qrCodeUrl\` varchar(500) NULL, \`status\` enum ('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_497e2d042911b040b6c56e3e21\` (\`tableNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`orderNumber\` varchar(30) NOT NULL, \`tableId\` varchar(36) NULL, \`customerId\` varchar(36) NULL, \`orderType\` enum ('qr', 'counter') NOT NULL, \`status\` enum ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', \`subtotal\` decimal(10,2) NOT NULL, \`discount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`tax\` decimal(10,2) NOT NULL DEFAULT '0.00', \`total\` decimal(10,2) NOT NULL, \`createdByStaffId\` varchar(36) NULL, UNIQUE INDEX \`IDX_59b0c3b34ea0fa5562342f2414\` (\`orderNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`menuItemId\` varchar(36) NOT NULL, \`quantity\` int NOT NULL, \`unitPrice\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, \`notes\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_status_history\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`status\` varchar(30) NOT NULL, \`changedByStaffId\` varchar(36) NULL, \`changedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_voids\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`requestedByStaffId\` varchar(36) NOT NULL, \`approvedByStaffId\` varchar(36) NULL, \`reason\` text NOT NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`requestedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`resolvedAt\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reservations\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(36) NULL, \`customerName\` varchar(100) NOT NULL, \`contactNumber\` varchar(20) NOT NULL, \`email\` varchar(255) NULL, \`tableId\` varchar(36) NULL, \`reservationDate\` date NOT NULL, \`reservationTime\` time NOT NULL, \`numberOfGuests\` int NOT NULL, \`status\` enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show') NOT NULL DEFAULT 'pending', \`notes\` text NULL, \`createdByStaffId\` varchar(36) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payments\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`receiptNumber\` varchar(30) NOT NULL, \`amountPaid\` decimal(10,2) NOT NULL, \`paymentMethod\` enum ('cash', 'gcash', 'card', 'other') NOT NULL, \`referenceNumber\` varchar(100) NULL, \`processedByStaffId\` varchar(36) NOT NULL, \`paidAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ccf1990399854743306e7ab852\` (\`receiptNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`loyalty_settings\` (\`id\` varchar(36) NOT NULL, \`pointsPerPeso\` decimal(5,2) NOT NULL DEFAULT '1.00', \`pesoValuePerPoint\` decimal(5,2) NOT NULL DEFAULT '0.50', \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`loyalty_transactions\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(36) NOT NULL, \`orderId\` varchar(36) NULL, \`type\` enum ('earn', 'redeem') NOT NULL, \`points\` int NOT NULL, \`balanceAfter\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`loyalty_rewards\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`pointsCost\` int NOT NULL, \`description\` text NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`employees\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`employeeNumber\` varchar(20) NOT NULL, \`position\` varchar(100) NOT NULL, \`dateHired\` date NOT NULL, \`dateTerminated\` date NULL, \`employmentStatus\` enum ('active', 'on_leave', 'terminated') NOT NULL DEFAULT 'active', \`basicSalary\` decimal(10,2) NOT NULL, \`salaryType\` enum ('daily', 'monthly') NOT NULL, UNIQUE INDEX \`IDX_737991e10350d9626f592894ce\` (\`userId\`), UNIQUE INDEX \`IDX_1de36734659e4fb0b941bd4b6e\` (\`employeeNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`deduction_types\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`isMandatory\` tinyint NOT NULL DEFAULT 0, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payroll_periods\` (\`id\` varchar(36) NOT NULL, \`periodStart\` date NOT NULL, \`periodEnd\` date NOT NULL, \`status\` enum ('open', 'processing', 'closed') NOT NULL DEFAULT 'open', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payroll_records\` (\`id\` varchar(36) NOT NULL, \`employeeId\` varchar(36) NOT NULL, \`payrollPeriodId\` varchar(36) NOT NULL, \`grossPay\` decimal(10,2) NOT NULL, \`totalDeductions\` decimal(10,2) NOT NULL DEFAULT '0.00', \`netPay\` decimal(10,2) NOT NULL, \`processedByStaffId\` varchar(36) NOT NULL, \`processedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payroll_deductions\` (\`id\` varchar(36) NOT NULL, \`payrollRecordId\` varchar(36) NOT NULL, \`deductionTypeId\` varchar(36) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`notes\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`employee_schedules\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, \`shiftDate\` date NOT NULL, \`startTime\` time NOT NULL, \`endTime\` time NOT NULL, \`createdByStaffId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`discount_types\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`percentage\` decimal(5,2) NOT NULL, \`requiresIdVerification\` tinyint NOT NULL DEFAULT 1, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_discounts\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`discountTypeId\` varchar(36) NOT NULL, \`idNumber\` varchar(50) NULL, \`holderName\` varchar(100) NOT NULL, \`discountAmount\` decimal(10,2) NOT NULL, \`appliedByStaffId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotions\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`promoType\` enum ('percentage', 'fixed_amount', 'buy_x_get_y') NOT NULL, \`discountValue\` decimal(10,2) NULL, \`minSpend\` decimal(10,2) NULL, \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`usageLimit\` int NULL, \`usageCount\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdByStaffId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotion_items\` (\`promotionId\` varchar(36) NOT NULL, \`menuItemId\` varchar(36) NOT NULL, PRIMARY KEY (\`promotionId\`, \`menuItemId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_promotions\` (\`id\` varchar(36) NOT NULL, \`orderId\` varchar(36) NOT NULL, \`promotionId\` varchar(36) NOT NULL, \`discountAmount\` decimal(10,2) NOT NULL, \`appliedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`printers\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`location\` enum ('kitchen', 'counter') NOT NULL, \`connectionType\` enum ('network', 'usb', 'bluetooth') NOT NULL, \`ipAddress\` varchar(50) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(36) NULL, \`action\` varchar(100) NOT NULL, \`entityType\` varchar(50) NOT NULL, \`entityId\` varchar(36) NOT NULL, \`details\` json NULL, \`ipAddress\` varchar(45) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`accounts\` ADD CONSTRAINT \`FK_3aa23c0a6d107393e8b40e3e2a6\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_57de40bc620f456c7311aa3a1e6\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_57de40bc620f456c7311aa3a1e6\``);
        await queryRunner.query(`ALTER TABLE \`accounts\` DROP FOREIGN KEY \`FK_3aa23c0a6d107393e8b40e3e2a6\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`printers\``);
        await queryRunner.query(`DROP TABLE \`order_promotions\``);
        await queryRunner.query(`DROP TABLE \`promotion_items\``);
        await queryRunner.query(`DROP TABLE \`promotions\``);
        await queryRunner.query(`DROP TABLE \`order_discounts\``);
        await queryRunner.query(`DROP TABLE \`discount_types\``);
        await queryRunner.query(`DROP TABLE \`employee_schedules\``);
        await queryRunner.query(`DROP TABLE \`payroll_deductions\``);
        await queryRunner.query(`DROP TABLE \`payroll_records\``);
        await queryRunner.query(`DROP TABLE \`payroll_periods\``);
        await queryRunner.query(`DROP TABLE \`deduction_types\``);
        await queryRunner.query(`DROP INDEX \`IDX_1de36734659e4fb0b941bd4b6e\` ON \`employees\``);
        await queryRunner.query(`DROP INDEX \`IDX_737991e10350d9626f592894ce\` ON \`employees\``);
        await queryRunner.query(`DROP TABLE \`employees\``);
        await queryRunner.query(`DROP TABLE \`loyalty_rewards\``);
        await queryRunner.query(`DROP TABLE \`loyalty_transactions\``);
        await queryRunner.query(`DROP TABLE \`loyalty_settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_ccf1990399854743306e7ab852\` ON \`payments\``);
        await queryRunner.query(`DROP TABLE \`payments\``);
        await queryRunner.query(`DROP TABLE \`reservations\``);
        await queryRunner.query(`DROP TABLE \`order_voids\``);
        await queryRunner.query(`DROP TABLE \`order_status_history\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_59b0c3b34ea0fa5562342f2414\` ON \`orders\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_497e2d042911b040b6c56e3e21\` ON \`restaurant_tables\``);
        await queryRunner.query(`DROP TABLE \`restaurant_tables\``);
        await queryRunner.query(`DROP TABLE \`menu_items\``);
        await queryRunner.query(`DROP TABLE \`categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_8536b8b85c06969f84f0c098b0\` ON \`customers\``);
        await queryRunner.query(`DROP TABLE \`customers\``);
        await queryRunner.query(`DROP TABLE \`role_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_8dad765629e83229da6feda1c1\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP TABLE \`verification_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_8b5e2ec52e335c0fe16d7ec358\` ON \`sessions\``);
        await queryRunner.query(`DROP TABLE \`sessions\``);
        await queryRunner.query(`DROP TABLE \`accounts\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
