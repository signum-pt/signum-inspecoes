-- Alterar tem_pt e tem_gerador_seguranca de sim_nao para escolha_multipla (OK/NOK/Sem Aplicação)
-- ATENÇÃO: respostas anteriores com valor_bool serão ignoradas após esta alteração

update campos
set tipo = 'escolha_multipla',
    opcoes = '["OK","NOK","Sem Aplicação"]'
where chave in ('tem_pt', 'tem_gerador_seguranca');

-- Migrar respostas existentes: true → "OK", false → "NOK"
update visita_respostas
set valor_opcoes = case when valor_bool = true then '["OK"]'::jsonb else '["NOK"]'::jsonb end,
    valor_bool = null
where campo_id in (select id from campos where chave in ('tem_pt', 'tem_gerador_seguranca'))
  and valor_bool is not null;
