import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateBranchesTable1791536800000 implements MigrationInterface {
  name = "CreateBranchesTable1791536800000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`branches\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`code\` varchar(30) NOT NULL,
        \`type\` varchar(20) NOT NULL DEFAULT 'branch',
        \`address\` text NULL,
        \`contactNumber\` varchar(50) NULL,
        \`email\` varchar(120) NULL,
        \`isMain\` tinyint NOT NULL DEFAULT 0,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_branches_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`branches\``)
  }
}
