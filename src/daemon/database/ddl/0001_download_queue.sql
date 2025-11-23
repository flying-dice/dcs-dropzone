-- Migration: Add Download Queue Table
-- Description: Persistent download queue for resumable downloads with retry logic

CREATE TABLE IF NOT EXISTS "DOWNLOAD_QUEUE" (
  -- Identity & Location
  "id" TEXT PRIMARY KEY NOT NULL,
  "url" TEXT NOT NULL,
  "target_directory" TEXT NOT NULL,
  "filename" TEXT,
  
  -- State Management
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Progress Tracking
  "progress_percent" INTEGER DEFAULT 0,
  "progress_summary" TEXT,
  
  -- Retry Metadata
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 3,
  "next_retry_at" INTEGER,
  
  -- Process Management
  "pid" INTEGER,
  
  -- Audit
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

-- Index for efficient queue polling
CREATE INDEX IF NOT EXISTS "idx_download_queue_status_retry" 
  ON "DOWNLOAD_QUEUE" ("status", "next_retry_at");

-- Index for job lookup
CREATE INDEX IF NOT EXISTS "idx_download_queue_id" 
  ON "DOWNLOAD_QUEUE" ("id");
