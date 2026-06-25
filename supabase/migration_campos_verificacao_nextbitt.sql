-- Campos de verificação para mapeamento com Nextbitt (pm_jobchs)
-- Cada campo corresponde a um item do checklist "Fecho Global de OTs Preventiva"
-- Tipo: escolha_multipla com opções OK / NOK / Sem Aplicação

insert into campos (nome, chave, tipo, unidade, descricao, opcoes, sistema) values
  ('Verificação Terras Proteção',              'verif_terras_protecao',          'escolha_multipla', '', 'Nextbitt: Verificação Terras Proteção',              '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Salas Técnicas',               'verif_salas_tecnicas',           'escolha_multipla', '', 'Nextbitt: Verificação Salas Técnicas',               '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Posto Transformação',          'verif_posto_transformacao',       'escolha_multipla', '', 'Nextbitt: Verificação Posto Transformação',          '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Gerador',                      'verif_gerador',                  'escolha_multipla', '', 'Nextbitt: Verificação Gerador',                      '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Carport',                      'verif_carport',                  'escolha_multipla', '', 'Nextbitt: Verificação Carport',                      '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação UPAC',                         'verif_upac',                     'escolha_multipla', '', 'Nextbitt: Verificação UPAC',                         '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação QGBT',                         'verif_qgbt',                     'escolha_multipla', '', 'Nextbitt: Verificação QGBT',                         '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação UPS Geral',                    'verif_ups_geral',                'escolha_multipla', '', 'Nextbitt: Verificação UPS Geral',                    '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação UPS Segurança',                'verif_ups_seg',                  'escolha_multipla', '', 'Nextbitt: Verificação UPS Seg',                      '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Quadros Elétricos Normal',     'verif_quadros_normal',           'escolha_multipla', '', 'Nextbitt: Verificação Quadros Elétricos Normal',     '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Quadros Elétricos Emergência', 'verif_quadros_emergencia',       'escolha_multipla', '', 'Nextbitt: Verificação Quadros Elétricos Emergência/UPS', '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Quadro AVAC',                  'verif_quadro_avac',              'escolha_multipla', '', 'Nextbitt: Verificação Quadro AVAC',                  '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Quadro Frio',                  'verif_quadro_frio',              'escolha_multipla', '', 'Nextbitt: Verificação Quadro frio',                  '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Mobilidade Elétrica',          'verif_mobilidade_eletrica',      'escolha_multipla', '', 'Nextbitt: Verificação Mobilidade Elétrica',          '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Botoneira Corte Geral',        'verif_botoneira_corte',          'escolha_multipla', '', 'Nextbitt: Verificação Botoneira Corte Geral',        '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Iluminação Normal',            'verif_iluminacao_normal',        'escolha_multipla', '', 'Nextbitt: Verificação Iluminação Normal',            '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Iluminação Emergência',        'verif_iluminacao_emergencia',    'escolha_multipla', '', 'Nextbitt: Verificação Iluminação Emergência',        '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Proteções Diferenciais',       'verif_protecoes_diferenciais',   'escolha_multipla', '', 'Nextbitt: Verificação Proteções Diferenciais',       '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Tomadas',                      'verif_tomadas',                  'escolha_multipla', '', 'Nextbitt: Verificação Tomadas',                      '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Caminhos de Cabos',            'verif_caminhos_cabos',           'escolha_multipla', '', 'Nextbitt: Verificação Caminhos Cabos',               '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Limpeza e Manutenção',         'verif_limpeza_manutencao',       'escolha_multipla', '', 'Nextbitt: Verificação Limpeza e Manutenção',         '["OK","NOK","Sem Aplicação"]', true),
  ('Verificação Zona Pública',                 'verif_zona_publica',             'escolha_multipla', '', 'Nextbitt: Verificação Zona. Publico',                '["OK","NOK","Sem Aplicação"]', true)
on conflict (chave) do nothing;
