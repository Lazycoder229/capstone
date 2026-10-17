import type { MigrationInterface, QueryRunner } from "typeorm"

export class SetLoyaltyPointRates1792960000000 implements MigrationInterface {
  name = "SetLoyaltyPointRates1792960000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` CHANGE COLUMN `points_per_peso` `points_per_tier` int NOT NULL DEFAULT 5"
    )
    await queryRunner.query(
      "UPDATE `loyalty_settings` SET `points_per_tier` = 5, `peso_value_per_point` = 0.25"
    )
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `peso_value_per_point` SET DEFAULT 0.25"
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` CHANGE COLUMN `points_per_tier` `points_per_peso` decimal(5,2) NOT NULL DEFAULT '1.00'"
    )
    await queryRunner.query(
      "ALTER TABLE `loyalty_settings` ALTER COLUMN `peso_value_per_point` SET DEFAULT 0.50"
    )
  }
}
