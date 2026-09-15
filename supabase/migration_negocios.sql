-- ============================================================
-- SIGNUM — Negócios (propostas / pipeline comercial)
--
-- Fluxo:
--   pendente → aprovado → em_execucao → concluido → faturar → faturado
--                ↓ (rejeitado)
--            cancelado
--
-- Quando passa a "em_execucao":
--   - O campo n_processo fica preenchido (processo criado ou associado)
--   - Os trabalhos do negócio tornam-se trabalhos do processo
--
-- Executar no Supabase SQL Editor após migration_processos.sql.
-- ============================================================

-- ------------------------------------------------------------
-- NEGOCIOS
-- Proposta comercial. Pode ou não estar ligada a um processo
-- (processos) e a uma loja (lojas).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negocios (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  designacao      text NOT NULL,
  requerente_id   uuid REFERENCES requerentes(id) ON DELETE SET NULL,
  loja_id         uuid REFERENCES lojas(id) ON DELETE SET NULL,
  n_processo      integer REFERENCES processos(n_processo) ON DELETE SET NULL,

  -- Pipeline
  status          text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','em_execucao','concluido','faturar','faturado','cancelado')),

  -- Contexto
  concelho        text,
  observacoes     text,
  id_comercial    uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- quem gere o negócio

  -- Financeiro (opcional, para referência)
  valor_proposta  numeric(10,2),
  faturado_em     timestamptz,

  criado_por      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negocios_status      ON negocios(status);
CREATE INDEX IF NOT EXISTS idx_negocios_requerente  ON negocios(requerente_id) WHERE requerente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_negocios_loja        ON negocios(loja_id) WHERE loja_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_negocios_processo    ON negocios(n_processo) WHERE n_processo IS NOT NULL;

ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negocios_select" ON negocios FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "negocios_insert" ON negocios FOR INSERT
  TO authenticated WITH CHECK (get_user_role() IN ('admin', 'escritorio'));
CREATE POLICY "negocios_update" ON negocios FOR UPDATE
  TO authenticated USING (get_user_role() IN ('admin', 'escritorio'));
CREATE POLICY "negocios_delete" ON negocios FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION update_negocios_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER negocios_atualizado_em
  BEFORE UPDATE ON negocios
  FOR EACH ROW EXECUTE FUNCTION update_negocios_atualizado_em();

-- ------------------------------------------------------------
-- NEGOCIO_SERVICOS
-- Os serviços/trabalhos que compõem a proposta.
-- Cada linha é um item do orçamento.
-- Quando o negócio passa a "em_execucao", cada item
-- pode gerar um trabalho no processo associado.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negocio_servicos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id      uuid NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  servico_id      uuid REFERENCES servicos(id) ON DELETE SET NULL,
  especialidade   text,                     -- texto livre se servico_id for null
  descricao       text,
  quantidade      integer NOT NULL DEFAULT 1,
  valor_unit      numeric(10,2),
  -- Ligação ao trabalho criado após aprovação (preenchido em on_aprovacao)
  trabalho_id     uuid REFERENCES trabalhos(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negocio_servicos_negocio ON negocio_servicos(negocio_id);

ALTER TABLE negocio_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negocio_servicos_select" ON negocio_servicos FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "negocio_servicos_insert" ON negocio_servicos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() IN ('admin', 'escritorio'));
CREATE POLICY "negocio_servicos_update" ON negocio_servicos FOR UPDATE
  TO authenticated USING (get_user_role() IN ('admin', 'escritorio'));
CREATE POLICY "negocio_servicos_delete" ON negocio_servicos FOR DELETE
  TO authenticated USING (get_user_role() IN ('admin', 'escritorio'));

-- ------------------------------------------------------------
-- NEGOCIO_HISTORICO
-- Registo de cada mudança de status (audit trail).
-- Permite ver quem aprovou, quando, com que nota.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negocio_historico (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id      uuid NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo     text NOT NULL,
  nota            text,
  autor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negocio_historico_negocio ON negocio_historico(negocio_id);

ALTER TABLE negocio_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negocio_historico_select" ON negocio_historico FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "negocio_historico_insert" ON negocio_historico FOR INSERT
  TO authenticated WITH CHECK (true);
