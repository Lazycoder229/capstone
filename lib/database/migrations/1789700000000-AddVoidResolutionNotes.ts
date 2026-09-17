import { MigrationInterface, QueryRunner } from "typeorm"

export class AddVoidResolutionNotes1789700000000 implements MigrationInterface {
  name = "AddVoidResolutionNotes1789700000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `order_voids` ADD `resolutionNotes` text NULL",
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `order_voids` DROP COLUMN `resolutionNotes`",
    )
  }
}
