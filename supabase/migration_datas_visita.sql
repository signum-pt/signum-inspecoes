-- data_agendada: data original ao criar a visita (nunca sobrescrita)
-- data_inicio: quando o técnico clicou "Marcar em curso"
alter table visitas
  add column if not exists data_agendada date,
  add column if not exists data_inicio date;

-- Preencher data_agendada com data_visita para visitas existentes
update visitas set data_agendada = data_visita where data_agendada is null;
