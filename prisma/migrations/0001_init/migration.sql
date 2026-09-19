CREATE TABLE "legacy_rows" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_rows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legacy_rows_table_name_key_key" ON "legacy_rows"("table_name", "key");
CREATE INDEX "legacy_rows_table_name_idx" ON "legacy_rows"("table_name");
