import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Materia = {
  id: string;
  sapl_id: string | null;
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data_apresentacao: string | null;
  situacao: string | null;
  url_oficial: string | null;
};

type Autor = {
  materia_id: string;
  autor_nome: string | null;
  vereador_id: string | null;
};

type Params = {
  busca?: string;
  ano?: string;
  tipo?: string;
  pagina?: string;
};

const POR_PAGINA = 20;

function dataBR(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function texto(valor: string | null | undefined) {
  return valor?.trim() || "Não informado";
}

function montarUrl(
  busca: string,
  ano: string,
  tipo: string,
  pagina: number
) {
  const params = new URLSearchParams();

  if (busca) params.set("busca", busca);
  if (ano) params.set("ano", ano);
  if (tipo) params.set("tipo", tipo);
  if (pagina > 1) params.set("pagina", String(pagina));

  const query = params.toString();
  return query ? `/materias?${query}` : "/materias";
}

export default async function MateriasPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  const busca = (params.busca ?? "").trim().slice(0, 100);
  const anoSolicitado = params.ano ?? "";
  const tipoSolicitado = (params.tipo ?? "").slice(0, 100);

  const paginaSolicitada = Number(params.pagina ?? "1");
  const pagina =
    Number.isSafeInteger(paginaSolicitada) && paginaSolicitada > 0
      ? Math.min(paginaSolicitada, 100000)
      : 1;

  const [anosResultado, tiposResultado] = await Promise.all([
    supabase
      .from("materias")
      .select("ano")
      .not("ano", "is", null)
      .limit(2000),

    supabase
      .from("materias")
      .select("tipo")
      .not("tipo", "is", null)
      .limit(2000),
  ]);

  if (anosResultado.error || tiposResultado.error) {
    console.error(
      "Erro ao carregar filtros:",
      anosResultado.error?.message ??
        tiposResultado.error?.message
    );

    return (
      <main className="records-page materias-page">
        <header className="records-top">
          <div className="records-content records-top-inner">
            <Link className="records-brand" href="/">
              <span className="brand-mark">SF</span>
              <span>
                <strong>Portal da Fiscalização</strong>
                <small>Fiscalização cidadã · São Francisco — MG</small>
              </span>
            </Link>

            <nav className="records-nav" aria-label="Navegação principal">
              <Link href="/">Início</Link>
              <Link href="/materias" aria-current="page">
                Matérias
              </Link>
              <Link href="/diarias">Diárias</Link>
              <Link href="/despesas">Despesas</Link>
            </nav>
          </div>
        </header>

        <div className="records-content materias-content">
          <h1>Matérias legislativas</h1>
          <p>Não foi possível carregar os filtros. Tente novamente.</p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const anos = [
    ...new Set(
      (anosResultado.data ?? [])
        .map((item) => item.ano)
        .filter((ano): ano is number => ano !== null)
    ),
  ].sort((a, b) => b - a);

  const tipos = [
    ...new Set(
      (tiposResultado.data ?? [])
        .map((item) => item.tipo?.trim())
        .filter((tipo): tipo is string => Boolean(tipo))
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const anoSelecionado = anos.includes(Number(anoSolicitado))
    ? anoSolicitado
    : "";

  const tipoSelecionado = tipos.includes(tipoSolicitado)
    ? tipoSolicitado
    : "";

  function aplicarFiltros(query: any) {
    let resultado = query;

    if (anoSelecionado) {
      resultado = resultado.eq("ano", Number(anoSelecionado));
    }

    if (tipoSelecionado) {
      resultado = resultado.eq("tipo", tipoSelecionado);
    }

    if (busca) {
      const termo = busca.replace(/[,%()]/g, " ").trim();

      if (termo) {
        resultado = resultado.or(
          `ementa.ilike.%${termo}%,numero.ilike.%${termo}%,tipo.ilike.%${termo}%,situacao.ilike.%${termo}%`
        );
      }
    }

    return resultado;
  }

  const colunas =
    "id, sapl_id, tipo, numero, ano, ementa, data_apresentacao, situacao, url_oficial";

  const inicio = (pagina - 1) * POR_PAGINA;

  const [resultado, resultadoTotal] = await Promise.all([
    aplicarFiltros(
      supabase.from("materias").select(colunas, { count: "exact" })
    )
      .order("data_apresentacao", {
        ascending: false,
        nullsFirst: false,
      })
      .order("ano", { ascending: false, nullsFirst: false })
      .order("numero", { ascending: false })
      .range(inicio, inicio + POR_PAGINA - 1),

    aplicarFiltros(
      supabase
        .from("materias")
        .select("id", { count: "exact", head: true })
    ),
  ]);

  if (resultado.error || resultadoTotal.error) {
    console.error(
      "Erro ao consultar matérias:",
      resultado.error?.message ??
        resultadoTotal.error?.message
    );

    return (
      <main className="records-page materias-page">
        <header className="records-top">
          <div className="records-content records-top-inner">
            <Link className="records-brand" href="/">
              <span className="brand-mark">SF</span>
              <span>
                <strong>Portal da Fiscalização</strong>
                <small>Fiscalização cidadã · São Francisco — MG</small>
              </span>
            </Link>

            <nav className="records-nav" aria-label="Navegação principal">
              <Link href="/">Início</Link>
              <Link href="/materias" aria-current="page">
                Matérias
              </Link>
              <Link href="/diarias">Diárias</Link>
              <Link href="/despesas">Despesas</Link>
            </nav>
          </div>
        </header>

        <div className="records-content materias-content">
          <h1>Matérias legislativas</h1>
          <p>
            Ocorreu um erro ao consultar as matérias. Verifique a conexão
            com o Supabase.
          </p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const materias = (resultado.data ?? []) as Materia[];
  const totalRegistros = resultado.count ?? 0;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / POR_PAGINA)
  );
  const paginaAtual = Math.min(pagina, totalPaginas);

  const ids = materias.map((materia) => materia.id);

  let autores: Autor[] = [];

  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("materias_autores")
      .select("materia_id, autor_nome, vereador_id")
      .in("materia_id", ids);

    if (error) {
      console.error("Erro ao consultar autores:", error.message);
    } else {
      autores = (data ?? []) as Autor[];
    }
  }

  const autoresPorMateria = new Map<string, string[]>();

  for (const autor of autores) {
    const nome = autor.autor_nome?.trim();
    if (!nome) continue;

    const lista = autoresPorMateria.get(autor.materia_id) ?? [];

    if (!lista.includes(nome)) {
      lista.push(nome);
      autoresPorMateria.set(autor.materia_id, lista);
    }
  }

  return (
    <main className="records-page materias-page">
      <header className="records-top">
        <div className="records-content records-top-inner">
          <Link className="records-brand" href="/">
            <span className="brand-mark">SF</span>
            <span>
              <strong>Portal da Fiscalização</strong>
              <small>Fiscalização cidadã · São Francisco — MG</small>
            </span>
          </Link>

          <nav className="records-nav" aria-label="Navegação principal">
            <Link href="/">Início</Link>
            <Link href="/materias" aria-current="page">
              Matérias
            </Link>
            <Link href="/diarias">Diárias</Link>
            <Link href="/despesas">Despesas</Link>
          </nav>
        </div>
      </header>

      <div className="records-content materias-content">
        <div className="records-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <span>Matérias legislativas</span>
        </div>

        <section className="records-heading">
          <span className="section-eyebrow">ATIVIDADE LEGISLATIVA</span>
          <h1>Matérias legislativas</h1>
          <p>
            Consulte projetos, requerimentos e outras proposições
            cadastradas, com informações sobre autores, apresentação,
            situação e acesso à fonte oficial.
          </p>
        </section>

        <section className="records-overview">
          <article className="overview-card">
            <span>Matérias encontradas</span>
            <strong>{totalRegistros.toLocaleString("pt-BR")}</strong>
            <small>Conforme os filtros aplicados</small>
          </article>

          <article className="overview-card">
            <span>Tipos de matéria</span>
            <strong>{tipos.length.toLocaleString("pt-BR")}</strong>
            <small>Tipos distintos cadastrados</small>
          </article>

          <article className="overview-card">
            <span>Ano selecionado</span>
            <strong>{anoSelecionado || "Todos"}</strong>
            <small>Período de apresentação</small>
          </article>
        </section>

        <form className="filters-panel" action="/materias" method="get">
          <div className="filter-field filter-search">
            <label htmlFor="busca">Pesquisar matérias</label>
            <input
              id="busca"
              name="busca"
              type="search"
              defaultValue={busca}
              maxLength={100}
              placeholder="Ementa, número, tipo ou situação..."
            />
          </div>

          <div className="filter-field">
            <label htmlFor="ano">Ano</label>
            <select id="ano" name="ano" defaultValue={anoSelecionado}>
              <option value="">Todos os anos</option>
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="tipo">Tipo de matéria</label>
            <select id="tipo" name="tipo" defaultValue={tipoSelecionado}>
              <option value="">Todos os tipos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <button className="filter-button" type="submit">
            Pesquisar
          </button>

          <Link className="filter-reset" href="/materias">
            Limpar filtros
          </Link>
        </form>

        <div className="records-summary">
          <div>
            <h2>Proposições cadastradas</h2>
            <p>
              {totalRegistros.toLocaleString("pt-BR")} registro(s)
              encontrado(s).
            </p>
          </div>

          <span className="records-page-count">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>

        {materias.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma matéria encontrada</h3>
            <p>
              Experimente alterar os filtros ou pesquisar por outro termo.
            </p>
          </div>
        ) : (
          <div className="materias-list">
            {materias.map((materia) => {
              const nomesAutores =
                autoresPorMateria.get(materia.id) ?? [];

              return (
                <article className="materia-card" key={materia.id}>
                  <div className="materia-card-top">
                    <div className="materia-identificacao">
                      <span className="materia-tipo">
                        {texto(materia.tipo)}
                      </span>

                      <span className="materia-numero">
                        Nº {texto(materia.numero)}/{materia.ano ?? "—"}
                      </span>
                    </div>

                    <span className="materia-situacao">
                      {texto(materia.situacao)}
                    </span>
                  </div>

                  <h3>{texto(materia.ementa)}</h3>

                  <div className="materia-meta">
                    <div>
                      <span>Apresentação</span>
                      <strong>
                        {dataBR(materia.data_apresentacao)}
                      </strong>
                    </div>

                    <div>
                      <span>Autores</span>
                      <strong>
                        {nomesAutores.length > 0
                          ? nomesAutores.join(", ")
                          : "Não informado"}
                      </strong>
                    </div>
                  </div>

                  <div className="materia-card-footer">
                    <span>
                      Código de origem: {texto(materia.sapl_id)}
                    </span>

                    {materia.url_oficial &&
                    /^https?:\/\//i.test(materia.url_oficial) ? (
                      <a
                        href={materia.url_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Consultar matéria oficial ↗
                      </a>
                    ) : (
                      <span>Link oficial não disponível</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPaginas > 1 && (
          <nav className="pagination" aria-label="Paginação">
            {paginaAtual > 1 ? (
              <Link
                href={montarUrl(
                  busca,
                  anoSelecionado,
                  tipoSelecionado,
                  paginaAtual - 1
                )}
              >
                ← Anterior
              </Link>
            ) : (
              <span className="pagination-disabled">← Anterior</span>
            )}

            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>

            {paginaAtual < totalPaginas ? (
              <Link
                href={montarUrl(
                  busca,
                  anoSelecionado,
                  tipoSelecionado,
                  paginaAtual + 1
                )}
              >
                Próxima →
              </Link>
            ) : (
              <span className="pagination-disabled">Próxima →</span>
            )}
          </nav>
        )}

        <div className="data-disclaimer">
          <strong>Sobre os dados</strong>
          <p>
            As informações são apresentadas conforme os registros importados
            para o portal. A disponibilidade de autores e links oficiais
            depende dos dados existentes na base e na fonte consultada.
          </p>
        </div>

        <footer className="records-footer">
          <Link href="/">← Voltar à página inicial</Link>
          <span>Portal da Fiscalização · São Francisco — MG</span>
        </footer>
      </div>

      <style>{`
        .materias-page {
          min-height: 100vh;
          background: #f5f7f2;
          color: #173b2b;
        }

        /* Cabeçalho padronizado com a página de Diárias */
        .materias-page .records-top {
          background: #123c2b;
          color: #fff;
          border-bottom: 3px solid #c6a45b;
        }

        .materias-page .records-top-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .materias-page .records-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
        }

        .materias-page .brand-mark {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          color: #123c2b;
          background: #d4b56b;
          border-radius: 9px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .materias-page .records-brand strong,
        .materias-page .records-brand small {
          display: block;
        }

        .materias-page .records-brand strong {
          color: #fff;
          font-size: 1rem;
        }

        .materias-page .records-brand small {
          margin-top: 4px;
          color: #d5e1d6;
          font-size: 0.76rem;
        }

        .materias-page .records-nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .materias-page .records-nav a {
          padding: 9px 12px;
          color: #e2eae2;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .materias-page .records-nav a:hover,
        .materias-page .records-nav a[aria-current="page"] {
          color: #fff;
          background: #28563b;
        }

        .materias-page .materias-content {
          padding-top: 30px;
          padding-bottom: 42px;
        }

        .materias-page .records-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 25px;
          color: #68766b;
          font-size: 0.88rem;
        }

        .materias-page .records-breadcrumb a {
          color: #236442;
          text-decoration: none;
        }

        .materias-page .records-heading {
          margin-bottom: 26px;
        }

        .materias-page .section-eyebrow {
          color: #96752e;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .materias-page .records-heading h1 {
          margin: 9px 0 12px;
          color: #123c2b;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.12;
          font-weight: 800;
        }

        .materias-page .records-heading > p {
          max-width: 760px;
          color: #58685d;
          line-height: 1.75;
        }

        .materias-page .records-overview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 28px 0;
        }

        .materias-page .overview-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
          padding: 22px;
          background: #fff;
          border: 1px solid #dce5da;
          border-top: 3px solid #c6a45b;
          border-radius: 10px;
          box-shadow: 0 5px 18px rgb(18 60 43 / 5%);
        }

        .materias-page .overview-card > span {
          color: #617064;
          font-size: 0.87rem;
        }

        .materias-page .overview-card strong {
          color: #174d31;
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          overflow-wrap: anywhere;
        }

        .materias-page .overview-card small {
          color: #748075;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .materias-page .filters-panel {
          display: flex;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px;
          margin: 28px 0;
          padding: 24px;
          background: #fff;
          border: 1px solid #dce5da;
          border-top: 4px solid #c6a45b;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgb(18 60 43 / 6%);
        }

        .materias-page .filter-field {
          display: flex;
          flex: 1 1 200px;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .materias-page .filter-search {
          flex: 2 1 300px;
        }

        .materias-page .filter-field label {
          color: #234b36;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .materias-page .filter-field input,
        .materias-page .filter-field select {
          width: 100%;
          min-height: 46px;
          padding: 10px 12px;
          color: #21392b;
          background: #fff;
          border: 1px solid #cbd8cb;
          border-radius: 7px;
          outline: none;
        }

        .materias-page .filter-field input:focus,
        .materias-page .filter-field select:focus {
          border-color: #286744;
          box-shadow: 0 0 0 3px rgb(40 103 68 / 13%);
        }

        .materias-page .filter-button {
          min-height: 46px;
          padding: 0 24px;
          color: #fff;
          background: #1c5939;
          border: 1px solid #1c5939;
          border-radius: 7px;
          font-weight: 800;
          cursor: pointer;
        }

        .materias-page .filter-button:hover {
          background: #123c2b;
        }

        .materias-page .filter-reset {
          padding: 12px 4px;
          color: #526457;
          font-size: 0.9rem;
        }

        .materias-page .records-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin: 32px 0 18px;
        }

        .materias-page .records-summary h2 {
          margin: 0;
          color: #123c2b;
          font-size: 1.3rem;
        }

        .materias-page .records-summary p {
          margin: 7px 0 0;
          color: #647368;
          font-size: 0.9rem;
        }

        .materias-page .records-page-count {
          color: #647368;
          font-size: 0.9rem;
        }

        .materias-page .materias-list {
          display: grid;
          gap: 18px;
        }

        .materias-page .materia-card {
          min-width: 0;
          padding: 24px;
          background: #fff;
          border: 1px solid #dce5da;
          border-left: 4px solid #286744;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgb(18 60 43 / 5%);
        }

        .materias-page .materia-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .materias-page .materia-identificacao {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .materias-page .materia-tipo {
          padding: 6px 10px;
          color: #1c5939;
          background: #edf4ed;
          border: 1px solid #cfdfce;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .materias-page .materia-numero {
          color: #96752e;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .materias-page .materia-situacao {
          padding: 6px 10px;
          color: #526457;
          background: #f2f5ef;
          border: 1px solid #dce5da;
          border-radius: 6px;
          font-size: 0.8rem;
          overflow-wrap: anywhere;
        }

        .materias-page .materia-card h3 {
          margin: 18px 0;
          color: #173f2b;
          font-size: 1.12rem;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .materias-page .materia-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .materias-page .materia-meta > div {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          padding: 15px;
          background: #f5f8f3;
          border: 1px solid #e1e9de;
          border-radius: 8px;
        }

        .materias-page .materia-meta span {
          color: #657568;
          font-size: 0.82rem;
        }

        .materias-page .materia-meta strong {
          color: #234b36;
          font-size: 0.93rem;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .materias-page .materia-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e8eee6;
        }

        .materias-page .materia-card-footer span {
          color: #748075;
          font-size: 0.8rem;
          overflow-wrap: anywhere;
        }

        .materias-page .materia-card-footer a {
          display: inline-flex;
          padding: 10px 14px;
          color: #1c5939;
          background: #edf4ed;
          border: 1px solid #cfdfce;
          border-radius: 7px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
        }

        .materias-page .materia-card-footer a:hover {
          color: #fff;
          background: #1c5939;
        }

        .materias-page .empty-state {
          padding: 28px;
          background: #fff;
          border: 1px solid #dce5da;
          border-radius: 12px;
        }

        .materias-page .empty-state h3 {
          color: #173f2b;
        }

        .materias-page .empty-state p {
          color: #617064;
          line-height: 1.7;
        }

        .materias-page .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 18px;
          margin: 30px 0;
        }

        .materias-page .pagination a {
          display: inline-flex;
          padding: 11px 16px;
          color: #fff;
          background: #1c5939;
          border-radius: 7px;
          font-weight: 700;
          text-decoration: none;
        }

        .materias-page .pagination a:hover {
          background: #123c2b;
        }

        .materias-page .pagination > span {
          color: #526457;
          font-size: 0.9rem;
        }

        .materias-page .pagination .pagination-disabled {
          padding: 11px 16px;
          color: #89958b;
          background: #e8ece6;
          border-radius: 7px;
        }

        .materias-page .data-disclaimer {
          margin-top: 32px;
          padding: 18px;
          color: #647166;
          background: #edf2e9;
          border-left: 3px solid #c6a45b;
          border-radius: 4px;
        }

        .materias-page .data-disclaimer strong {
          color: #234b36;
        }

        .materias-page .data-disclaimer p {
          margin: 8px 0 0;
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .materias-page .records-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
          padding-top: 22px;
          border-top: 1px solid #dce5da;
        }

        .materias-page .records-footer a {
          color: #1c5939;
          font-weight: 700;
          text-decoration: none;
        }

        .materias-page .records-footer span {
          color: #748075;
          font-size: 0.82rem;
        }

        @media (max-width: 760px) {
          .materias-page .records-top-inner {
            align-items: flex-start;
          }

          .materias-page .records-nav {
            width: 100%;
          }

          .materias-page .records-nav a {
            padding: 8px 9px;
          }

          .materias-page .records-overview {
            grid-template-columns: 1fr;
          }

          .materias-page .filters-panel {
            padding: 18px;
          }

          .materias-page .filter-button {
            flex: 1 1 100%;
          }

          .materias-page .filter-reset {
            text-align: center;
          }

          .materias-page .materia-card {
            padding: 18px;
          }

          .materias-page .materia-meta {
            grid-template-columns: 1fr;
          }

          .materias-page .records-footer {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}