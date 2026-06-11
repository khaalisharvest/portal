import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1749600000000 implements MigrationInterface {
  name = 'InitialSchema1749600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration documents the baseline schema.
    // On a fresh database, TypeORM synchronize:true (development) or the initial
    // docker-compose deploy created the schema. This migration is a no-op for existing
    // installations but establishes the migration baseline for future changes.
    //
    // Future schema changes MUST be added as new migration files via:
    //   yarn migration:generate -- -n DescriptiveName
    //
    // To verify current schema matches entities on a fresh DB:
    //   yarn migration:run
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: this is a baseline marker migration
  }
}
