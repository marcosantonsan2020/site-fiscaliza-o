export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Diaria = {
  id: string;
  fonte_id: string | null;
  ano: number | null;
  beneficiario: string | null;
  cargo_funcao: string | null;
  data_inicial: string | null;
  data_final: string | null;
  origem: string | null;
  destino: string | null;
  quantidade: number | string | null;
  objetivo: string | null;
  valor_pago: number | string | null;
  total_valor_pago: number | string | null;
  periodo: string | null;
  url_oficial: string | null;
};

type Params = {
  busca?: string;
  ano?: string;
  pagina?: string;
};

const POR_PAGINA = 20;

function moeda(valor: number | string | null | undefined) {
  const numero = Number(valor ?? 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function texto(valor: string | null | undefined) {
  return valor?.trim() || "Não informado";
}

function montarUrl(busca: string, ano: string, pagina: number) {
  const params = new URLSearchParams();

  if (busca) params.set("busca", busca);
  if (ano) params.set("ano", ano);
  if (pagina > 1) params.set("pagina", String(pagina));

  const query = params.toString();

  return query ? `/diarias?${query}` : "/diarias";
}

export default async function DiariasPage({
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

  const { data: anosData, error: erroAnos } = await supabase
    .from("diarias")
    .select("ano")
    .not("ano", "is", null)
    .order("ano", { ascending: false })
    .limit(1000);

  if (erroAnos) {
    console.error("Erro ao consultar anos das diárias:", erroAnos.message);

    return (
      <main className="records-page diarias-page">
        <div className="records-content">
          <h1>Diárias e viagens</h1>
          <p>Não foi possível carregar os dados. Tente novamente.</p>
          <Link href="/">Voltar ao Portal da Fiscalização</Link>
        </div>
      </main>
    );
  }

  const anos = [
    ...new Set(
      (anosData ?? [])
        .map((item) => item.ano)
        .filter((ano): ano is number => ano !== null)
    ),
  ].sort((a, b) => b - a);

  const anoSelecionado = anos.includes(Number(anoSolicitado))
    ? anoSolicitado
    : "";

  function aplicarFiltros(query: any) {
    let resultado = query;

    if (anoSelecionado) {
      resultado = resultado.eq("ano", Number(anoSelecionado));
    }

    if (busca) {
      const termo = busca.replace(/[,%()]/g, " ").trim();

      if (termo) {
        resultado = resultado.or(
          `beneficiario.ilike.%${termo}%,cargo_funcao.ilike.%${termo}%,destino.ilike.%${termo}%,origem.ilike.%${termo}%,objetivo.ilike.%${termo}%`
        );
      }
    }

    return resultado;
  }

  const colunas =
    "id, fonte_id, ano, beneficiario, cargo_funcao, data_inicial, data_final, origem, destino, quantidade, objetivo, valor_pago, total_valor_pago, periodo, url_oficial";

  const inicio = (pagina - 1) * POR_PAGINA;

  const consulta = aplicarFiltros(
    supabase.from("diarias").select(colunas, { count: "exact" })
  )
    .order("data_inicial", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(inicio, inicio + POR_PAGINA - 1);

  const [resultado, resultadoTotais] = await Promise.all([
    consulta,
    aplicarFiltros(
      supabase.from("diarias").select("total_valor_pago")
    ).limit(1000),
  ]);

  if (resultado.error || resultadoTotais.error) {
    console.error(
      "Erro ao consultar diárias:",
      resultado.error?.message ?? resultadoTotais.error?.message
    );

    return (
      <main className="records-page diarias-page">
        <div className="records-content">
          <h1>Diárias e viagens</h1>
          <p>
            Ocorreu um erro ao consultar os registros. Verifique a conexão
            com o Supabase e tente novamente.
          </p>
          <Link href="/">Voltar ao Portal da Fiscalização</Link>
        </div>
      </main>
    );
  }

  const diarias = (resultado.data ?? []) as Diaria[];
  const totalRegistros = resultado.count ?? 0;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / POR_PAGINA)
  );

  const totalPago = (resultadoTotais.data ?? []).reduce(
    (soma: any, item: any) => soma + Number(item.total_valor_pago ?? 0),
    0
  );

  const paginaAtual = Math.min(pagina, totalPaginas);

  return (
    <main className="records-page diarias-page">
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
            <Link href="/diarias" aria-current="page">
              Diárias
            </Link>
            <Link href="/despesas">Despesas</Link>
          </nav>
        </div>
      </header>

      <div className="records-content diarias-content">
        <div className="records-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <span>Diárias e viagens</span>
        </div>

        <section className="records-heading">
          <span className="section-eyebrow">FISCALIZAÇÃO CIDADÃ</span>
          <h1>Diárias e viagens</h1>
          <p>
            Consulte os registros de diárias, beneficiários, destinos,
            períodos e valores publicados nas fontes oficiais.
          </p>
        </section>

        <section className="records-overview">
          <article className="overview-card">
            <span>Registros encontrados</span>
            <strong>{totalRegistros.toLocaleString("pt-BR")}</strong>
            <small>Conforme os filtros aplicados</small>
          </article>

          <article className="overview-card">
            <span>Total pago registrado</span>
            <strong>{moeda(totalPago)}</strong>
            <small>
              Soma dos valores retornados pela consulta
            </small>
          </article>

          <article className="overview-card">
            <span>Ano selecionado</span>
            <strong>{anoSelecionado || "Todos"}</strong>
            <small>Período de referência</small>
          </article>
        </section>

        <form className="filters-panel" action="/diarias" method="get">
          <div className="filter-field filter-search">
            <label htmlFor="busca">Pesquisar registros</label>
            <input
              id="busca"
              name="busca"
              type="search"
              defaultValue={busca}
              placeholder="Beneficiário, destino, cargo ou objetivo..."
              maxLength={100}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="ano">Ano</label>
            <select
              id="ano"
              name="ano"
              defaultValue={anoSelecionado}
            >
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

          <Link className="filter-reset" href="/diarias">
            Limpar filtros
          </Link>
        </form>

        <div className="records-summary">
          <div>
            <h2>Registros de diárias</h2>
            <p>
              {totalRegistros.toLocaleString("pt-BR")} registro(s)
              encontrado(s).
            </p>
          </div>

          <span className="records-page-count">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>

        {diarias.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma diária encontrada</h3>
            <p>
              Tente alterar o ano ou pesquisar por outro nome ou destino.
            </p>
          </div>
        ) : (
          <div className="expense-list">
            {diarias.map((diaria) => {
              const valor =
                diaria.total_valor_pago ?? diaria.valor_pago ?? 0;

              return (
                <article className="expense-card" key={diaria.id}>
                  <div className="expense-heading">
                    <div>
                      <span className="section-eyebrow">
                        DIÁRIA {diaria.ano ?? ""}
                      </span>
                      <h3>{texto(diaria.beneficiario)}</h3>
                      <p>{texto(diaria.cargo_funcao)}</p>
                    </div>

                    <div className="expense-amount">
                      <small>Valor registrado</small>
                      <strong>{moeda(valor)}</strong>
                    </div>
                  </div>

                  <div className="diaria-details">
                    <div>
                      <span>Período</span>
                      <strong>
                        {dataBR(diaria.data_inicial)} a{" "}
                        {dataBR(diaria.data_final)}
                      </strong>
                    </div>

                    <div>
                      <span>Origem</span>
                      <strong>{texto(diaria.origem)}</strong>
                    </div>

                    <div>
                      <span>Destino</span>
                      <strong>{texto(diaria.destino)}</strong>
                    </div>

                    <div>
                      <span>Quantidade</span>
                      <strong>
                        {diaria.quantidade === null
                          ? "Não informada"
                          : String(diaria.quantidade)}
                      </strong>
                    </div>
                  </div>

                  <div className="diaria-objective">
                    <span>Objetivo da viagem</span>
                    <p>{texto(diaria.objetivo)}</p>
                  </div>

                  {diaria.periodo && (
                    <p className="diaria-period">
                      <strong>Período informado:</strong> {diaria.periodo}
                    </p>
                  )}

                  <div className="expense-footer">
                    <span>Registro: {texto(diaria.fonte_id)}</span>

                    {diaria.url_oficial &&
                    /^https?:\/\//i.test(diaria.url_oficial) ? (
                      <a
                        href={diaria.url_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Consultar fonte oficial ↗
                      </a>
                    ) : (
                      <span>Fonte oficial não disponível</span>
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
                href={montarUrl(busca, anoSelecionado, paginaAtual - 1)}
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
                href={montarUrl(busca, anoSelecionado, paginaAtual + 1)}
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
            para o portal. Para confirmação, consulte a fonte oficial quando
            disponível. O total exibido considera os valores retornados pela
            consulta ao banco de dados.
          </p>
        </div>

        <footer className="records-footer">
          <Link href="/">← Voltar ao início</Link>
          <span>Portal da Fiscalização · São Francisco — MG</span>
        </footer>
      </div>

      <style>{`
        .diarias-page {
          min-height: 100vh;
          background: #f5f7f2;
          color: #173b2b;
        }

        .diarias-page .records-top {
          background: #123c2b;
          color: #fff;
          border-bottom: 3px solid #c6a45b;
        }

        .diarias-page .records-top-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .diarias-page .records-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
        }

        .diarias-page .brand-mark {
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

        .diarias-page .records-brand strong,
        .diarias-page .records-brand small {
          display: block;
        }

        .diarias-page .records-brand strong {
          color: #fff;
          font-size: 1rem;
        }

        .diarias-page .records-brand small {
          margin-top: 4px;
          color: #d5e1d6;
          font-size: 0.76rem;
        }

        .diarias-page .records-nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .diarias-page .records-nav a {
          padding: 9px 12px;
          color: #e2eae2;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .diarias-page .records-nav a:hover,
        .diarias-page .records-nav a[aria-current="page"] {
          color: #fff;
          background: #28563b;
        }

        .diarias-page .diarias-content {
          padding-top: 30px;
          padding-bottom: 42px;
        }

        .diarias-page .records-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 25px;
          color: #68766b;
          font-size: 0.88rem;
        }

        .diarias-page .records-breadcrumb a {
          color: #236442;
          text-decoration: none;
        }

        .diarias-page .records-heading {
          margin-bottom: 26px;
        }

        .diarias-page .section-eyebrow {
          color: #96752e;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .diarias-page .records-heading h1 {
          margin: 9px 0 12px;
          color: #123c2b;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.12;
          font-weight: 800;
        }

        .diarias-page .records-heading > p {
          max-width: 760px;
          color: #58685d;
          line-height: 1.75;
        }

        .diarias-page .records-overview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 28px 0;
        }

        .diarias-page .overview-card {
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

        .diarias-page .overview-card > span {
          color: #617064;
          font-size: 0.87rem;
        }

        .diarias-page .overview-card strong {
          color: #174d31;
          font-size: clamp(1.35rem, 2.5vw, 1.8rem);
          overflow-wrap: anywhere;
        }

        .diarias-page .overview-card small {
          color: #748075;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .diarias-page .filters-panel {
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

        .diarias-page .filter-field {
          display: flex;
          flex: 1 1 200px;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .diarias-page .filter-search {
          flex: 2 1 300px;
        }

        .diarias-page .filter-field label {
          color: #234b36;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .diarias-page .filter-field input,
        .diarias-page .filter-field select {
          width: 100%;
          min-height: 46px;
          padding: 10px 12px;
          color: #21392b;
          background: #fff;
          border: 1px solid #cbd8cb;
          border-radius: 7px;
          outline: none;
        }

        .diarias-page .filter-field input:focus,
        .diarias-page .filter-field select:focus {
          border-color: #286744;
          box-shadow: 0 0 0 3px rgb(40 103 68 / 13%);
        }

        .diarias-page .filter-button {
          min-height: 46px;
          padding: 0 24px;
          color: #fff;
          background: #1c5939;
          border: 1px solid #1c5939;
          border-radius: 7px;
          font-weight: 800;
          cursor: pointer;
        }

        .diarias-page .filter-button:hover {
          background: #123c2b;
        }

        .diarias-page .filter-reset {
          padding: 12px 4px;
          color: #526457;
          font-size: 0.9rem;
        }

        .diarias-page .records-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin: 32px 0 18px;
        }

        .diarias-page .records-summary h2 {
          margin: 0;
          color: #123c2b;
          font-size: 1.3rem;
        }

        .diarias-page .records-summary p {
          margin: 7px 0 0;
          color: #647368;
          font-size: 0.9rem;
        }

        .diarias-page .records-page-count {
          color: #647368;
          font-size: 0.9rem;
        }

        .diarias-page .expense-list {
          display: grid;
          gap: 18px;
        }

        .diarias-page .expense-card {
          min-width: 0;
          padding: 24px;
          background: #fff;
          border: 1px solid #dce5da;
          border-left: 4px solid #286744;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgb(18 60 43 / 5%);
        }

        .diarias-page .expense-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
        }

        .diarias-page .expense-heading h3 {
          margin: 8px 0 5px;
          color: #173f2b;
          font-size: 1.2rem;
          overflow-wrap: anywhere;
        }

        .diarias-page .expense-heading > div:first-child > p {
          margin: 6px 0 0;
          color: #68766b;
          font-size: 0.9rem;
        }

        .diarias-page .expense-amount {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 13px 16px;
          background: #edf5ed;
          border: 1px solid #cbdcc9;
          border-radius: 8px;
        }

        .diarias-page .expense-amount small {
          color: #5f7363;
          font-size: 0.8rem;
        }

        .diarias-page .expense-amount strong {
          color: #17643b;
          font-size: 1.2rem;
          overflow-wrap: anywhere;
        }

        .diarias-page .diaria-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .diarias-page .diaria-details > div {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          padding: 15px;
          background: #f5f8f3;
          border: 1px solid #e1e9de;
          border-radius: 8px;
        }

        .diarias-page .diaria-details span,
        .diarias-page .diaria-objective > span {
          color: #657568;
          font-size: 0.82rem;
        }

        .diarias-page .diaria-details strong {
          color: #234b36;
          font-size: 0.93rem;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .diarias-page .diaria-objective {
          margin-top: 16px;
          padding: 17px;
          background: #fafbf8;
          border-left: 3px solid #c6a45b;
          border-radius: 4px;
        }

        .diarias-page .diaria-objective p {
          margin: 8px 0 0;
          color: #536358;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .diarias-page .diaria-period {
          margin: 16px 0 0;
          color: #536358;
          font-size: 0.88rem;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .diarias-page .expense-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e8eee6;
        }

        .diarias-page .expense-footer span {
          color: #748075;
          font-size: 0.8rem;
          overflow-wrap: anywhere;
        }

        .diarias-page .expense-footer a {
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

        .diarias-page .expense-footer a:hover {
          color: #fff;
          background: #1c5939;
        }

        .diarias-page .empty-state {
          padding: 28px;
          background: #fff;
          border: 1px solid #dce5da;
          border-radius: 12px;
        }

        .diarias-page .empty-state h3 {
          color: #173f2b;
        }

        .diarias-page .empty-state p {
          color: #617064;
          line-height: 1.7;
        }

        .diarias-page .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 18px;
          margin: 30px 0;
        }

        .diarias-page .pagination a {
          display: inline-flex;
          padding: 11px 16px;
          color: #fff;
          background: #1c5939;
          border-radius: 7px;
          font-weight: 700;
          text-decoration: none;
        }

        .diarias-page .pagination a:hover {
          background: #123c2b;
        }

        .diarias-page .pagination > span {
          color: #526457;
          font-size: 0.9rem;
        }

        .diarias-page .pagination .pagination-disabled {
          padding: 11px 16px;
          color: #89958b;
          background: #e8ece6;
          border-radius: 7px;
        }

        .diarias-page .data-disclaimer {
          margin-top: 32px;
          padding: 18px;
          color: #647166;
          background: #edf2e9;
          border-left: 3px solid #c6a45b;
          border-radius: 4px;
        }

        .diarias-page .data-disclaimer strong {
          color: #234b36;
        }

        .diarias-page .data-disclaimer p {
          margin: 8px 0 0;
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .diarias-page .records-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
          padding-top: 22px;
          border-top: 1px solid #dce5da;
        }

        .diarias-page .records-footer a {
          color: #1c5939;
          font-weight: 700;
          text-decoration: none;
        }

        .diarias-page .records-footer span {
          color: #748075;
          font-size: 0.82rem;
        }

        @media (max-width: 760px) {
          .diarias-page .records-top-inner {
            align-items: flex-start;
          }

          .diarias-page .records-nav {
            width: 100%;
          }

          .diarias-page .records-nav a {
            padding: 8px 9px;
          }

          .diarias-page .records-overview {
            grid-template-columns: 1fr;
          }

          .diarias-page .filters-panel {
            padding: 18px;
          }

          .diarias-page .filter-button {
            flex: 1 1 100%;
          }

          .diarias-page .filter-reset {
            text-align: center;
          }

          .diarias-page .expense-card {
            padding: 18px;
          }

          .diarias-page .diaria-details {
            grid-template-columns: 1fr;
          }

          .diarias-page .records-footer {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}