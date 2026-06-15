-- Add payment method and phone number fields to models table
ALTER TABLE public.models
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS kisa_id text,
ADD COLUMN IF NOT EXISTS payment_method jsonb default null;
