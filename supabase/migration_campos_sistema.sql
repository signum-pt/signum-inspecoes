-- Limpar tudo (ordem respeita foreign keys)
delete from visita_respostas;
delete from visita_fotos;
delete from visitas;
delete from template_campos;
delete from template_secoes;
delete from templates;
delete from secoes_globais_campos;
delete from secoes_globais;
delete from campos;

-- Adicionar flag de sistema
alter table campos add column if not exists sistema boolean not null default false;

-- Campos de sistema (chave coincide com coluna da tabela lojas → pré-preenchimento automático)
insert into campos (nome, chave, tipo, unidade, descricao, opcoes, sistema) values
  ('CPE',                         'cpe',                        'texto',   '',     'Código do Ponto de Entrega',        '[]', true),
  ('Tipo de alimentação',         'tipo_alimentacao',           'texto',   '',     'MT, BT ou BTN',                    '[]', true),
  ('Tem PT',                      'tem_pt',                     'sim_nao', '',     'Posto de Transformação',           '[]', true),
  ('PT — Potência',               'pt_kva',                     'numero',  'kVA',  '',                                 '[]', true),
  ('PT — Tipo',                   'pt_tipo',                    'texto',   '',     'CA, CB, AI, AS ou ED',             '[]', true),
  ('PT — Transformador',          'pt_transformador',           'texto',   'kVA',  '',                                 '[]', true),
  ('PT — Nº PTC',                 'pt_num_ptc',                 'texto',   '',     '',                                 '[]', true),
  ('Tem gerador',                 'tem_gerador',                'sim_nao', '',     'Grupo gerador',                    '[]', true),
  ('Gerador — Potência',          'gerador_kva',                'numero',  'kVA',  '',                                 '[]', true),
  ('Quadros — US',                'quadro_us_voltagem',         'numero',  'V',    '',                                 '[]', true),
  ('Quadros — UC',                'quadro_us_uc',               'numero',  'V',    '',                                 '[]', true),
  ('Tem UPS',                     'tem_ups',                    'sim_nao', '',     '',                                 '[]', true),
  ('UPS — Potência',              'ups_kva',                    'numero',  'kVA',  '',                                 '[]', true),
  ('Tem trafo. isolamento',       'tem_trafo_isolamento',       'sim_nao', '',     '',                                 '[]', true),
  ('Trafo. isolamento — Potência','trafo_isolamento_kva',       'numero',  'kVA',  '',                                 '[]', true),
  ('Tem bateria condensadores',   'tem_bateria_condensadores',  'sim_nao', '',     '',                                 '[]', true),
  ('Bat. condensadores — Pot. reativa','bateria_condensadores_kvar','numero','kvar','',                                '[]', true),
  ('Tem PAC',                     'tem_pac',                    'sim_nao', '',     'Posto Abastecimento Combustível',  '[]', true),
  ('Tem UPAC',                    'tem_upac',                   'sim_nao', '',     'Produção para Autoconsumo',        '[]', true),
  ('UPAC — Potência',             'upac_kva',                   'numero',  'kVA',  '',                                 '[]', true),
  ('Tem PCVE',                    'tem_pcve',                   'sim_nao', '',     'Carregamento Veículos Elétricos',  '[]', true),
  ('PCVE — Potência',             'pcve_kva',                   'numero',  'kVA',  '',                                 '[]', true);
