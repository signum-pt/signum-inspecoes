# Signum — consolidar tudo neste projeto

Documento de passagem entre sessões. Contém o que foi apurado a analisar os
dados reais da empresa e os projetos existentes.

**Decisão tomada:** este projeto (Next.js + Supabase) passa a ser o portal
único. O que existe em PHP é portado para cá.

---

## 1. Os três projetos

| Caminho | O quê | Estado |
|---|---|---|
| `...\Projetos Signum\signum-inspecoes` | **este** — Next.js 16, Supabase, Vercel. Visitas e inspeções | funciona, nunca foi apresentado à gerência |
| `...\Projetos Signum\signum` | PHP 8 + MySQL. Processos, negócios, trabalhos, kanban, PDF | quase completo, parado, local |
| `C:\Users\renato\Desktop\Signum\IndiceProcessos` | Python. Índice da NAS e do mapa de processos | a funcionar |

### O projeto PHP é a ESPECIFICAÇÃO, não é código a deitar fora

Tem o modelo de negócio já validado contra a realidade da empresa:

```
app/Models/        21 modelos (ver secção 3)
app/Services/      as regras de negócio
app/Controllers/   20 controladores
database/migrations/   26 migrations MySQL
app/Views/         50 views — 19.931 linhas, com CSS e JS inline
tests/             PHPUnit, Unit + Integration
```

**Antes de modelar seja o que for, ir lá ver como está feito.** Foi tentado
desenhar do zero e o resultado ficou mais pobre do que o que já existia.

O que se deita fora são as **views** — 25 das 50 têm `<style>` inline, 29 têm
`<script>` inline, algumas passam das mil linhas. É essa camada, e só essa,
que motivou a mudança de tecnologia.

---

## 2. Contexto de negócio

Signum — engenharia, licenciamento e inspeções. Clientes são sobretudo
cadeias de retalho: Intermarché (ITM), Aldi, Continente (CNT), KFC, Burger
King (BK), Pizza Hut (PH), JYSK, Kiwoko, Pingo Doce (PD), Bricomarché (BM),
Repsol. Mais obras avulsas: moradias, prédios, lares, câmaras.

### Três níveis

```
processo   1500  "Loja X"           identidade permanente do cliente/local
trabalho   26-1500                  o que se fez nesse ano
serviços   licenciamento, execução  o "pack" vendido
```

### Regras apuradas com o cliente

- **O número de processo só nasce quando a proposta é aceite.** Por isso o
  "negócio" (proposta) é entidade separada do processo.
- **O processo dura mais do que a insígnia.** O processo 354 foi
  "ITM Gandara Leiria" em 2024 e "Roady Gandara Leiria" em 2026.
- **Um pack pode partir-se entre anos.** Licenciamento em dezembro, execução
  a continuar em janeiro: abre-se pasta no ano novo e a correspondência
  passa a ser arquivada aí.
- **Um trabalho só termina quando todos os serviços do pack terminarem.**
- O mapa de processos (Excel) arranca no processo ~1100 (2018/19). Os
  anteriores só entram quando se volta a trabalhar neles — daí os buracos na
  numeração. Não é falha, é o método.

### Armadilha

A coluna `Ano Criado` do Excel é **o ano do PROCESSO, não do trabalho**.
Divergem em 29% dos casos. Cruzar dados por (processo, ano) produz centenas
de falsos erros. Cruzar por processo.

### Estrutura da empresa

```
chefia
secretaria de gestão        ─┐
técnicos eletrotécnicos      ├─ cada um com um coordenador
técnicos no exterior        ─┘
```

O `profiles.role` atual (`admin | tecnico | escritorio`) não exprime isto:
são dois eixos — o setor, e se é coordenador. **Nota:** `escritorio` está
declarado no CHECK mas não aparece em nenhuma das 48 políticas RLS
existentes; quem o tiver hoje não consegue fazer nada.

---

## 3. O modelo de dados que já existe em PHP

Modelos, por ordem de peso (linhas de código — indica onde está a lógica):

```
Trabalho             444    Processo          389    User        391
Negocio              290    Tecnico           276    Requerente  174
NegocioTrabalho      164    AuditLog          151    Role        138
TrabalhoEstados      139    Notificacao       111    Servico     105
ImovelCpe             93    LoginThrottle      95    ProcessoNota 85
Loja                  85    Localizacao        74    ProcessoHistorico 74
Imovel                71    NegocioHistorico   63    LoginAudit   42
```

### Estados do trabalho — o coração do kanban

Definidos em `app/Models/TrabalhoEstados.php`, com prioridade de ordenação:

```
A_FAZER      prioridade 1
URGENTE      prioridade 1   (mesma que a_fazer)
EM_CURSO     prioridade 2
PENDENTE     prioridade 3
CONCLUIDO    prioridade 4
CANCELADO    prioridade 5
```

Há também `CONCLUIDO_LEGACY = 'concluido'` — resíduo de uma duplicação
('concluído' vs 'concluido') já normalizada. Ver no ficheiro antes de portar.

### O kanban já está implementado

```
app/Views/trabalhos/kanban.php   1118 linhas
app/Views/negocios/kanban.php     616 linhas
```

Neste projeto já existe `@dnd-kit` instalado. É portar comportamento, não
desenhar de novo.

### Migrations a ler com atenção

```
2026-01-27_006_normalize_estados_trabalho.sql
2026-01-29_002_add_permissions_negocios.sql
2026-01-29_003_add_permissions_access.sql
2026-01-30_001_add_negocio_faturacao.sql
2026-02-09_001_create_audit_log.sql
2026-02-09_005_create_notificacoes.sql
```

---

## 4. A NAS — restrição dura

Dois volumes:

- `\\NAS\Dados1` — anos recentes, `A-TRABALHOS_<ano>\CLIENTE\<AA>-<NNNN>_NOME`
- `\\Nas\arquivo_(dados3)` — arquivo, **sem** estrutura de ano, convenções
  antigas. Lá não se atribuem números de processo.

Os emails são arquivados em `<trabalho>\Correspondência\` como `.msg` mais
uma pasta com o mesmo nome contendo os anexos. Convenção de nome acordada:
`001-AAAAMMDD - Descrição`.

### O site na nuvem NUNCA acede à NAS

Não conseguiria — IP privado, atrás da firewall. E não deve.

```
DENTRO DA REDE                      NA NUVEM
NAS ──leitura──► agente ──envia──► Supabase ──► portal
```

O portal guarda apenas o **caminho em texto**. Nunca tem credenciais da NAS.
Se o Supabase for comprometido, o atacante fica com nomes e caminhos, não
com ficheiros. Para abrir uma pasta: mostrar o caminho com botão "copiar";
o utilizador cola no Explorador, dentro da rede.

Este ponto foi discutido com o cliente e é um requisito, não uma preferência.

---

## 5. Dados reais prontos a importar

O projeto `IndiceProcessos` produz `resultados/indice.sqlite` com:

- **1394 processos**, 1434 trabalhos, 37 com histórico de mais de um ano
- **2939 pastas** indexadas nos dois volumes (1908 numeradas, 1031 do arquivo)
- por pasta: caminho completo, ano, cliente, se está aberta, quantas
  mensagens tem arquivadas

Tabelas: `processos`, `trabalhos`, `pastas`, `ocorrencias`.

**O portal não deve arrancar vazio.** Um portal vazio não convence ninguém,
e há 1394 processos reais à espera.

---

## 6. Plano sugerido

**Fase 0 — extrair a especificação.** Converter as 26 migrations MySQL para
Postgres; ler os Services para tirar regras de transição e validação. Daqui
sai a migration real do Supabase.

**Fase 1 — dados e consulta.** Importar do `indice.sqlite`. Ecrãs de leitura:
processo, histórico por ano, trabalhos, caminhos das pastas. Risco zero,
ninguém muda hábitos.

**Fase 2 — o kanban.** Portar `trabalhos/kanban.php` com `@dnd-kit`.

**Fase 3 — criação.** Negócios/propostas, processos, trabalhos.

**Fase 4 — o resto.** PDF, notificações, relatório anual.

### Partes delicadas

- **Permissões.** O PHP tem `Role` com permissões granulares em tabelas. No
  Supabase isso vira RLS, que funciona de forma diferente — não é tradução
  linha a linha, e um erro aqui é silencioso.
- **PDF.** O PHP gera do lado do servidor com templates próprios; aqui há
  `@react-pdf/renderer`. Esta parte reescreve-se, não se porta.

### Não portar tudo

Das 50 views, metade provavelmente nunca foi usada a sério. Portar o que as
pessoas usam; o PHP fica como referência para o resto.

---

## 7. Adoção — o risco maior deste projeto

Este é o terceiro projeto. O PHP parou porque a estrutura visual não
agradava; este parou porque nunca foi apresentado à gerência.

**Consequência para o desenho:** pôr a fase 1 em produção antes de estar
completa ou bonita. Uma aplicação feia que as pessoas usam vale
infinitamente mais do que uma bonita parada. Nada pode obrigar ninguém a
mudar hábitos de uma vez — por isso a consulta vem primeiro.

---

## 8. Erros já cometidos, para não se repetirem

Ao construir o índice, quase todos os erros vieram de **assumir o padrão
geral em vez de verificar os dados**:

- cruzar por (processo, ano) — parecia óbvio, estava errado
- ler números de processo dos nomes do arquivo — `11-05-30-E` é uma data, e
  produzia processos falsos
- tratar os zeros à esquerda (`23-0060`) como convenção diferente — são
  apenas o formato do Excel; verificado depois: 67 de 67 nomes a bater
- modelar três estados de trabalho por dedução, quando o PHP já tinha seis

O padrão: uma discrepância entre o registo e a realidade tem sempre duas
leituras, e assumir a errada faz desaparecer o problema em vez de o mostrar.
**Medir antes de concluir. E olhar para o PHP antes de modelar.**

---

## 9. Por confirmar com o cliente

1. Um processo corresponde sempre a uma loja? Há processos que são moradias
   e prédios, sem loja associada.
2. As propostas recusadas ficam registadas? Se hoje não são, pedir isso é
   trabalho novo — e trabalho novo não se adota.
3. Que fases pertencem a que setor (para o quadro de cada coordenador se
   filtrar sozinho). Dedução a validar: licenciamentos e execuções para os
   técnicos de escritório; vistorias para os do exterior.
4. O coordenador da secretaria tem permissões diferentes das colegas?
