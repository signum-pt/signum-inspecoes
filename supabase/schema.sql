-- ============================================================
-- SIGNUM — Schema completo
-- 1. Apagar tudo primeiro:
--    DROP TABLE IF EXISTS agendamentos, visita_respostas, visita_fotos, visitas,
--      template_campos, template_secoes, templates, lojas, entidades CASCADE;
--    DROP TABLE IF EXISTS profiles CASCADE;
--    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--    DROP FUNCTION IF EXISTS handle_new_user(), set_updated_at(), get_user_role();
-- 2. Depois executar este ficheiro completo.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (tem de vir ANTES da função get_user_role)
-- ============================================================
CREATE TABLE profiles (
  id        uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email     text NOT NULL,
  nome      text NOT NULL,
  role      text NOT NULL CHECK (role IN ('admin','tecnico','escritorio')) DEFAULT 'tecnico',
  ativo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNÇÃO AUXILIAR (criada depois de profiles existir)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    new.id, new.email,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    COALESCE(new.raw_user_meta_data->>'role','tecnico')
  );
  RETURN new;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Políticas RLS — profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING ((select auth.uid()) = id OR get_user_role() = 'admin');
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- ENTIDADES
-- ============================================================
CREATE TABLE entidades (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       text NOT NULL,
  logo_url   text,
  cor        text NOT NULL DEFAULT '#D41317',
  notas      text NOT NULL DEFAULT '',
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE entidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entidades_select" ON entidades FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "entidades_insert" ON entidades FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "entidades_update" ON entidades FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "entidades_delete" ON entidades FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- LOJAS
-- ============================================================
CREATE TABLE lojas (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade_id         uuid NOT NULL REFERENCES entidades(id),
  nome                text NOT NULL,
  morada              text NOT NULL DEFAULT '',
  cidade              text NOT NULL DEFAULT '',
  codigo_postal       text NOT NULL DEFAULT '',
  distrito            text,
  contacto            text NOT NULL DEFAULT '',
  email_contacto      text NOT NULL DEFAULT '',
  notas               text NOT NULL DEFAULT '',
  -- Alimentação geral
  cpe                 text NOT NULL DEFAULT '',
  tipo_alimentacao    text NOT NULL DEFAULT '',
  tensao              text NOT NULL DEFAULT '',
  potencia_contratada text NOT NULL DEFAULT '',
  disjuntor_geral     text NOT NULL DEFAULT '',
  -- Posto de Transformação (PT)
  tem_pt              boolean NOT NULL DEFAULT false,
  pt_kva              text NOT NULL DEFAULT '',
  pt_tipo             text NOT NULL DEFAULT '',
  -- Grupo Gerador
  tem_gerador         boolean NOT NULL DEFAULT false,
  gerador_kva         text NOT NULL DEFAULT '',
  -- Quadros elétricos US
  quadro_us_voltagem  text NOT NULL DEFAULT '',
  quadro_us_uc        text NOT NULL DEFAULT '',
  -- UPS
  tem_ups             boolean NOT NULL DEFAULT false,
  ups_kva             text NOT NULL DEFAULT '',
  -- Transformador de isolamento
  tem_trafo_isolamento    boolean NOT NULL DEFAULT false,
  trafo_isolamento_kva    text NOT NULL DEFAULT '',
  -- Bateria de condensadores
  tem_bateria_condensadores boolean NOT NULL DEFAULT false,
  bateria_condensadores_kvar text NOT NULL DEFAULT '',
  -- PAC
  tem_pac             boolean NOT NULL DEFAULT false,
  -- UPAC
  tem_upac            boolean NOT NULL DEFAULT false,
  upac_kva            text NOT NULL DEFAULT '',
  -- PCVE
  tem_pcve            boolean NOT NULL DEFAULT false,
  pcve_kva            text NOT NULL DEFAULT '',
  ativo               boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lojas_entidade_id ON lojas(entidade_id);
CREATE POLICY "lojas_select" ON lojas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "lojas_insert" ON lojas FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','tecnico'));
CREATE POLICY "lojas_update" ON lojas FOR UPDATE
  USING (get_user_role() IN ('admin','tecnico'));
CREATE POLICY "lojas_delete" ON lojas FOR DELETE
  USING (get_user_role() IN ('admin','tecnico'));

-- ============================================================
-- CAMPOS (biblioteca global de campos reutilizáveis)
-- ============================================================
CREATE TABLE campos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        text NOT NULL,
  chave       text NOT NULL UNIQUE,
  tipo        text NOT NULL CHECK (tipo IN (
                'texto','numero','sim_nao','escolha_multipla','data','foto','observacao'
              )),
  unidade     text NOT NULL DEFAULT '',
  descricao   text NOT NULL DEFAULT '',
  opcoes      jsonb NOT NULL DEFAULT '[]',
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE campos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campos_select" ON campos FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "campos_insert" ON campos FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "campos_update" ON campos FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "campos_delete" ON campos FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE TABLE templates (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade_id  uuid NOT NULL REFERENCES entidades(id),
  nome         text NOT NULL,
  descricao    text NOT NULL DEFAULT '',
  versao       integer NOT NULL DEFAULT 1,
  ativo        boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_templates_entidade_id ON templates(entidade_id);
CREATE POLICY "templates_select" ON templates FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "templates_insert" ON templates FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "templates_update" ON templates FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "templates_delete" ON templates FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- SECÇÕES DOS TEMPLATES
-- ============================================================
CREATE TABLE template_secoes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  ordem       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE template_secoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_template_secoes_template_id ON template_secoes(template_id);
CREATE POLICY "secoes_select" ON template_secoes FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "secoes_insert" ON template_secoes FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "secoes_update" ON template_secoes FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "secoes_delete" ON template_secoes FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- CAMPOS DENTRO DE CADA SECÇÃO
-- ============================================================
CREATE TABLE template_campos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  secao_id    uuid NOT NULL REFERENCES template_secoes(id) ON DELETE CASCADE,
  campo_id    uuid NOT NULL REFERENCES campos(id),
  obrigatorio boolean NOT NULL DEFAULT false,
  ordem       integer NOT NULL DEFAULT 0,
  placeholder text NOT NULL DEFAULT ''
);
ALTER TABLE template_campos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_template_campos_secao_id ON template_campos(secao_id);
CREATE INDEX idx_template_campos_campo_id ON template_campos(campo_id);
CREATE POLICY "tcampos_select" ON template_campos FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "tcampos_insert" ON template_campos FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "tcampos_update" ON template_campos FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "tcampos_delete" ON template_campos FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- VISITAS
-- ============================================================
CREATE TABLE visitas (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id             uuid NOT NULL REFERENCES lojas(id),
  tecnico_id          uuid NOT NULL REFERENCES profiles(id),
  template_id         uuid NOT NULL REFERENCES templates(id),
  template_versao     integer NOT NULL DEFAULT 1,
  data_visita         date NOT NULL,
  estado              text NOT NULL CHECK (estado IN ('agendada','rascunho','em_curso','concluida','assinada')) DEFAULT 'rascunho',
  nome_cliente        text NOT NULL DEFAULT '',
  observacoes_gerais  text NOT NULL DEFAULT '',
  assinatura_cliente  text,
  pdf_assinado_url    text,
  data_assinatura     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_visitas_loja_id     ON visitas(loja_id);
CREATE INDEX idx_visitas_tecnico_id  ON visitas(tecnico_id);
CREATE INDEX idx_visitas_template_id ON visitas(template_id);
CREATE POLICY "visitas_select" ON visitas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "visitas_insert" ON visitas FOR INSERT
  WITH CHECK ((select auth.uid()) = tecnico_id);
CREATE POLICY "visitas_update" ON visitas FOR UPDATE
  USING ((select auth.uid()) = tecnico_id OR get_user_role() = 'admin');
CREATE POLICY "visitas_delete" ON visitas FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- RESPOSTAS DAS VISITAS
-- ============================================================
CREATE TABLE visita_respostas (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id     uuid NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
  campo_id      uuid NOT NULL REFERENCES campos(id),
  valor_texto   text,
  valor_numero  numeric,
  valor_bool    boolean,
  valor_data    date,
  valor_opcoes  jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(visita_id, campo_id)
);
ALTER TABLE visita_respostas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_visita_respostas_campo_id ON visita_respostas(campo_id);
CREATE POLICY "respostas_select" ON visita_respostas FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "respostas_insert" ON visita_respostas FOR INSERT
  WITH CHECK (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );
CREATE POLICY "respostas_update" ON visita_respostas FOR UPDATE
  USING (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );
CREATE POLICY "respostas_delete" ON visita_respostas FOR DELETE
  USING (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );

-- ============================================================
-- FOTOS DAS VISITAS
-- ============================================================
CREATE TABLE visita_fotos (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id  uuid NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
  campo_id   uuid REFERENCES campos(id),
  url        text NOT NULL,
  legenda    text NOT NULL DEFAULT '',
  ordem      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE visita_fotos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_visita_fotos_visita_id ON visita_fotos(visita_id);
CREATE INDEX idx_visita_fotos_campo_id  ON visita_fotos(campo_id);
CREATE POLICY "fotos_select" ON visita_fotos FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "fotos_insert" ON visita_fotos FOR INSERT
  WITH CHECK (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );
CREATE POLICY "fotos_update" ON visita_fotos FOR UPDATE
  USING (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );
CREATE POLICY "fotos_delete" ON visita_fotos FOR DELETE
  USING (
    (select auth.uid()) = (SELECT tecnico_id FROM visitas WHERE id = visita_id)
    OR get_user_role() = 'admin'
  );

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
CREATE TABLE agendamentos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id     uuid REFERENCES lojas(id),
  tecnico_id  uuid REFERENCES profiles(id),
  titulo      text NOT NULL,
  descricao   text NOT NULL DEFAULT '',
  data_inicio timestamptz NOT NULL,
  data_fim    timestamptz NOT NULL,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agendamentos_loja_id    ON agendamentos(loja_id);
CREATE INDEX idx_agendamentos_tecnico_id ON agendamentos(tecnico_id);
CREATE INDEX idx_agendamentos_created_by ON agendamentos(created_by);
CREATE POLICY "agend_select" ON agendamentos FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "agend_insert" ON agendamentos FOR INSERT
  WITH CHECK (get_user_role() IN ('admin','tecnico'));
CREATE POLICY "agend_update" ON agendamentos FOR UPDATE
  USING (get_user_role() IN ('admin','tecnico'));
CREATE POLICY "agend_delete" ON agendamentos FOR DELETE
  USING (get_user_role() IN ('admin','tecnico'));

-- ============================================================
-- CONFIGURAÇÕES
-- ============================================================
CREATE TABLE configuracoes (
  chave      text PRIMARY KEY,
  valor      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_select" ON configuracoes FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "config_insert" ON configuracoes FOR INSERT
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "config_update" ON configuracoes FOR UPDATE
  USING (get_user_role() = 'admin');
CREATE POLICY "config_delete" ON configuracoes FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER visitas_updated_at   BEFORE UPDATE ON visitas   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VIEW útil para pesquisas
-- ============================================================
CREATE OR REPLACE VIEW v_pesquisa_campos AS
SELECT
  vr.visita_id,
  v.data_visita,
  v.estado,
  l.nome  AS loja,
  e.nome  AS entidade,
  p.nome  AS tecnico,
  c.nome  AS campo_nome,
  c.chave AS campo_chave,
  c.tipo  AS campo_tipo,
  c.unidade,
  COALESCE(vr.valor_texto, vr.valor_numero::text, vr.valor_bool::text, vr.valor_data::text) AS valor
FROM visita_respostas vr
JOIN visitas   v ON v.id = vr.visita_id
JOIN lojas     l ON l.id = v.loja_id
JOIN entidades e ON e.id = l.entidade_id
JOIN profiles  p ON p.id = v.tecnico_id
JOIN campos    c ON c.id = vr.campo_id;
