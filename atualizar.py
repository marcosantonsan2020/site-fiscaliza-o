
import os
import time
from datetime import datetime, timezone
<<<<<<< HEAD
from urllib.parse import urljoin
=======
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from supabase import Client, create_client


# ============================================================
# CONFIGURAÇÃO
# ============================================================

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

SAPL_BASE = "https://sapl.saofrancisco.mg.leg.br"
<<<<<<< HEAD
API_PARLAMENTARES = f"{SAPL_BASE}/api/parlamentares/parlamentar/"
API_MATERIAS = f"{SAPL_BASE}/api/materia/materialegislativa/"
=======

API_PARLAMENTARES = (
    f"{SAPL_BASE}/api/parlamentares/parlamentar/"
)

API_LEGISLATURA_ATUAL = (
    f"{SAPL_BASE}/api/parlamentares/legislatura/2/parlamentares/"
)

API_MATERIAS = (
    f"{SAPL_BASE}/api/materia/materialegislativa/"
)
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

LEGISLATURA_ATUAL = "2025-2028"
TAMANHO_LOTE = 100
TIMEOUT_REQUISICAO = 60

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Configure SUPABASE_URL e SUPABASE_SERVICE_KEY "
<<<<<<< HEAD
        "nos Secrets do GitHub Actions."
=======
        "nas variáveis de ambiente."
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================
<<<<<<< HEAD
# SESSÃO HTTP E TENTATIVAS AUTOMÁTICAS
=======
# SESSÃO HTTP COM RETENTATIVAS
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
# ============================================================

sessao = requests.Session()

<<<<<<< HEAD
sessao.headers.update({
    "User-Agent": "PortalTransparencia-SaoFrancisco/1.0",
    "Accept": "application/json",
})

=======
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
retries = Retry(
    total=3,
    connect=3,
    read=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
)

adaptador = HTTPAdapter(max_retries=retries)
sessao.mount("https://", adaptador)
sessao.mount("http://", adaptador)

<<<<<<< HEAD

# ============================================================
# ESTATÍSTICAS DA EXECUÇÃO
# ============================================================

estatisticas = {
    "vereadores": 0,
    "materias": 0,
    "erros": [],
}


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def agora():
    """Retorna a data e hora atual em UTC."""
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
    """Extrai o nome de campos que podem ser textos ou objetos."""
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


def normalizar_data(data):
    """Converte datas ISO para o formato YYYY-MM-DD."""
    if data is None or data == "":
        return None

    if not isinstance(data, str):
        return data

    try:
        return datetime.fromisoformat(
            data.replace("Z", "+00:00")
        ).date().isoformat()
    except ValueError:
        # Pode já ser uma data ou um formato diferente.
        return data


# ============================================================
# BUSCA PAGINADA NA API DO SAPL
# ============================================================

def buscar_todos(url):
    """
    Busca todos os registros disponíveis na API do SAPL,
    percorrendo a paginação e evitando páginas repetidas.
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
            raise RuntimeError(
                "Limite de segurança da paginação atingido."
            )

        # Guarda a URL da página atual antes de avançar.
        url_atual = proxima

        print(f"Consultando página {paginas}: {url_atual}")

        resposta = sessao.get(
            url_atual,
            timeout=TIMEOUT_REQUISICAO,
        )
        resposta.raise_for_status()

        dados = resposta.json()

        # Algumas APIs retornam uma lista diretamente.
        if isinstance(dados, list):
            resultados.extend(dados)
            print(
                f"API: página {paginas} | "
                f"registros acumulados: {len(resultados)}"
            )
            break

        if not isinstance(dados, dict):
            raise RuntimeError(
                f"Formato inesperado na API: {url_atual}"
            )

        registros = dados.get("results")

        if not isinstance(registros, list):
            raise RuntimeError(
                "A resposta não contém uma lista 'results': "
                f"{url_atual}"
=======
sessao.headers.update(
    {
        "User-Agent": "PortalTransparencia-SaoFrancisco/1.0",
        "Accept": "application/json",
    }
)


def agora_iso():
    return datetime.now(timezone.utc).isoformat()


def valor_texto(valor):
    """Converte valores simples ou objetos relacionados em texto."""
    if valor is None:
        return None

    if isinstance(valor, dict):
        return (
            valor.get("__str__")
            or valor.get("nome")
            or valor.get("descricao")
            or valor.get("sigla")
            or str(valor.get("id", "")) or None
        )

    texto = str(valor).strip()
    return texto or None


def primeiro_valor(dados, *chaves):
    """Retorna o primeiro campo que não esteja vazio."""
    for chave in chaves:
        valor = dados.get(chave)

        if valor is not None and valor != "":
            return valor

    return None


def data_sql(valor):
    """Converte uma data ISO para YYYY-MM-DD."""
    if not valor:
        return None

    texto = str(valor).strip()

    if len(texto) >= 10:
        candidato = texto[:10]

        try:
            datetime.strptime(candidato, "%Y-%m-%d")
            return candidato
        except ValueError:
            pass

    return None


def converter_booleano(valor):
    if isinstance(valor, bool):
        return valor

    if valor is None:
        return None

    texto = str(valor).strip().lower()

    if texto in {"sim", "true", "1", "yes"}:
        return True

    if texto in {"não", "nao", "false", "0", "no"}:
        return False

    return None


def nome_completo_do_registro(dados):
    nome = primeiro_valor(
        dados,
        "nome_completo",
        "nome",
    )

    if nome:
        return valor_texto(nome)

    nome_parlamentar = valor_texto(
        primeiro_valor(dados, "nome_parlamentar")
    )

    if nome_parlamentar and "(" in nome_parlamentar:
        partes = nome_parlamentar.rsplit("(", 1)

        if partes[1].endswith(")"):
            return partes[1][:-1].strip()

    return nome_parlamentar


def nome_parlamentar_do_registro(dados):
    nome = valor_texto(
        primeiro_valor(dados, "nome_parlamentar")
    )

    if nome and "(" in nome:
        return nome.split("(", 1)[0].strip()

    return nome


# ============================================================
# LEITURA DE TODAS AS PÁGINAS DA API SAPL
# ============================================================

def buscar_todos(url, params=None):
    """
    Consulta APIs SAPL que usam o formato:
    {
        "pagination": {
            "links": {"next": ..., "previous": ...},
            "page": 1,
            "total_pages": 1
        },
        "results": [...]
    }

    Também aceita o formato tradicional com next/results.
    """
    resultados = []
    urls_visitadas = set()

    url_atual = url
    parametros = dict(params or {})

    while url_atual:
        resposta = sessao.get(
            url_atual,
            params=parametros,
            timeout=TIMEOUT_REQUISICAO,
        )

        resposta.raise_for_status()
        dados = resposta.json()

        urls_visitadas.add(resposta.url)
        parametros = {}

        if isinstance(dados, list):
            registros = dados
            proxima = None

        elif isinstance(dados, dict):
            registros = dados.get("results")

            if not isinstance(registros, list):
                # Algumas APIs retornam um único objeto.
                if dados.get("id") is not None:
                    registros = [dados]
                else:
                    raise ValueError(
                        f"Resposta SAPL sem lista 'results': {resposta.url}"
                    )

            paginacao = dados.get("pagination") or {}
            links = paginacao.get("links") or {}

            proxima = (
                dados.get("next")
                or links.get("next")
            )

            # Compatibilidade com a paginação própria do SAPL.
            if not proxima:
                pagina_atual = paginacao.get("page")
                total_paginas = paginacao.get("total_pages")

                if (
                    pagina_atual is not None
                    and total_paginas is not None
                    and int(pagina_atual) < int(total_paginas)
                ):
                    partes = urlparse(resposta.url)
                    query = parse_qs(partes.query)

                    query["page"] = [str(int(pagina_atual) + 1)]

                    url_atual = urlunparse(
                        partes._replace(
                            query=urlencode(query, doseq=True)
                        )
                    )

                    proxima = url_atual

        else:
            raise ValueError(
                f"Formato inesperado retornado pelo SAPL: {url}"
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
            )

        resultados.extend(registros)

<<<<<<< HEAD
        proxima_api = dados.get("next")

        if proxima_api:
            # Resolve URLs absolutas, relativas ou apenas com query.
            proxima = urljoin(url_atual, proxima_api)
        else:
            proxima = None

        print(
            f"API: página {paginas} | "
            f"registros acumulados: {len(resultados)}"
        )

        if proxima:
            time.sleep(0.15)

    print(f"Total obtido da API: {len(resultados)} registros.")
=======
        print(
            f"API: {urlparse(resposta.url).path} | "
            f"Registros nesta página: {len(registros)} | "
            f"Total acumulado: {len(resultados)}"
        )

        if not proxima:
            break

        proxima = urljoin(resposta.url, proxima)

        if proxima in urls_visitadas:
            raise RuntimeError(
                f"Paginação repetiu uma URL: {proxima}"
            )

        url_atual = proxima
        time.sleep(0.15)
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

    return resultados


# ============================================================
<<<<<<< HEAD
# GRAVAÇÃO NO SUPABASE
# ============================================================

def gravar_lotes(tabela, registros, conflito):
    """
    Insere ou atualiza registros em lotes.
    A chave de conflito deve corresponder a uma restrição
    única existente no Supabase.
    """
    if not registros:
        print(f"{tabela}: nenhum registro para gravar.")
        return 0

    total = 0

    for inicio in range(0, len(registros), TAMANHO_LOTE):
        lote = registros[inicio:inicio + TAMANHO_LOTE]

        print(
            f"Gravando {tabela}: "
            f"lote de {inicio + 1} a {inicio + len(lote)}..."
        )

        supabase.table(tabela).upsert(
            lote,
            on_conflict=conflito,
        ).execute()

        total += len(lote)

        print(
            f"{tabela}: {total}/{len(registros)} "
            "registros processados."
        )

    return total


# ============================================================
# SINCRONIZAÇÃO DE VEREADORES
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

        # Evita duplicidade dentro da resposta da API.
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
            fotografia = urljoin(
                SAPL_BASE + "/",
                fotografia,
            )

        ativo = valor(pessoa, "ativo")

        # Não presume que um valor desconhecido seja verdadeiro.
        em_exercicio = (
            ativo if isinstance(ativo, bool) else False
        )

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
            "fonte_url": (
                f"{SAPL_BASE}/parlamentar/{sapl_id}"
            ),
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
# SINCRONIZAÇÃO DE MATÉRIAS LEGISLATIVAS
# ============================================================

def sincronizar_materias():
    print("\n=== SINCRONIZANDO MATÉRIAS LEGISLATIVAS ===")

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
=======
# LEITURA DOS REGISTROS JÁ EXISTENTES NO SUPABASE
# ============================================================

def buscar_ids_existentes(tabela):
    resposta = (
        supabase.table(tabela)
        .select("sapl_id")
        .execute()
    )

    return {
        str(item["sapl_id"])
        for item in (resposta.data or [])
        if item.get("sapl_id") is not None
    }


def buscar_vereadores_existentes():
    resposta = (
        supabase.table("vereadores")
        .select("*")
        .execute()
    )

    return {
        str(item["sapl_id"]): item
        for item in (resposta.data or [])
        if item.get("sapl_id") is not None
    }


# ============================================================
# GRAVAÇÃO EM LOTES
# ============================================================

def gravar_lotes(tabela, registros, conflito="sapl_id"):
    if not registros:
        print(f"Nenhum registro para gravar na tabela {tabela}.")
        return

    total = len(registros)

    for inicio in range(0, total, TAMANHO_LOTE):
        lote = registros[inicio:inicio + TAMANHO_LOTE]

        (
            supabase.table(tabela)
            .upsert(lote, on_conflict=conflito)
            .execute()
        )

        print(
            f"{tabela}: {min(inicio + len(lote), total)}"
            f"/{total} registros processados."
        )


# ============================================================
# VEREADORES E LEGISLATURA ATUAL
# ============================================================

def sincronizar_vereadores():
    print("\nBuscando perfis gerais de parlamentares no SAPL...")

    perfis = buscar_todos(
        API_PARLAMENTARES,
        params={"page_size": TAMANHO_LOTE},
    )

    print("\nBuscando composição da legislatura atual...")

    legislatura = buscar_todos(
        API_LEGISLATURA_ATUAL,
        params={"page_size": TAMANHO_LOTE},
    )

    perfis_por_id = {}

    for perfil in perfis:
        identificador = primeiro_valor(
            perfil,
            "id",
            "object_id",
        )

        if identificador is not None:
            perfis_por_id[str(identificador)] = perfil

    atuais_por_id = {}

    for parlamentar in legislatura:
        identificador = primeiro_valor(
            parlamentar,
            "id",
            "object_id",
        )

        if identificador is not None:
            atuais_por_id[str(identificador)] = parlamentar

    existentes = buscar_vereadores_existentes()
    ids_existentes = set(existentes)
    ids_atuais = set(atuais_por_id)

    # Não importar indiscriminadamente todos os perfis históricos.
    # Atualiza os registros existentes e acrescenta os integrantes
    # associados à legislatura atual.
    ids_alvo = ids_existentes | ids_atuais

    registros = []
    ids_processados = set()
    coletado_em = agora_iso()

    for identificador in sorted(
        ids_alvo,
        key=lambda item: int(item) if item.isdigit() else item,
    ):
        perfil = perfis_por_id.get(identificador, {})
        atual = atuais_por_id.get(identificador, {})
        anterior = existentes.get(identificador, {})

        if not perfil and not atual:
            # Não há dados novos para atualizar este registro.
            continue

        original = dict(perfil)
        original["_legislatura_atual"] = atual

        nome = (
            nome_completo_do_registro(perfil)
            or nome_completo_do_registro(atual)
            or anterior.get("nome")
        )

        nome_parlamentar = (
            nome_parlamentar_do_registro(perfil)
            or nome_parlamentar_do_registro(atual)
            or anterior.get("nome_parlamentar")
            or nome
        )

        if not nome:
            print(
                f"Aviso: parlamentar {identificador} sem nome. "
                "Registro ignorado."
            )
            continue

        registro = {
            "sapl_id": identificador,
            "nome": nome,
            "nome_parlamentar": nome_parlamentar,
            "dados_originais": original,
            "coletado_em": coletado_em,
            "updated_at": coletado_em,
        }

        # Só substituir o partido anterior quando houver um valor
        # efetivamente recebido da API.
        partido = (
            valor_texto(primeiro_valor(atual, "partido"))
            or valor_texto(
                primeiro_valor(perfil, "partido", "partido_atual")
            )
            or anterior.get("partido")
        )

        if partido:
            registro["partido"] = partido

        foto = (
            primeiro_valor(
                perfil,
                "fotografia",
                "foto",
                "foto_url",
            )
            or primeiro_valor(
                atual,
                "fotografia",
                "foto",
                "foto_url",
            )
            or anterior.get("foto_url")
        )

        if foto:
            registro["foto_url"] = urljoin(SAPL_BASE + "/", str(foto))

        biografia = primeiro_valor(
            perfil,
            "biografia",
            "biografia_resumida",
        )

        if biografia is not None:
            registro["biografia"] = biografia
        elif anterior.get("biografia") is not None:
            registro["biografia"] = anterior["biografia"]

        fonte = primeiro_valor(
            perfil,
            "link_detail_backend",
            "url",
            "url_oficial",
        )

        if fonte:
            registro["fonte_url"] = urljoin(
                SAPL_BASE + "/",
                str(fonte),
            )
        elif anterior.get("fonte_url"):
            registro["fonte_url"] = anterior["fonte_url"]
        else:
            registro["fonte_url"] = (
                f"{SAPL_BASE}/parlamentar/{identificador}"
            )

        # A legislatura atual é a fonte de referência para os
        # campos de situação e titularidade.
        if atual:
            registro["legislatura"] = LEGISLATURA_ATUAL

            ativo = converter_booleano(atual.get("ativo"))

            if ativo is not None:
                registro["em_exercicio"] = ativo

            titular = converter_booleano(atual.get("titular"))

            if titular is not None:
                registro["titular"] = titular

        else:
            # Preserva a situação histórica já armazenada.
            # Não usa o campo "ativo" do perfil geral como prova
            # de que a pessoa ocupa uma cadeira atualmente.
            if anterior.get("em_exercicio") is not None:
                registro["em_exercicio"] = anterior["em_exercicio"]

            if anterior.get("titular") is not None:
                registro["titular"] = anterior["titular"]

            if anterior.get("legislatura"):
                registro["legislatura"] = anterior["legislatura"]

        registros.append(registro)
        ids_processados.add(identificador)

    gravar_lotes("vereadores", registros)

    inseridos = sum(
        1 for item in registros
        if item["sapl_id"] not in ids_existentes
    )

    atualizados = len(registros) - inseridos

    ativos = sum(
        1 for item in registros
        if item.get("sapl_id") in ids_atuais
        and item.get("em_exercicio") is True
    )

    print("\nResumo da sincronização de vereadores:")
    print(f"Perfis gerais recebidos: {len(perfis)}")
    print(f"Registros da legislatura atual: {len(legislatura)}")
    print(f"Registros enviados ao Supabase: {len(registros)}")
    print(f"Novos registros: {inseridos}")
    print(f"Registros atualizados: {atualizados}")
    print(f"Registros atuais marcados em exercício: {ativos}")

    return {
        "lidos": len(perfis) + len(legislatura),
        "processados": len(registros),
        "inseridos": inseridos,
        "atualizados": atualizados,
        "legislatura_registros": len(legislatura),
        "em_exercicio": ativos,
    }


# ============================================================
# MATÉRIAS LEGISLATIVAS
# ============================================================

def sincronizar_materias():
    print("\nBuscando matérias legislativas no SAPL...")

    materias_api = buscar_todos(
        API_MATERIAS,
        params={"page_size": TAMANHO_LOTE},
    )

    ids_existentes = buscar_ids_existentes("materias")

    registros = []
    coletado_em = agora_iso()

    for materia in materias_api:
        identificador = primeiro_valor(
            materia,
            "id",
            "object_id",
        )

        if identificador is None:
            continue

        identificador = str(identificador)

        tipo = valor_texto(
            primeiro_valor(
                materia,
                "tipo",
                "tipo_materia",
                "tipo_material",
            )
        )

        numero = primeiro_valor(
            materia,
            "numero",
            "numero_materia",
        )

        ano = primeiro_valor(
            materia,
            "ano",
            "ano_materia",
        )
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

        try:
            ano = int(ano) if ano is not None else None
        except (ValueError, TypeError):
            ano = None

<<<<<<< HEAD
        data_apresentacao = normalizar_data(
            valor(
                materia,
                "data_apresentacao",
                "data",
            )
        )

        registro = {
            "sapl_id": sapl_id,
            "tipo": tipo,
            "numero": (
                str(numero) if numero is not None else None
            ),
            "ano": ano,
            "ementa": valor(materia, "ementa"),
            "data_apresentacao": data_apresentacao,
            "situacao": situacao,
            "url_oficial": (
                f"{SAPL_BASE}/materia/{sapl_id}"
            ),
            "dados_originais": materia,
            "coletado_em": agora(),
            "updated_at": agora(),
=======
        ementa = valor_texto(
            primeiro_valor(
                materia,
                "ementa",
                "assunto",
                "descricao",
            )
        )

        data_apresentacao = data_sql(
            primeiro_valor(
                materia,
                "data_apresentacao",
                "data",
                "data_publicacao",
                "data_entrada",
            )
        )

        situacao = valor_texto(
            primeiro_valor(
                materia,
                "situacao",
                "status",
                "situacao_atual",
            )
        )

        url_oficial = primeiro_valor(
            materia,
            "url_oficial",
            "url",
            "link_detail_backend",
            "url_materia",
        )

        if url_oficial:
            url_oficial = urljoin(
                SAPL_BASE + "/",
                str(url_oficial),
            )

        registro = {
            "sapl_id": identificador,
            "tipo": tipo,
            "numero": str(numero) if numero is not None else None,
            "ano": ano,
            "ementa": ementa,
            "data_apresentacao": data_apresentacao,
            "situacao": situacao,
            "url_oficial": url_oficial,
            "dados_originais": materia,
            "coletado_em": coletado_em,
            "updated_at": coletado_em,
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
        }

        registros.append(registro)

<<<<<<< HEAD
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
# REGISTRO DA EXECUÇÃO NO SUPABASE
# ============================================================

def iniciar_log():
    """
    Registra o início da sincronização.

    'executando' é permitido pela restrição atual
    da coluna status na tabela atualizacoes.
    """
    resultado = supabase.table("atualizacoes").insert({
        "processo": "sincronizacao_sapl",
        "status": "executando",
        "inicio_em": agora(),
        "registros_lidos": 0,
        "registros_inseridos": 0,
        "registros_atualizados": 0,
        "mensagem": "Sincronização iniciada.",
        "detalhes": {},
    }).execute()

    if not resultado.data:
=======
    gravar_lotes("materias", registros)

    inseridos = sum(
        1 for item in registros
        if item["sapl_id"] not in ids_existentes
    )

    atualizados = len(registros) - inseridos

    print("\nResumo da sincronização de matérias:")
    print(f"Matérias recebidas: {len(materias_api)}")
    print(f"Matérias processadas: {len(registros)}")
    print(f"Novas matérias: {inseridos}")
    print(f"Matérias atualizadas: {atualizados}")

    return {
        "lidos": len(materias_api),
        "processados": len(registros),
        "inseridos": inseridos,
        "atualizados": atualizados,
    }


# ============================================================
# REGISTRO DE EXECUÇÕES
# ============================================================

def iniciar_log():
    registro = {
        "processo": "sincronizacao_sapl",
        "status": "executando",
        "inicio_em": agora_iso(),
        "mensagem": "Sincronização iniciada.",
    }

    resposta = (
        supabase.table("atualizacoes")
        .insert(registro)
        .execute()
    )

    if not resposta.data:
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)
        raise RuntimeError(
            "Não foi possível criar o registro de execução."
        )

<<<<<<< HEAD
    log_id = resultado.data[0]["id"]

    print(f"Registro de execução criado: {log_id}")

    return log_id


def finalizar_log(log_id, sucesso, mensagem):
    """Atualiza o registro de execução com o resultado final."""
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
        # O upsert não separa, por si só, novos registros
        # de registros atualizados. Não inventamos os números.
        "registros_inseridos": 0,
        "registros_atualizados": 0,
        "mensagem": mensagem,
        "detalhes": detalhes,
    }).eq("id", log_id).execute()

    print(
        "Histórico atualizado: "
        f"{'sucesso' if sucesso else 'erro'}."
    )

=======
    return resposta.data[0]["id"]


def finalizar_log(
    log_id,
    sucesso,
    inicio,
    resultado_vereadores=None,
    resultado_materias=None,
    erro=None,
):
    fim = datetime.now(timezone.utc)
    inicio_dt = datetime.fromisoformat(inicio)

    vereadores = resultado_vereadores or {}
    materias = resultado_materias or {}

    lidos = (
        vereadores.get("processados", 0)
        + materias.get("processados", 0)
    )

    inseridos = (
        vereadores.get("inseridos", 0)
        + materias.get("inseridos", 0)
    )

    atualizados = (
        vereadores.get("atualizados", 0)
        + materias.get("atualizados", 0)
    )

    detalhes = {
        "vereadores": vereadores,
        "materias": materias,
    }

    if erro:
        detalhes["erro"] = erro

    registro = {
        "status": "sucesso" if sucesso else "erro",
        "fim_em": fim.isoformat(),
        "registros_lidos": lidos,
        "registros_inseridos": inseridos,
        "registros_atualizados": atualizados,
        "mensagem": (
            "Sincronização de vereadores e matérias concluída."
            if sucesso
            else f"Falha na sincronização: {erro}"
        ),
        "detalhes": detalhes,
    }

    (
        supabase.table("atualizacoes")
        .update(registro)
        .eq("id", log_id)
        .execute()
    )

    duracao = (fim - inicio_dt).total_seconds()

    print("\n" + "=" * 55)
    print("STATUS:", "SUCESSO" if sucesso else "ERRO")
    print(f"Duração: {duracao:.2f} segundos")
    print(f"Registros processados: {lidos}")
    print(f"Novos registros: {inseridos}")
    print(f"Registros atualizados: {atualizados}")

    if erro:
        print("Erro:", erro)

    print("=" * 55)

>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

# ============================================================
# EXECUÇÃO PRINCIPAL
# ============================================================

def sincronizar_dados():
<<<<<<< HEAD
    print(
        "Iniciando sincronização com o SAPL "
        "de São Francisco-MG."
    )

    log_id = iniciar_log()

    try:
        sincronizar_vereadores()
        sincronizar_materias()

        finalizar_log(
            log_id,
            True,
            "Sincronização de vereadores e matérias concluída.",
        )

        print("\n=== SINCRONIZAÇÃO CONCLUÍDA ===")
        print(
            "Vereadores processados: "
            f"{estatisticas['vereadores']}"
        )
        print(
            "Matérias processadas: "
            f"{estatisticas['materias']}"
        )

    except Exception as erro:
        mensagem = f"{type(erro).__name__}: {erro}"

        estatisticas["erros"].append(mensagem)

        print(f"\nERRO NA SINCRONIZAÇÃO: {mensagem}")

        try:
            finalizar_log(
                log_id,
                False,
                mensagem,
            )
        except Exception as erro_log:
            print(
                "Também não foi possível atualizar "
                f"o histórico: {erro_log}"
            )
=======
    inicio = agora_iso()
    log_id = None

    resultado_vereadores = {}
    resultado_materias = {}

    try:
        print("=" * 55)
        print("PORTAL DA TRANSPARÊNCIA — SÃO FRANCISCO/MG")
        print("Sincronização com o SAPL")
        print("=" * 55)

        log_id = iniciar_log()

        resultado_vereadores = sincronizar_vereadores()
        resultado_materias = sincronizar_materias()

        finalizar_log(
            log_id=log_id,
            sucesso=True,
            inicio=inicio,
            resultado_vereadores=resultado_vereadores,
            resultado_materias=resultado_materias,
        )

    except Exception as exc:
        mensagem_erro = f"{type(exc).__name__}: {exc}"

        print("\nERRO DURANTE A SINCRONIZAÇÃO")
        print(mensagem_erro)

        if log_id is not None:
            try:
                finalizar_log(
                    log_id=log_id,
                    sucesso=False,
                    inicio=inicio,
                    resultado_vereadores=resultado_vereadores,
                    resultado_materias=resultado_materias,
                    erro=mensagem_erro,
                )
            except Exception as erro_log:
                print(
                    "Não foi possível finalizar o log: "
                    f"{erro_log}"
                )
>>>>>>> 940c36d (Atualiza sincronização de vereadores e matérias)

        raise


if __name__ == "__main__":
    sincronizar_dados()
