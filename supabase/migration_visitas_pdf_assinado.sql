-- Adicionar coluna para PDF assinado e data de assinatura
ALTER TABLE visitas
  ADD COLUMN IF NOT EXISTS pdf_assinado_url text,
  ADD COLUMN IF NOT EXISTS data_assinatura  timestamptz;
