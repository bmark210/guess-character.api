-- Add new columns
ALTER TABLE base_entities ADD COLUMN IF NOT EXISTS chapter INTEGER NOT NULL DEFAULT 1;
ALTER TABLE base_entities ADD COLUMN IF NOT EXISTS verse INTEGER NOT NULL DEFAULT 1;

-- Update existing records
UPDATE base_entities
SET 
  chapter = CAST(SUBSTRING(mention FROM 'Быт\.\s*(\d+):\d+' FOR 1) AS INTEGER),
  verse = CAST(SUBSTRING(mention FROM 'Быт\.\s*\d+:(\d+)' FOR 1) AS INTEGER)
WHERE mention ~ 'Быт\.\s*\d+:\d+'; 