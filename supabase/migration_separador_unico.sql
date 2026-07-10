-- Criar campo separador canónico (partilhado por todos os templates)
insert into campos (nome, chave, tipo, unidade, descricao, opcoes, sistema)
values ('—', 'separador', 'separador', '', '', '[]', true)
on conflict (chave) do nothing;

-- Redirecionar todos os template_campos que usam sep_* para o separador canónico
update template_campos
set campo_id = (select id from campos where chave = 'separador')
where campo_id in (select id from campos where chave like 'sep_%');

-- Apagar apenas os separadores duplicados que já não têm referências
delete from campos
where chave like 'sep_%'
  and id not in (select campo_id from template_campos);
