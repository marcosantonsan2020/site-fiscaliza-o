
import os
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from supabase import Client, create_client


# ============================================================
# CONFIGURAÇÃO
# ============================================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

SAPL_BASE = "https://sapl.saofrancisco.mg.leg.br"
API_PARLAMENTARES = f"{SAPL_BASE}/api/parlamentares/parlamentar/"
API_MATERIAS = f"{SAPL_BASE}/api/materia/materialegislativa/"

LEGISLATURA_ATUAL = "2025-2028"
TAMANHO_LOTE = 100

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Configure SUPABASE_URL e SUPABASE_SERVICE_KEY "
        "nos Secrets do GitHub Actions."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

sessao = requests.Session()
sessao.headers.update({
    "User-Agent": "PortalTransparencia-SaoFrancisco/1.0",
    "Accept": "application/json",
})

# Contadores desta execução
estatisticas = {
    "vereadores": 0,
    "materias": 0,
    "erros": [],
}


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def agora():
    return datetime.now(timezone.utc).isoformat()


def valor(dados, *chaves, padrao=None):
    """Retorna o primeiro campo existente e não vazio."""
    if not isinstance(dados, dict):
        return padrao

    for chave in chaves:
        resultado = dados.get(chave)

        if resultado is not None and resultado != "":
            return resultado

    return padrao


def nome_relacionado(item):
    """Extrai nomes de campos que podem ser objetos ou textos."""
    if isinstance(item, str):
        return item

    if isinstance(item, dict):
        return valor(
            item,
            "nome",
            "nome_parlamentar",
            "nome_completo",
            "descricao",
            "sigla",
            "name",
        )

    return None


def buscar_todos(url):
    """
    Percorre as páginas da API do SAPL.
    Interrompe a execução se a resposta não tiver o formato esperado.
    """
    resultados = []
    proxima = url
    paginas = 0
    urls_visitadas = set()

    while proxima:
        if proxima in urls_visitadas:
            raise RuntimeError(
                f"Paginação repetida na API: {proxima}"
            )

        urls_visitadas.add(proxima)
        paginas += 1

        if paginas > 10000:
            raise RuntimeError("Limite de segurança da paginação atingido.")

        resposta = sessao.get(proxima, timeout=60)
        resposta.raise_for_status()

        dados = resposta.json()

        # Algumas APIs retornam uma lista diretamente.
        if isinstance(dados, list):
            resultados.extend(dados)
            break

        if not isinstance(dados, dict):
            raise RuntimeError(
                f"Formato inesperado na API: {proxima}"
            )

        registros = dados.get("results")

        if not isinstance(registros, list):
            raise RuntimeError(
                f"A resposta não contém uma lista 'results': {proxima}"
            )

        resultados.extend(registros)

        proxima = dados.get("next")

        if proxima:
            proxima = urljoin(proxima, proxima)

        print(
            f"API: página {paginas} | "
            f"registros acumulados: {len(resultados)}"
        )

        time.sleep(0.15)

    return resultados


def gravar_lotes(tabela, registros, conflito):
    """Grava os registros em lotes, usando a chave única informada."""
    if not registros:
        print(f"{tabela}: nenhum registro para gravar.")
        return 0

    total = 0

    for inicio in range(0, len(registros), TAMANHO_LOTE):
        lote = registros[inicio:inicio + TAMANHO_LOTE]

        supabase.table(tabela).upsert(
            lote,
            on_conflict=conflito,
        ).execute()

        total += len(lote)
        print(f"{tabela}: {total}/{len(registros)} processados.")

    return total


# ============================================================
# VEREADORES
# ============================================================

def sincronizar_vereadores():
    print("\n=== SINCRONIZANDO VEREADORES ===")

    origem = buscar_todos(API_PARLAMENTARES)
    registros = []
    ids_vistos = set()

    for pessoa in origem:
        sapl_id = valor(pessoa, "id", "object_id")
        nome = valor(pessoa, "nome_completo", "nome")

        if sapl_id is None or not nome:
            continue

        sapl_id = str(sapl_id)

        # Evita duplicidade dentro da própria resposta.
        if sapl_id in ids_vistos:
            continue

        ids_vistos.add(sapl_id)

        nome_parlamentar = valor(
            pessoa,
            "nome_parlamentar",
            "apelido",
            padrao=nome,
        )

        partido = nome_relacionado(
            valor(pessoa, "partido", "partido_atual")
        )

        fotografia = valor(
            pessoa,
            "fotografia",
            "foto",
            "foto_url",
        )

        if isinstance(fotografia, dict):
            fotografia = valor(
                fotografia,
                "url",
                "arquivo",
                "path",
            )

        if fotografia and isinstance(fotografia, str):
            fotografia = urljoin(SAPL_BASE + "/", fotografia)

        ativo = valor(pessoa, "ativo")

        # Não presume que uma situação desconhecida seja verdadeira.
        em_exercicio = ativo if isinstance(ativo, bool) else False

        titular_origem = valor(pessoa, "titular")
        titular = (
            titular_origem
            if isinstance(titular_origem, bool)
            else None
        )

        registro = {
            "sapl_id": sapl_id,
            "nome": str(nome),
            "nome_parlamentar": (
                str(nome_parlamentar)
                if nome_parlamentar is not None
                else None
            ),
            "partido": partido,
            "legislatura": LEGISLATURA_ATUAL,
            "titular": titular,
            "foto_url": fotografia,
            "biografia": valor(pessoa, "biografia"),
            "fonte_url": f"{SAPL_BASE}/parlamentar/{sapl_id}",
            "dados_originais": pessoa,
            "coletado_em": agora(),
            "updated_at": agora(),
            "em_exercicio": em_exercicio,
        }

        registros.append(registro)

    if not registros:
        raise RuntimeError(
            "A API não retornou vereadores válidos. "
            "A tabela não foi alterada."
        )

    total = gravar_lotes(
        "vereadores",
        registros,
        "sapl_id",
    )

    estatisticas["vereadores"] = total
    print(f"Vereadores processados: {total}")


# ============================================================
# MATÉRIAS LEGISLATIVAS
# ============================================================

def sincronizar_materias():
    print("\n=== SINCRONIZANDO MATÉRIAS ===")

    origem = buscar_todos(API_MATERIAS)
    registros = []
    ids_vistos = set()

    for materia in origem:
        sapl_id = valor(materia, "id", "object_id")

        if sapl_id is None:
            continue

        sapl_id = str(sapl_id)

        if sapl_id in ids_vistos:
            continue

        ids_vistos.add(sapl_id)

        tipo = nome_relacionado(
            valor(
                materia,
                "tipo",
                "tipo_materia",
                "tipo_materialegislativa",
            )
        )

        situacao = nome_relacionado(
            valor(
                materia,
                "situacao",
                "status",
                "status_tramitacao",
                "ultima_tramitacao",
            )
        )

        numero = valor(materia, "numero")
        ano = valor(materia, "ano")

        try:
            ano = int(ano) if ano is not None else None
        except (ValueError, TypeError):
            ano = None

        data_apresentacao = valor(
            materia,
            "data_apresentacao",
            "data",
        )

        # Campos opcionais: se a API não fornecer, ficam nulos.
        registro = {
            "sapl_id": sapl_id,
            "tipo": tipo,
            "numero": str(numero) if numero is not None else None,
            "ano": ano,
            "ementa": valor(materia, "ementa"),
            "data_apresentacao": data_apresentacao,
            "situacao": situacao,
            "url_oficial": f"{SAPL_BASE}/materia/{sapl_id}",
            "dados_originais": materia,
            "coletado_em": agora(),
            "updated_at": agora(),
        }

        registros.append(registro)

    if not registros:
        raise RuntimeError(
            "A API não retornou matérias válidas. "
            "A tabela não foi alterada."
        )

    total = gravar_lotes(
        "materias",
        registros,
        "sapl_id",
    )

    estatisticas["materias"] = total
    print(f"Matérias processadas: {total}")


# ============================================================
# REGISTRO DA EXECUÇÃO
# ============================================================

def iniciar_log():
    resultado = supabase.table("atualizacoes").insert({
        "processo": "sincronizacao_sapl",
        "status": "em_andamento",
        "inicio_em": agora(),
        "registros_lidos": 0,
        "registros_inseridos": 0,
        "registros_atualizados": 0,
        "mensagem": "Sincronização iniciada.",
        "detalhes": {},
    }).execute()

    if not resultado.data:
        raise RuntimeError(
            "Não foi possível criar o registro de execução."
        )

    return resultado.data[0]["id"]


def finalizar_log(log_id, sucesso, mensagem):
    lidos = (
        estatisticas["vereadores"]
        + estatisticas["materias"]
    )

    detalhes = {
        "vereadores_processados": estatisticas["vereadores"],
        "materias_processadas": estatisticas["materias"],
        "erros": estatisticas["erros"],
    }

    supabase.table("atualizacoes").update({
        "status": "sucesso" if sucesso else "erro",
        "fim_em": agora(),
        "registros_lidos": lidos,
        # Upsert não informa com precisão quantos foram inseridos
        # e quantos foram atualizados. Não inventamos essa divisão.
        "registros_inseridos": 0,
        "registros_atualizados": 0,
        "mensagem": mensagem,
        "detalhes": detalhes,
    }).eq("id", log_id).execute()


# ============================================================
# EXECUÇÃO PRINCIPAL
# ============================================================

def sincronizar_dados():
    print("Iniciando sincronização com o SAPL de São Francisco-MG.")

    log_id = iniciar_log()

    try:
        sincronizar_vereadores()
        sincronizar_materias()

        finalizar_log(
            log_id,
            True,
            "Sincronização de vereadores e matérias concluída.",
        )

        print("\nSincronização concluída.")
        print(f"Vereadores processados: {estatisticas['vereadores']}")
        print(f"Matérias processadas: {estatisticas['materias']}")

    except Exception as erro:
        mensagem = f"{type(erro).__name__}: {erro}"
        estatisticas["erros"].append(mensagem)

        print(f"\nERRO NA SINCRONIZAÇÃO: {mensagem}")

        try:
            finalizar_log(log_id, False, mensagem)
        except Exception as erro_log:
            print(f"Também não foi possível atualizar o log: {erro_log}")

        raise


if __name__ == "__main__":
    sincronizar_dados()
