import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1789619731103 implements MigrationInterface {
    name = 'UpdateSchema1789619731103'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Inventory module tables
        await queryRunner.query(`CREATE TABLE \`inventory_categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`inventory_items\` (\`id\` varchar(36) NOT NULL, \`categoryId\` varchar(36) NULL, \`name\` varchar(150) NOT NULL, \`unit\` varchar(30) NOT NULL, \`stockQuantity\` decimal(10,3) NOT NULL DEFAULT '0.000', \`reorderThreshold\` decimal(10,3) NULL, \`unitCost\` decimal(10,2) NULL, \`supplier\` varchar(150) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`inventory_stock_logs\` (\`id\` varchar(36) NOT NULL, \`itemType\` enum ('ingredient', 'menu_item') NOT NULL, \`inventoryItemId\` varchar(36) NULL, \`menuItemId\` varchar(36) NULL, \`type\` enum ('stock_in', 'adjustment', 'waste', 'consumed') NOT NULL, \`quantityChange\` decimal(10,3) NOT NULL, \`quantityAfter\` decimal(10,3) NULL, \`note\` varchar(255) NULL, \`performedByStaffId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`menu_item_ingredients\` (\`menuItemId\` varchar(36) NOT NULL, \`inventoryItemId\` varchar(36) NOT NULL, \`quantityUsed\` decimal(10,3) NOT NULL, PRIMARY KEY (\`menuItemId\`, \`inventoryItemId\`)) ENGINE=InnoDB`);

        // Expenses module tables
        await queryRunner.query(`CREATE TABLE \`expense_categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c2ad823a0e6fa6c91a0c79db14\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`expenses\` (\`id\` varchar(36) NOT NULL, \`categoryId\` varchar(36) NOT NULL, \`description\` varchar(255) NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`expenseDate\` date NOT NULL, \`receiptReference\` varchar(100) NULL, \`notes\` text NULL, \`recordedByStaffId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // System POS Settings table
        await queryRunner.query(`CREATE TABLE \`system_settings\` (\`id\` varchar(36) NOT NULL, \`restaurantName\` varchar(150) NOT NULL DEFAULT 'PRIME Roast & Grill', \`branchName\` varchar(100) NOT NULL DEFAULT 'Main Branch - Manila', \`contactNumber\` varchar(50) NOT NULL DEFAULT '+63 917 123 4567', \`email\` varchar(100) NOT NULL DEFAULT 'contact@primerestaurant.ph', \`address\` text NOT NULL, \`tinNumber\` varchar(50) NULL, \`birMin\` varchar(50) NULL, \`currencySymbol\` varchar(10) NOT NULL DEFAULT '₱', \`currencyCode\` varchar(10) NOT NULL DEFAULT 'PHP', \`timezone\` varchar(50) NOT NULL DEFAULT 'Asia/Manila', \`vatEnabled\` tinyint NOT NULL DEFAULT 1, \`vatRate\` decimal(5,2) NOT NULL DEFAULT '12.00', \`vatInclusive\` tinyint NOT NULL DEFAULT 1, \`serviceChargeEnabled\` tinyint NOT NULL DEFAULT 0, \`serviceChargeRate\` decimal(5,2) NOT NULL DEFAULT '5.00', \`seniorPwdDiscountEnabled\` tinyint NOT NULL DEFAULT 1, \`orderNumberPrefix\` varchar(20) NOT NULL DEFAULT 'ORD-', \`autoAcceptQrOrders\` tinyint NOT NULL DEFAULT 0, \`requireTableSelection\` tinyint NOT NULL DEFAULT 1, \`managerApprovalForVoids\` tinyint NOT NULL DEFAULT 1, \`lowStockThresholdAlert\` int NOT NULL DEFAULT 10, \`receiptHeader\` text NULL, \`receiptFooter\` text NULL, \`printReceiptAuto\` tinyint NOT NULL DEFAULT 1, \`printKotAuto\` tinyint NOT NULL DEFAULT 1, \`showWifiOnReceipt\` tinyint NOT NULL DEFAULT 1, \`wifiSsid\` varchar(100) NULL, \`wifiPassword\` varchar(100) NULL, \`openingTime\` varchar(10) NOT NULL DEFAULT '08:00', \`closingTime\` varchar(10) NOT NULL DEFAULT '22:00', \`cashDrawerOpeningBalanceRequired\` tinyint NOT NULL DEFAULT 1, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // RFID Attendance Logs table
        await queryRunner.query(`CREATE TABLE \`attendance_logs\` (\`id\` varchar(36) NOT NULL, \`employeeId\` varchar(36) NOT NULL, \`logDate\` date NOT NULL, \`clockIn\` datetime(6) NOT NULL, \`clockOut\` datetime(6) NULL, \`totalHours\` decimal(5,2) NULL, \`lateMinutes\` int NOT NULL DEFAULT 0, \`overtimeHours\` decimal(5,2) NOT NULL DEFAULT '0.00', \`status\` enum ('on_time', 'late', 'overtime', 'incomplete', 'absent') NOT NULL DEFAULT 'on_time', \`method\` enum ('rfid', 'manual', 'pin') NOT NULL DEFAULT 'rfid', \`rfidCardUidUsed\` varchar(50) NULL, \`notes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

        // Employees table updates: department and rfidCardUid
        await queryRunner.query(`ALTER TABLE \`employees\` ADD \`department\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`employees\` ADD \`rfidCardUid\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`employees\` ADD UNIQUE INDEX \`IDX_f6db59846b0e9f1a25db8e79ac\` (\`rfidCardUid\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employees\` DROP INDEX \`IDX_f6db59846b0e9f1a25db8e79ac\``);
        await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`rfidCardUid\``);
        await queryRunner.query(`ALTER TABLE \`employees\` DROP COLUMN \`department\``);
        await queryRunner.query(`DROP TABLE \`attendance_logs\``);
        await queryRunner.query(`DROP TABLE \`system_settings\``);
        await queryRunner.query(`DROP TABLE \`expenses\``);
        await queryRunner.query(`DROP INDEX \`IDX_c2ad823a0e6fa6c91a0c79db14\` ON \`expense_categories\``);
        await queryRunner.query(`DROP TABLE \`expense_categories\``);
        await queryRunner.query(`DROP TABLE \`menu_item_ingredients\``);
        await queryRunner.query(`DROP TABLE \`inventory_stock_logs\``);
        await queryRunner.query(`DROP TABLE \`inventory_items\``);
        await queryRunner.query(`DROP TABLE \`inventory_categories\``);
    }
}
