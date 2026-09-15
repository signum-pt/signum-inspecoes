"""
Importa processos e trabalhos do IndiceProcessos (SQLite) para o Supabase.

Pré-requisitos:
  pip install supabase python-dotenv

Variáveis necessárias (no .env.local do projeto ou como env vars):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY   (não o anon key — precisa de bypasear RLS)

Uso:
  python supabase/importar_processos.py
  python supabase/importar_processos.py --dry-run   (só mostra o que faria)
  python supabase/importar_processos.py --clear      (apaga antes de importar — CUIDADO)
"""

import sqlite3
import os
import sys
import argparse
from pathlib import Path

SQLITE_PATH = r"C:\Users\renato\Desktop\Signum\IndiceProcessos\resultados\indice.sqlite"

# Mapeamento fases SQLite → nomes em servicos (para matchear após inserção)
FASE_MAP = {
    "Pedido Viabilidade":  "Pedido de Viabilidade",
    "Licenciamento Câmara": "Licenciamento Câmara",
    "Execução":            "Elétrico",       # fase genérica → serviço mais comum
    "Execução ECVE":       "Execução ECVE",
    "Comunicação Prévia":  "Comunicação Prévia",
    "Vistoria Tipo A":     "Vistoria Tipo A",
    "Vistoria Tipo B":     "Vistoria Tipo B",
    "Vistoria Tipo C":     "Vistoria Tipo C",
    "Vistoria ECVE":       "Vistoria ECVE",
    "MAPs":                "MAPs",
}


def load_env():
    """Carrega .env.local se existir."""
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def get_supabase_client():
    from supabase import create_client
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.")
        print("  Adiciona ao .env.local ou define como variáveis de ambiente.")
        sys.exit(1)
    return create_client(url, key)


def ler_sqlite():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM processos ORDER BY processo")
    processos = [dict(r) for r in c.fetchall()]

    c.execute("SELECT * FROM trabalhos ORDER BY processo, ano")
    trabalhos = [dict(r) for r in c.fetchall()]

    conn.close()
    return processos, trabalhos


def importar(dry_run: bool = False, clear: bool = False):
    load_env()
    sb = get_supabase_client()

    processos, trabalhos = ler_sqlite()
    print(f"SQLite: {len(processos)} processos, {len(trabalhos)} trabalhos")

    if clear and not dry_run:
        print("A apagar dados existentes...")
        sb.table("trabalhos").delete().neq("n_processo", 0).execute()
        sb.table("processo_notas").delete().neq("n_processo", 0).execute()
        sb.table("processos").delete().neq("n_processo", 0).execute()
        sb.table("requerentes").delete().neq("nome", "").execute()
        print("  Apagado.")

    # --- Carregar servicos existentes para mapear fase → id ---
    resp = sb.table("servicos").select("id, nome").execute()
    servico_por_nome = {r["nome"]: r["id"] for r in resp.data}

    # --- Requerentes: deduplica por nome normalizado ---
    print("\nA preparar requerentes...")
    req_vistos: dict[str, str] = {}   # nome_normalizado → id
    requerentes_novos = []

    for p in processos:
        nome = (p.get("requerente") or "").strip()
        if not nome:
            continue
        chave = nome.lower()
        if chave in req_vistos:
            continue
        req_vistos[chave] = ""  # preenchido após inserção
        requerentes_novos.append({
            "nome":      nome,
            "nif":       (p.get("nif") or "").strip() or None,
            "email":     (p.get("email") or "").strip() or None,
            "telefone":  (p.get("telefone") or "").strip() or None,
            "localidade": (p.get("concelho") or "").strip() or None,
        })

    print(f"  {len(requerentes_novos)} requerentes distintos")

    if not dry_run and requerentes_novos:
        # Inserir em lotes de 500
        for i in range(0, len(requerentes_novos), 500):
            lote = requerentes_novos[i:i+500]
            resp = sb.table("requerentes").insert(lote).execute()
            for r in resp.data:
                chave = r["nome"].lower()
                req_vistos[chave] = r["id"]
        print(f"  Inseridos.")
    elif dry_run:
        print("  [dry-run] não inseridos")

    # --- Processos ---
    print("\nA preparar processos...")
    processos_rows = []
    for p in processos:
        nome_req = (p.get("requerente") or "").strip().lower()
        requerente_id = req_vistos.get(nome_req) or None

        processos_rows.append({
            "n_processo":   p["processo"],
            "designacao":   p["nome"] or f"Processo {p['processo']}",
            "requerente_id": requerente_id if not dry_run else None,
            "concelho":     (p.get("concelho") or "").strip() or None,
            "aberto":       bool(p.get("aberto", 1)),
            "primeiro_ano": p.get("primeiro_ano"),
        })

    print(f"  {len(processos_rows)} processos")

    if not dry_run:
        for i in range(0, len(processos_rows), 500):
            lote = processos_rows[i:i+500]
            sb.table("processos").upsert(lote, on_conflict="n_processo").execute()
        print("  Inseridos.")
    else:
        print("  [dry-run] não inseridos")
        print(f"  Exemplo: {processos_rows[0]}")

    # --- Trabalhos ---
    print("\nA preparar trabalhos...")
    trabalhos_rows = []
    sem_fase = 0

    for t in trabalhos:
        fase_raw = t.get("fase") or ""
        # Corrigir encoding mojibake vindo do SQLite (latin-1 lido como bytes)
        try:
            fase_raw = fase_raw.encode("latin-1").decode("utf-8")
        except Exception:
            pass
        fase_mapped = FASE_MAP.get(fase_raw, "")
        servico_id = servico_por_nome.get(fase_mapped) if fase_mapped else None

        if not fase_raw:
            sem_fase += 1

        trabalhos_rows.append({
            "n_processo":    t["processo"],
            "ano":           t["ano"],
            "especialidade": fase_raw or None,
            "servico_id":    servico_id if not dry_run else None,
            "estado":        "a fazer",
        })

    print(f"  {len(trabalhos_rows)} trabalhos ({sem_fase} sem fase registada)")

    if not dry_run:
        for i in range(0, len(trabalhos_rows), 500):
            lote = trabalhos_rows[i:i+500]
            sb.table("trabalhos").insert(lote).execute()
        print("  Inseridos.")
    else:
        print("  [dry-run] não inseridos")
        print(f"  Exemplo com fase: {next((r for r in trabalhos_rows if r['especialidade']), None)}")

    print("\nConcluído.")
    if dry_run:
        print("(dry-run — nada foi escrito na BD)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Mostra o que faria sem escrever")
    parser.add_argument("--clear", action="store_true", help="Apaga dados antes de importar")
    args = parser.parse_args()

    if args.clear and not args.dry_run:
        confirm = input("Tens a certeza que queres apagar todos os processos/trabalhos? (sim/não): ")
        if confirm.strip().lower() != "sim":
            print("Cancelado.")
            sys.exit(0)

    importar(dry_run=args.dry_run, clear=args.clear)
