"""
Executa um ficheiro .sql no Supabase via REST (rpc exec_sql não existe por defeito,
por isso usamos o endpoint /rest/v1/rpc com a service role key para correr SQL direto).

Uso:
  python supabase/executar_migration.py supabase/migration_negocios.sql
"""

import os
import sys
import re
from pathlib import Path


def load_env():
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
        sys.exit(1)
    return create_client(url, key), url, key


def split_statements(sql: str) -> list[str]:
    """Divide o SQL em statements individuais, ignorando comentários."""
    # Remove comentários de linha
    sql = re.sub(r'--[^\n]*', '', sql)
    # Divide por ';' mas ignora ';' dentro de $$ (funções plpgsql)
    statements = []
    current = []
    in_dollar = False
    i = 0
    while i < len(sql):
        if sql[i:i+2] == '$$':
            in_dollar = not in_dollar
            current.append('$$')
            i += 2
            continue
        if sql[i] == ';' and not in_dollar:
            stmt = ''.join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(sql[i])
        i += 1
    last = ''.join(current).strip()
    if last:
        statements.append(last)
    return statements


def run_migration(sql_file: str):
    load_env()
    sb, url, key = get_supabase_client()

    import httpx

    sql = Path(sql_file).read_text(encoding="utf-8")
    statements = split_statements(sql)
    statements = [s for s in statements if s.strip()]

    print(f"Ficheiro: {sql_file}")
    print(f"Statements a executar: {len(statements)}")
    print()

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "params=single-object",
    }

    pg_url = url.rstrip("/") + "/rest/v1/rpc/exec_sql"

    errors = []
    for i, stmt in enumerate(statements, 1):
        preview = stmt[:80].replace("\n", " ")
        print(f"  [{i}/{len(statements)}] {preview}…")
        resp = httpx.post(pg_url, json={"sql": stmt}, headers=headers, timeout=30)
        if resp.status_code not in (200, 204):
            # Tentar via Supabase Management API não é possível sem token de gestão.
            # Usar abordagem alternativa: httpx direto ao postgres via supabase-js não funciona.
            print(f"    ERRO {resp.status_code}: {resp.text[:200]}")
            errors.append((i, stmt[:60], resp.text[:200]))

    if errors:
        print(f"\n{len(errors)} erro(s) encontrado(s).")
        print("A exec_sql via REST não está disponível por defeito.")
        print("\nEXECUTA MANUALMENTE no Supabase SQL Editor:")
        print(f"  https://supabase.com/dashboard/project/_/sql")
        print(f"\nCopia o conteúdo de: {sql_file}")
    else:
        print("\nMigration concluída com sucesso.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python supabase/executar_migration.py <ficheiro.sql>")
        sys.exit(1)
    run_migration(sys.argv[1])
