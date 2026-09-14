import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1789426800000
  implements MigrationInterface
{
  name = 'CreateNotificationsTable1789426800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'NEW_REQUEST',
        'REQUEST_ACCEPTED',
        'REQUEST_REJECTED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_id" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "skillName" text NOT NULL,
        "fromUser" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_recipient"
          FOREIGN KEY ("recipient_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_recipient"
      ON "notifications" ("recipient_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_recipient_created_at"
      ON "notifications" ("recipient_id", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."idx_notifications_recipient_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_notifications_recipient"
    `);

    await queryRunner.query(`
      DROP TABLE "notifications"
    `);

    await queryRunner.query(`
      DROP TYPE "notification_type_enum"
    `);
  }
}
