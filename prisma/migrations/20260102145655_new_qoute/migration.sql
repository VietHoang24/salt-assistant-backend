-- CreateTable
CREATE TABLE "user_daily_quotes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_daily_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_daily_quotes_user_id_idx" ON "user_daily_quotes"("user_id");

-- CreateIndex
CREATE INDEX "user_daily_quotes_date_idx" ON "user_daily_quotes"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_quotes_user_id_date_key" ON "user_daily_quotes"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_daily_quotes" ADD CONSTRAINT "user_daily_quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
