-- Adicionar campos elétricos à tabela lojas
-- Alimentação geral
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS cpe                 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_alimentacao    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tensao              text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS potencia_contratada text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS disjuntor_geral     text NOT NULL DEFAULT '';

-- Posto de Transformação (PT)
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_pt    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pt_kva    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pt_tipo   text NOT NULL DEFAULT '';

-- Grupo Gerador
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_gerador  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gerador_kva  text NOT NULL DEFAULT '';

-- Quadros elétricos US
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS quadro_us_voltagem text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS quadro_us_uc       text NOT NULL DEFAULT '';

-- UPS
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_ups  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ups_kva  text NOT NULL DEFAULT '';

-- Transformador de isolamento
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_trafo_isolamento boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trafo_isolamento_kva text NOT NULL DEFAULT '';

-- Bateria de condensadores
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_bateria_condensadores  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bateria_condensadores_kvar text NOT NULL DEFAULT '';

-- PAC
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_pac boolean NOT NULL DEFAULT false;

-- UPAC
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_upac boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upac_kva text NOT NULL DEFAULT '';

-- PCVE
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS tem_pcve boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pcve_kva text NOT NULL DEFAULT '';
