-- Migration: Add unique constraint to transaction_number (PostgreSQL/Supabase)
-- Run this manually in your Supabase SQL Editor

-- Step 1: Remove duplicates (keep the first occurrence)
DELETE FROM transactions 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY transaction_number ORDER BY id) as rn
        FROM transactions
    ) t
    WHERE t.rn > 1
);

-- Step 2: Add unique constraint
ALTER TABLE transactions 
ADD CONSTRAINT uk_transactions_transaction_number 
UNIQUE (transaction_number);

-- Verify the constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
AND conname = 'uk_transactions_transaction_number';
