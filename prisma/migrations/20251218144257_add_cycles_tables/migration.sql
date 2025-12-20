-- CreateTable
CREATE TABLE "cycles" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'daily',
    "status" TEXT NOT NULL,
    "note" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_data" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "asset_hint" TEXT,
    "payload" JSONB NOT NULL,
    "checksum" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalized_data" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "value" DECIMAL(65,30),
    "unit" TEXT,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "normalize_version" TEXT NOT NULL,
    "raw_id" TEXT NOT NULL,

    CONSTRAINT "normalized_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "asset_code" TEXT,
    "direction" TEXT,
    "strength" INTEGER,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "based_on_ids" TEXT[],
    "note" TEXT,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "confidence" DECIMAL(65,30),
    "horizon" TEXT,
    "summary" TEXT NOT NULL,
    "signal_refs" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "intelligence_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_context_analysis" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "confidence" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_context_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SignalToIntelligence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SignalToIntelligence_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "cycles_status_idx" ON "cycles"("status");

-- CreateIndex
CREATE INDEX "raw_data_cycle_id_idx" ON "raw_data"("cycle_id");

-- CreateIndex
CREATE INDEX "raw_data_source_idx" ON "raw_data"("source");

-- CreateIndex
CREATE INDEX "raw_data_data_type_idx" ON "raw_data"("data_type");

-- CreateIndex
CREATE INDEX "normalized_data_asset_code_effective_at_idx" ON "normalized_data"("asset_code", "effective_at");

-- CreateIndex
CREATE INDEX "normalized_data_cycle_id_idx" ON "normalized_data"("cycle_id");

-- CreateIndex
CREATE INDEX "signals_cycle_id_idx" ON "signals"("cycle_id");

-- CreateIndex
CREATE INDEX "signals_signal_type_idx" ON "signals"("signal_type");

-- CreateIndex
CREATE INDEX "intelligence_context_idx" ON "intelligence"("context");

-- CreateIndex
CREATE INDEX "intelligence_cycle_id_idx" ON "intelligence"("cycle_id");

-- CreateIndex
CREATE INDEX "_SignalToIntelligence_B_index" ON "_SignalToIntelligence"("B");

-- AddForeignKey
ALTER TABLE "raw_data" ADD CONSTRAINT "raw_data_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_data" ADD CONSTRAINT "normalized_data_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_data" ADD CONSTRAINT "normalized_data_raw_id_fkey" FOREIGN KEY ("raw_id") REFERENCES "raw_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence" ADD CONSTRAINT "intelligence_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_intelligence_id_fkey" FOREIGN KEY ("intelligence_id") REFERENCES "intelligence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_context_analysis" ADD CONSTRAINT "ai_context_analysis_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SignalToIntelligence" ADD CONSTRAINT "_SignalToIntelligence_A_fkey" FOREIGN KEY ("A") REFERENCES "intelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SignalToIntelligence" ADD CONSTRAINT "_SignalToIntelligence_B_fkey" FOREIGN KEY ("B") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
