export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Empenho = {
  id: string | number;
  ano: number | null;
  numero_empenho: string | number | null;
  credor: string | null;
  data_emissao: string | null;
  valor_empenhado: number | string | null;
  valor_liquidado: number | string | null;
  valor_pago: number | string | null;
  valor_anulado: number | string | null;
  descricao: string | null;
  url_oficial: string | null;
};

type Params = {
  busca?: string;
  ano?: string;
  pagina?: string;
};

const POR_PAGINA = 20;

function moeda(valor: number | string | null) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(data: string | null) {
  if (!data) return "—";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function texto(valor: string | null | undefined) {
  return valor?.trim() || "Não informado";
}

function urlPagina(pagina: number, busca: string, ano: string) {
  const params = new URLSearchParams();

  if (busca) params.set("busca", busca);
  if (ano) params.set("ano", ano);

  if (pagina > 1) params.set("pagina", String(pagina));

  const query = params.toString();
  return query ? `/despesas?${query}` : "/despesas";
}

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  const busca = (params.busca ?? "").trim().slice(0, 100);
  const anoSolicitado = params.ano ?? "";
  const paginaSolicitada = Number(params.pagina ?? "1");

  const pagina =
    Number.isSafeInteger(paginaSolicitada) && paginaSolicitada > 0
      ? Math.min(paginaSolicitada, 100000)
      : 1;

  let consulta = supabase
    .from("empenhos")
    .select(
      "id, ano, numero_empenho, credor, data_emissao, valor_empenhado, valor_liquidado, valor_pago, valor_anulado, descricao, url_oficial",
      { count: "exact" }
    );

  if (/^\d{4}$/.test(anoSolicitado)) {
    consulta = consulta.eq("ano", Number(anoSolicitado));
  }

  if (busca) {
    consulta = consulta.ilike("credor", `%${busca}%`);
  }

  const inicio = (pagina - 1) * POR_PAGINA;

  const [resultado, anosResultado] = await Promise.all([
    consulta
      .order("data_emissao", { ascending: false, nullsFirst: false })
      .range(inicio, inicio + POR_PAGINA - 1),

    supabase
      .from("empenhos")
      .select("ano")
      .not("ano", "is", null)
      .order("ano", { ascending: false })
      .limit(2000),
  ]);

  const { data, error, count } = resultado;

  const empenhos = (data ?? []) as Empenho[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const anos = Array.from(
    new Set(
      (anosResultado.data ?? [])
        .map((item) => item.ano)
        .filter((ano): ano is number => typeof ano === "number")
    )
  ).sort((a, b) => b - a);

  const anoSelecionado = anos.includes(Number(anoSolicitado))
    ? anoSolicitado
    : "";

  return (
    <main className="records-page despesas-page">
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
            <Link href="/materias">Matérias</Link>
            <Link href="/diarias">Diárias</Link>
            <Link href="/despesas" aria-current="page">
              Despesas
            </Link>
          </nav>
        </div>
      </header>

      <div className="records-content despesas-content">
        <div className="records-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <span>Despesas e empenhos</span>
        </div>

        <section className="records-heading">
          <span className="section-eyebrow">FISCALIZAÇÃO CIDADÃ</span>
          <h1>Despesas e empenhos</h1>
          <p>
            Consulte os registros de empenhos disponíveis no banco de dados
            do portal e examine os valores empenhados, liquidados, pagos
            e anulados.
          </p>
        </section>

        <section className="records-overview">
          <article className="overview-card">
            <span>Registros encontrados</span>
            <strong>{total.toLocaleString("pt-BR")}</strong>
            <small>Conforme os filtros aplicados</small>
          </article>

          <article className="overview-card">
            <span>Credores nesta página</span>
            <strong>{empenhos.length.toLocaleString("pt-BR")}</strong>
            <small>Registros exibidos nesta página</small>
          </article>

          <article className="overview-card">
            <span>Ano selecionado</span>
            <strong>{anoSelecionado || "Todos"}</strong>
            <small>Período de referência</small>
          </article>
        </section>

        <form className="filters-panel" action="/despesas" method="get">
          <div className="filter-field filter-search">
            <label htmlFor="busca">Nome do credor</label>
            <input
              id="busca"
              name="busca"
              type="search"
              defaultValue={busca}
              placeholder="Pesquisar fornecedor ou credor..."
              maxLength={100}
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

          <button className="filter-button" type="submit">
            Pesquisar
          </button>

          <Link className="filter-reset" href="/despesas">
            Limpar filtros
          </Link>
        </form>

        <div className="records-summary">
          <div>
            <h2>Registros de empenhos</h2>
            <p>
              {total.toLocaleString("pt-BR")} registro(s) encontrado(s).
            </p>
          </div>

          <span className="records-page-count">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>

        {error ? (
          <div className="empty-state">
            <h3>Não foi possível consultar os empenhos</h3>
            <p>
              Ocorreu um erro ao consultar o banco de dados. Verifique
              a conexão com o Supabase e tente novamente.
            </p>
          </div>
        ) : empenhos.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum empenho encontrado</h3>
            <p>
              Tente pesquisar por outro credor ou selecionar um ano diferente.
            </p>
          </div>
        ) : (
          <div className="expense-list">
            {empenhos.map((item) => (
              <article className="expense-card" key={item.id}>
                <div className="expense-heading">
                  <div>
                    <span className="section-eyebrow">
                      EMPENHO Nº {item.numero_empenho ?? "Não informado"}
                    </span>

                    <h3>{texto(item.credor)}</h3>

                    <p>
                      Emissão: {dataBR(item.data_emissao)} · Ano:{" "}
                      {item.ano ?? "Não informado"}
                    </p>
                  </div>

                  {item.url_oficial &&
                  /^https?:\/\//i.test(item.url_oficial) ? (
                    <a
                      className="official-link"
                      href={item.url_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consultar fonte oficial ↗
                    </a>
                  ) : (
                    <span className="official-link-unavailable">
                      Fonte oficial não disponível
                    </span>
                  )}
                </div>

                {item.descricao && (
                  <div className="expense-description">
                    <span>Descrição da despesa</span>
                    <p>{item.descricao}</p>
                  </div>
                )}

                <div className="expense-values">
                  <div>
                    <span>Empenhado</span>
                    <strong>{moeda(item.valor_empenhado)}</strong>
                  </div>

                  <div>
                    <span>Liquidado</span>
                    <strong>{moeda(item.valor_liquidado)}</strong>
                  </div>

                  <div>
                    <span>Pago</span>
                    <strong>{moeda(item.valor_pago)}</strong>
                  </div>

                  <div>
                    <span>Anulado</span>
                    <strong>{moeda(item.valor_anulado)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!error && totalPaginas > 1 && (
          <nav className="pagination" aria-label="Paginação">
            {paginaAtual > 1 ? (
              <Link
                href={urlPagina(paginaAtual - 1, busca, anoSelecionado)}
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
                href={urlPagina(paginaAtual + 1, busca, anoSelecionado)}
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
            Os valores são apresentados conforme os registros disponíveis
            na base de dados. Para confirmação e contexto administrativo,
            consulte a fonte oficial quando disponibilizada.
          </p>
        </div>

        <footer className="records-footer">
          <Link href="/">← Voltar ao início</Link>
          <span>Portal da Fiscalização · São Francisco — MG</span>
        </footer>
      </div>

      <style>{`
        .despesas-page {
          min-height: 100vh;
          background: #f5f7f2;
          color: #173b2b;
        }

        /* Cabeçalho padronizado com a página de Diárias */
        .despesas-page .records-top {
          background: #123c2b;
          color: #fff;
          border-bottom: 3px solid #c6a45b;
        }

        .despesas-page .records-top-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .despesas-page .records-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
        }

        .despesas-page .brand-mark {
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

        .despesas-page .records-brand strong,
        .despesas-page .records-brand small {
          display: block;
        }

        .despesas-page .records-brand strong {
          color: #fff;
          font-size: 1rem;
        }

        .despesas-page .records-brand small {
          margin-top: 4px;
          color: #d5e1d6;
          font-size: 0.76rem;
        }

        .despesas-page .records-nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .despesas-page .records-nav a {
          padding: 9px 12px;
          color: #e2eae2;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .despesas-page .records-nav a:hover,
        .despesas-page .records-nav a[aria-current="page"] {
          color: #fff;
          background: #28563b;
        }

        .despesas-page .despesas-content {
          padding-top: 30px;
          padding-bottom: 42px;
        }

        .despesas-page .records-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 25px;
          color: #68766b;
          font-size: 0.88rem;
        }

        .despesas-page .records-breadcrumb a {
          color: #236442;
          text-decoration: none;
        }

        .despesas-page .records-heading {
          margin-bottom: 26px;
        }

        .despesas-page .section-eyebrow {
          color: #96752e;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .despesas-page .records-heading h1 {
          margin: 9px 0 12px;
          color: #123c2b;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.12;
          font-weight: 800;
        }

        .despesas-page .records-heading > p {
          max-width: 760px;
          color: #58685d;
          line-height: 1.75;
        }

        .despesas-page .records-overview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 28px 0;
        }

        .despesas-page .overview-card {
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

        .despesas-page .overview-card > span {
          color: #617064;
          font-size: 0.87rem;
        }

        .despesas-page .overview-card strong {
          color: #174d31;
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          overflow-wrap: anywhere;
        }

        .despesas-page .overview-card small {
          color: #748075;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .despesas-page .filters-panel {
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

        .despesas-page .filter-field {
          display: flex;
          flex: 1 1 200px;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .despesas-page .filter-search {
          flex: 2 1 300px;
        }

        .despesas-page .filter-field label {
          color: #234b36;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .despesas-page .filter-field input,
        .despesas-page .filter-field select {
          width: 100%;
          min-height: 46px;
          padding: 10px 12px;
          color: #21392b;
          background: #fff;
          border: 1px solid #cbd8cb;
          border-radius: 7px;
          outline: none;
        }

        .despesas-page .filter-field input:focus,
        .despesas-page .filter-field select:focus {
          border-color: #286744;
          box-shadow: 0 0 0 3px rgb(40 103 68 / 13%);
        }

        .despesas-page .filter-button {
          min-height: 46px;
          padding: 0 24px;
          color: #fff;
          background: #1c5939;
          border: 1px solid #1c5939;
          border-radius: 7px;
          font-weight: 800;
          cursor: pointer;
        }

        .despesas-page .filter-button:hover {
          background: #123c2b;
        }

        .despesas-page .filter-reset {
          padding: 12px 4px;
          color: #526457;
          font-size: 0.9rem;
        }

        .despesas-page .records-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin: 32px 0 18px;
        }

        .despesas-page .records-summary h2 {
          margin: 0;
          color: #123c2b;
          font-size: 1.3rem;
        }

        .despesas-page .records-summary p {
          margin: 7px 0 0;
          color: #647368;
          font-size: 0.9rem;
        }

        .despesas-page .records-page-count {
          color: #647368;
          font-size: 0.9rem;
        }

        .despesas-page .expense-list {
          display: grid;
          gap: 18px;
        }

        .despesas-page .expense-card {
          min-width: 0;
          padding: 24px;
          background: #fff;
          border: 1px solid #dce5da;
          border-left: 4px solid #286744;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgb(18 60 43 / 5%);
        }

        .despesas-page .expense-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
        }

        .despesas-page .expense-heading h3 {
          margin: 8px 0 5px;
          color: #173f2b;
          font-size: 1.2rem;
          overflow-wrap: anywhere;
        }

        .despesas-page .expense-heading > div:first-child > p {
          margin: 6px 0 0;
          color: #68766b;
          font-size: 0.9rem;
        }

        .despesas-page .official-link,
        .despesas-page .official-link-unavailable {
          display: inline-flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 7px;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .despesas-page .official-link {
          color: #1c5939;
          background: #edf4ed;
          border: 1px solid #cfdfce;
          text-decoration: none;
        }

        .despesas-page .official-link:hover {
          color: #fff;
          background: #1c5939;
        }

        .despesas-page .official-link-unavailable {
          color: #748075;
          background: #f5f7f2;
          border: 1px solid #e1e9de;
        }

        .despesas-page .expense-description {
          margin-top: 20px;
          padding: 16px;
          background: #fafbf8;
          border-left: 3px solid #c6a45b;
          border-radius: 4px;
        }

        .despesas-page .expense-description > span {
          color: #657568;
          font-size: 0.82rem;
        }

        .despesas-page .expense-description p {
          margin: 8px 0 0;
          color: #536358;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .despesas-page .expense-values {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .despesas-page .expense-values > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          padding: 15px;
          background: #f5f8f3;
          border: 1px solid #e1e9de;
          border-radius: 8px;
        }

        .despesas-page .expense-values span {
          color: #657568;
          font-size: 0.82rem;
        }

        .despesas-page .expense-values strong {
          color: #174d31;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }

        .despesas-page .expense-values > div:nth-child(3) {
          background: #edf5ed;
          border-color: #cbdcc9;
        }

        .despesas-page .expense-values > div:nth-child(3) strong {
          color: #17643b;
        }

        .despesas-page .empty-state {
          padding: 28px;
          background: #fff;
          border: 1px solid #dce5da;
          border-radius: 12px;
        }

        .despesas-page .empty-state h3 {
          color: #173f2b;
        }

        .despesas-page .empty-state p {
          color: #617064;
          line-height: 1.7;
        }

        .despesas-page .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 18px;
          margin: 30px 0;
        }

        .despesas-page .pagination a {
          display: inline-flex;
          padding: 11px 16px;
          color: #fff;
          background: #1c5939;
          border-radius: 7px;
          font-weight: 700;
          text-decoration: none;
        }

        .despesas-page .pagination a:hover {
          background: #123c2b;
        }

        .despesas-page .pagination > span {
          color: #526457;
          font-size: 0.9rem;
        }

        .despesas-page .pagination .pagination-disabled {
          padding: 11px 16px;
          color: #89958b;
          background: #e8ece6;
          border-radius: 7px;
        }

        .despesas-page .data-disclaimer {
          margin-top: 32px;
          padding: 18px;
          color: #647166;
          background: #edf2e9;
          border-left: 3px solid #c6a45b;
          border-radius: 4px;
        }

        .despesas-page .data-disclaimer strong {
          color: #234b36;
        }

        .despesas-page .data-disclaimer p {
          margin: 8px 0 0;
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .despesas-page .records-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
          padding-top: 22px;
          border-top: 1px solid #dce5da;
        }

        .despesas-page .records-footer a {
          color: #1c5939;
          font-weight: 700;
          text-decoration: none;
        }

        .despesas-page .records-footer span {
          color: #748075;
          font-size: 0.82rem;
        }

        @media (max-width: 760px) {
          .despesas-page .records-top-inner {
            align-items: flex-start;
          }

          .despesas-page .records-nav {
            width: 100%;
          }

          .despesas-page .records-nav a {
            padding: 8px 9px;
          }

          .despesas-page .records-overview {
            grid-template-columns: 1fr;
          }

          .despesas-page .filters-panel {
            padding: 18px;
          }

          .despesas-page .filter-button {
            flex: 1 1 100%;
          }

          .despesas-page .filter-reset {
            text-align: center;
          }

          .despesas-page .expense-card {
            padding: 18px;
          }

          .despesas-page .expense-values {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .despesas-page .records-footer {
            align-items: flex-start;
          }
        }

        @media (max-width: 380px) {
          .despesas-page .expense-values {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}