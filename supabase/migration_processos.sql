-- ============================================================
-- SIGNUM — Processos, Trabalhos, Requerentes, Serviços
-- Fase 1: modelo de dados base para gestão de processos
--
-- Executar no Supabase SQL Editor após o schema.sql existente.
-- ============================================================

-- ------------------------------------------------------------
-- REQUERENTES
-- Empresa/entidade legal que solicita o trabalho.
-- Diferente de 'entidades' (marcas como Continente, Aldi).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requerentes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  nif         text,
  email       text,
  telefone    text,
  morada      text,
  cod_postal  text,
  localidade  text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requerentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requerentes_select" ON requerentes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "requerentes_insert" ON requerentes FOR INSERT
  TO authenticated WITH CHECK (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "requerentes_update" ON requerentes FOR UPDATE
  TO authenticated USING (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "requerentes_delete" ON requerentes FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- SERVIÇOS
-- Tipos de serviço / especialidade (lookup).
-- Populado com a lista validada do projeto PHP.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicos (
  id      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome    text NOT NULL UNIQUE,
  ativo   boolean NOT NULL DEFAULT true,
  ordem   integer NOT NULL DEFAULT 0
);

ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicos_select" ON servicos FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "servicos_insert" ON servicos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "servicos_update" ON servicos FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "servicos_delete" ON servicos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Dados base — lista validada contra o projeto PHP e fases do índice
INSERT INTO servicos (nome, ativo, ordem) VALUES
  ('Elétrico',                       true,  10),
  ('PCVE',                           true,  20),
  ('SCIE',                           true,  30),
  ('GÁS',                            true,  40),
  ('ITED/ITUR',                      true,  50),
  ('Pedido de Viabilidade BT',       true,  60),
  ('Pedido de Viabilidade MT',       true,  70),
  ('Pedido de Viabilidade Misto',    true,  80),
  ('PLR BT',                         true,  90),
  ('PLR MT',                         true, 100),
  ('PLR Misto',                      true, 110),
  ('Termografia',                    true, 120),
  ('Vistorias',                      true, 130),
  ('Averbamento',                    true, 140),
  ('Suporte',                        true, 150),
  ('Visitas Semestrais / Explorações', true, 160),
  ('Comunicação Prévia',             true, 170),
  ('Licenciamento Câmara',           true, 180),
  ('Execução ECVE',                  true, 190),
  ('Vistoria ECVE',                  true, 200),
  ('Vistoria Tipo A',                true, 210),
  ('Vistoria Tipo B',                true, 220),
  ('Vistoria Tipo C',                true, 230),
  ('MAPs',                           true, 240),
  ('Pedido de Viabilidade',          true, 250)
ON CONFLICT (nome) DO NOTHING;

-- ------------------------------------------------------------
-- PROCESSOS
-- Identidade permanente de um cliente/local.
-- PK = integer que preserva numeração real da empresa.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processos (
  n_processo    integer PRIMARY KEY,  -- número real da empresa, não UUID
  designacao    text NOT NULL,         -- ex: "ITM Fafe", "KFC Pinhal Novo"
  requerente_id uuid REFERENCES requerentes(id) ON DELETE SET NULL,
  concelho      text,
  loja_id       uuid REFERENCES lojas(id) ON DELETE SET NULL,  -- ponte opcional para inspeções
  aberto        boolean NOT NULL DEFAULT true,
  notas         text,
  primeiro_ano  integer,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processos_designacao ON processos USING gin(to_tsvector('portuguese', designacao));
CREATE INDEX IF NOT EXISTS idx_processos_loja ON processos(loja_id) WHERE loja_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processos_aberto ON processos(aberto);

ALTER TABLE processos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processos_select" ON processos FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "processos_insert" ON processos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "processos_update" ON processos FOR UPDATE
  TO authenticated USING (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "processos_delete" ON processos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_processos_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER processos_atualizado_em
  BEFORE UPDATE ON processos
  FOR EACH ROW EXECUTE FUNCTION update_processos_atualizado_em();

-- ------------------------------------------------------------
-- TRABALHOS
-- O que se fez num ano, dentro de um processo.
-- Unidade do kanban.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trabalhos (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  n_processo     integer NOT NULL REFERENCES processos(n_processo) ON DELETE CASCADE,
  ano            integer NOT NULL,
  servico_id     uuid REFERENCES servicos(id) ON DELETE SET NULL,
  especialidade  text,   -- texto livre; preenchido na importação; substituído por servico_id no uso normal
  estado         text NOT NULL DEFAULT 'a fazer'
    CHECK (estado IN ('a fazer', 'urgente', 'em curso', 'pendente', 'concluído', 'cancelado')),
  tecnico_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  prazo          date,
  nota_pendente  text,
  visita_id      uuid REFERENCES visitas(id) ON DELETE SET NULL,  -- link opcional para visita de inspeção
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trabalhos_processo ON trabalhos(n_processo);
CREATE INDEX IF NOT EXISTS idx_trabalhos_estado   ON trabalhos(estado);
CREATE INDEX IF NOT EXISTS idx_trabalhos_ano      ON trabalhos(ano);
CREATE INDEX IF NOT EXISTS idx_trabalhos_tecnico  ON trabalhos(tecnico_id) WHERE tecnico_id IS NOT NULL;

ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trabalhos_select" ON trabalhos FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "trabalhos_insert" ON trabalhos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "trabalhos_update" ON trabalhos FOR UPDATE
  TO authenticated USING (get_user_role() IN ('admin', 'tecnico'));
CREATE POLICY "trabalhos_delete" ON trabalhos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION update_trabalhos_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trabalhos_atualizado_em
  BEFORE UPDATE ON trabalhos
  FOR EACH ROW EXECUTE FUNCTION update_trabalhos_atualizado_em();

-- ------------------------------------------------------------
-- PROCESSO_NOTAS
-- Notas/comentários visíveis por toda a equipa no processo.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processo_notas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  n_processo  integer NOT NULL REFERENCES processos(n_processo) ON DELETE CASCADE,
  autor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nota        text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processo_notas_processo ON processo_notas(n_processo);

ALTER TABLE processo_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_notas_select" ON processo_notas FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "processo_notas_insert" ON processo_notas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "processo_notas_delete" ON processo_notas FOR DELETE
  TO authenticated USING (auth.uid() = autor_id OR get_user_role() = 'admin');
