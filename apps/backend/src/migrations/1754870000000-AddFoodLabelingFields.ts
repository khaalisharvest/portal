import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFoodLabelingFields1754870000000 implements MigrationInterface {
  name = 'AddFoodLabelingFields1754870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingredients" text`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "nutritionalInfo" json`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "expiryInfo" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "batchNumber" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cprNumber" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergens" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manufacturerInfo" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "manufacturerInfo"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "allergens"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "cprNumber"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "batchNumber"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "expiryInfo"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nutritionalInfo"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "ingredients"`);
  }
}
