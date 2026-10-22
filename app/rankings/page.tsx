
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Params = {
  ano?: string;
  categoria?: string;
};

type Empenho = {
  id: string;
  ano: number | null;
  numero_empenho: string | null;
  credor: string | null;
  valor_empenhado: number | string | null;
  valor_liquidado: number | string | null;
  valor_pago: number | string | null;
  valor_anulado: number | string | null;
  data_emissao: string | null;
  descricao: string | null;
};

type Item = {
  id: string;
  empenho_id: string;
  descricao: string | null;
  quantidade: number | string | null;
  valor_total: number | string | null;
};

type Vereador = {
  id: string;
  nome: string;
  nome_parlamentar: string | null;
  partido: string | null;
  foto_url: string | null;
};

type Alias = {
  vereador_id: string;
  beneficiario_origem: string;
  conferido: boolean;
};

type Materia = {
  id: string;
  ano: number | null;
  tipo: string | null;
  situacao: string | null;
};

type Autor = {
  materia_id: string;
  vereador_id: string | null;
  autor_nome: string | null;
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

const compactBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const numeric = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const itemCategory = (description: string | null) => {
  const value = normalize(description ?? "");

  if (value.includes("diaria")) return "Diárias";

  if (value.includes("reembolso") || value.includes("ressarcimento")) {
    return "Reembolsos";
  }

  return "Outras despesas";
};

const monthLabel = (month: string) => {
  const names = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const index = Number(month.slice(5, 7)) - 1;
  return `${names[index] ?? month} ${month.slice(2, 4)}`;
};

function MetricCard({
  title,
  value,
  note,
  icon,
  tone = "green",
}: {
  title: string;
  value: string;
  note: string;
  icon: string;
  tone?: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-top">
        <span className="metric-title">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function HorizontalBars({
  rows,
  color = "#23815b",
  formatter = (v: number) => brl(v),
}: {
  rows: { label: string; value: number; detail?: string }[];
  color?: string;
  formatter?: (value: number) => string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  if (!rows.length) {
    return <p className="empty-state">Não há dados para este período.</p>;
  }

  return (
    <div className="horizontal-bars">
      {rows.map((row, index) => (
        <div className="bar-row" key={`${row.label}-${index}`}>
          <div className="bar-label-line">
            <span className="bar-label">
              <span className="bar-rank">{String(index + 1).padStart(2, "0")}</span>
              {row.label}
            </span>
            <strong>{formatter(row.value)}</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max((row.value / max) * 100, row.value > 0 ? 1 : 0)}%`,
                background: color,
              }}
            />
          </div>
          {row.detail && <span className="bar-detail">{row.detail}</span>}
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({
  rows,
}: {
  rows: { label: string; paid: number; committed: number }[];
}) {
  const max = Math.max(...rows.flatMap((r) => [r.paid, r.committed]), 1);

  if (!rows.length) {
    return <p className="empty-state">Não há movimentações mensais disponíveis.</p>;
  }

  return (
    <div className="monthly-chart">
      <div className="chart-legend">
        <span><i className="legend-dot committed" /> Empenhado</span>
        <span><i className="legend-dot paid" /> Pago</span>
      </div>
      <div className="chart-bars">
        {rows.map((row) => (
          <div className="chart-column" key={row.label} title={`${row.label}: empenhado ${brl(row.committed)}, pago ${brl(row.paid)}`}>
            <div className="column-bars">
              <div
                className="column-bar committed"
                style={{ height: `${Math.max((row.committed / max) * 100, row.committed > 0 ? 2 : 0)}%` }}
              />
              <div
                className="column-bar paid"
                style={{ height: `${Math.max((row.paid / max) * 100, row.paid > 0 ? 2 : 0)}%` }}
              />
            </div>
            <span className="column-label">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-scale">
        <span>Escala máxima: {compactBRL(max)}</span>
        <span>Valores em R$</span>
      </div>
    </div>
  );
}

function DonutChart({
  rows,
}: {
  rows: { label: string; value: number; color: string }[];
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  let offset = 0;
  const circumference = 2 * Math.PI * 65;

  if (total <= 0) {
    return (
      <div className="donut-empty">
        <div className="donut-ring empty-ring" />
        <p>Sem valores de itens para exibir neste período.</p>
      </div>
    );
  }

  return (
    <div className="donut-layout">
      <div className="donut-visual">
        <svg viewBox="0 0 180 180" role="img" aria-label="Distribuição de despesas por categoria">
          <circle cx="90" cy="90" r="65" fill="none" stroke="#edf1ec" strokeWidth="22" />
          {rows.filter((row) => row.value > 0).map((row) => {
            const length = (row.value / total) * circumference;
            const currentOffset = offset;
            offset += length;

            return (
              <circle
                key={row.label}
                cx="90"
                cy="90"
                r="65"
                fill="none"
                stroke={row.color}
                strokeWidth="22"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 90 90)"
              />
            );
          })}
          <text x="90" y="84" textAnchor="middle" className="donut-number">
            {rows.length}
          </text>
          <text x="90" y="103" textAnchor="middle" className="donut-caption">
            categorias
          </text>
        </svg>
      </div>
      <div className="donut-legend">
        {rows.map((row) => (
          <div className="donut-legend-row" key={row.label}>
            <span className="donut-name">
              <i style={{ background: row.color }} />
              {row.label}
            </span>
            <strong>{brl(row.value)}</strong>
            <small>{((row.value / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</small>
          </div>
        ))}
        <div className="donut-total">
          <span>Total dos itens</span>
          <strong>{brl(total)}</strong>
        </div>
      </div>
    </div>
  );
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const selectedYear = params.ano ?? "todos";
  const selectedCategory = params.categoria ?? "todas";

  const [
    empenhosResponse,
    itemsResponse,
    councilorsResponse,
    aliasesResponse,
    mattersResponse,
    authorsResponse,
  ] = await Promise.all([
    supabase
      .from("empenhos")
      .select("id, ano, numero_empenho, credor, valor_empenhado, valor_liquidado, valor_pago, valor_anulado, data_emissao, descricao")
      .order("ano", { ascending: false })
      .limit(10000),

    supabase
      .from("empenho_itens")
      .select("id, empenho_id, descricao, quantidade, valor_total")
      .limit(20000),

    supabase
      .from("vereadores")
      .select("id, nome, nome_parlamentar, partido, foto_url")
      .limit(1000),

    supabase
      .from("vereadores_diarias_alias")
      .select("vereador_id, beneficiario_origem, conferido")
      .limit(5000),

    supabase
      .from("materias")
      .select("id, ano, tipo, situacao")
      .limit(10000),

    supabase
      .from("materias_autores")
      .select("materia_id, vereador_id, autor_nome")
      .limit(20000),
  ]);

  const errors = [
    empenhosResponse.error,
    itemsResponse.error,
    councilorsResponse.error,
    aliasesResponse.error,
    mattersResponse.error,
    authorsResponse.error,
  ].filter(Boolean);

  if (errors.length) {
    return (
      <main className="dashboard">
        <div className="error-panel">
          <h1>Não foi possível carregar o painel</h1>
          <p>Verifique as permissões das tabelas e a conexão com o Supabase.</p>
          <code>{errors.map((error) => error!.message).join(" | ")}</code>
        </div>
      </main>
    );
  }

  const empenhos = (empenhosResponse.data ?? []) as Empenho[];
  const items = (itemsResponse.data ?? []) as Item[];
  const councilors = (councilorsResponse.data ?? []) as Vereador[];
  const aliases = (aliasesResponse.data ?? []) as Alias[];
  const matters = (mattersResponse.data ?? []) as Materia[];
  const authors = (authorsResponse.data ?? []) as Autor[];

  const availableYears = Array.from(
    new Set(empenhos.map((e) => e.ano).filter((y): y is number => y !== null))
  ).sort((a, b) => b - a);

  const filteredEmpenhos = empenhos.filter(
    (e) => selectedYear === "todos" || String(e.ano) === selectedYear
  );
  const filteredIds = new Set(filteredEmpenhos.map((e) => e.id));

  const filteredItems = items.filter((item) => {
    if (!filteredIds.has(item.empenho_id)) return false;
    return selectedCategory === "todas" || itemCategory(item.descricao) === selectedCategory;
  });

  const sumField = (
    rows: Empenho[],
    field: "valor_empenhado" | "valor_liquidado" | "valor_pago" | "valor_anulado"
  ) => rows.reduce((sum, row) => sum + numeric(row[field]), 0);

  const committed = sumField(filteredEmpenhos, "valor_empenhado");
  const liquidated = sumField(filteredEmpenhos, "valor_liquidado");
  const paid = sumField(filteredEmpenhos, "valor_pago");
  const annulled = sumField(filteredEmpenhos, "valor_anulado");

  const categoryColors: Record<string, string> = {
    Diárias: "#247a55",
    Reembolsos: "#c5a45a",
    "Outras despesas": "#6b8ca6",
  };

  const categoryRows = ["Diárias", "Reembolsos", "Outras despesas"].map((label) => ({
    label,
    value: filteredItems
      .filter((item) => itemCategory(item.descricao) === label)
      .reduce((sum, item) => sum + numeric(item.valor_total), 0),
    color: categoryColors[label],
  }));

  const totalItems = categoryRows.reduce((sum, row) => sum + row.value, 0);
  const dailyAllowances = categoryRows.find((row) => row.label === "Diárias")?.value ?? 0;
  const reimbursements = categoryRows.find((row) => row.label === "Reembolsos")?.value ?? 0;

  const itemMap = new Map<string, Item[]>();
  for (const item of filteredItems) {
    const list = itemMap.get(item.empenho_id) ?? [];
    list.push(item);
    itemMap.set(item.empenho_id, list);
  }

  const aliasMap = new Map<string, Alias>();
  for (const alias of aliases) {
    aliasMap.set(normalize(alias.beneficiario_origem), alias);
  }

  const councilorRanking = councilors
    .map((councilor) => {
      let daily = 0;
      let reimbursement = 0;
      const matchedEmpenhos = new Set<string>();

      for (const empenho of filteredEmpenhos) {
        const alias = aliasMap.get(normalize(empenho.credor ?? ""));

        if (!alias || alias.vereador_id !== councilor.id || !alias.conferido) continue;

        for (const item of itemMap.get(empenho.id) ?? []) {
          const category = itemCategory(item.descricao);
          if (category === "Diárias") {
            daily += numeric(item.valor_total);
            matchedEmpenhos.add(empenho.id);
          } else if (category === "Reembolsos") {
            reimbursement += numeric(item.valor_total);
            matchedEmpenhos.add(empenho.id);
          }
        }
      }

      return {
        ...councilor,
        displayName: councilor.nome_parlamentar || councilor.nome,
        daily,
        reimbursement,
        total: daily + reimbursement,
        count: matchedEmpenhos.size,
      };
    })
    .sort((a, b) => b.total - a.total);

  const creditorMap = new Map<
    string,
    { name: string; committed: number; paid: number; count: number }
  >();

  for (const empenho of filteredEmpenhos) {
    const name = empenho.credor?.trim() || "Credor não informado";
    const current = creditorMap.get(name) ?? {
      name,
      committed: 0,
      paid: 0,
      count: 0,
    };

    current.committed += numeric(empenho.valor_empenhado);
    current.paid += numeric(empenho.valor_pago);
    current.count += 1;
    creditorMap.set(name, current);
  }

  const creditors = Array.from(creditorMap.values()).sort((a, b) => b.paid - a.paid);

  const monthlyMap = new Map<
    string,
    { month: string; committed: number; paid: number }
  >();

  for (const empenho of filteredEmpenhos) {
    if (!empenho.data_emissao) continue;
    const month = empenho.data_emissao.slice(0, 7);
    const current = monthlyMap.get(month) ?? { month, committed: 0, paid: 0 };
    current.committed += numeric(empenho.valor_empenhado);
    current.paid += numeric(empenho.valor_pago);
    monthlyMap.set(month, current);
  }

  const monthlyRows = Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((row) => ({
      label: monthLabel(row.month),
      paid: row.paid,
      committed: row.committed,
    }));

  const annualMap = new Map<
    number,
    { year: number; committed: number; paid: number; liquidated: number }
  >();

  for (const empenho of empenhos) {
    if (empenho.ano === null) continue;
    const current = annualMap.get(empenho.ano) ?? {
      year: empenho.ano,
      committed: 0,
      paid: 0,
      liquidated: 0,
    };

    current.committed += numeric(empenho.valor_empenhado);
    current.paid += numeric(empenho.valor_pago);
    current.liquidated += numeric(empenho.valor_liquidado);
    annualMap.set(empenho.ano, current);
  }

  const annualRows = Array.from(annualMap.values()).sort((a, b) => a.year - b.year);
  const annualBars = annualRows.slice(-8).map((row) => ({
    label: String(row.year),
    value: row.paid,
    detail: `Empenhado: ${compactBRL(row.committed)}`,
  }));

  const mattersForYear = matters.filter(
    (matter) => selectedYear === "todos" || String(matter.ano) === selectedYear
  );
  const matterIds = new Set(mattersForYear.map((matter) => matter.id));

  const legislativeRanking = councilors
    .map((councilor) => {
      const distinct = new Set(
        authors
          .filter((author) => author.vereador_id === councilor.id && matterIds.has(author.materia_id))
          .map((author) => author.materia_id)
      );

      return {
        id: councilor.id,
        name: councilor.nome_parlamentar || councilor.nome,
        party: councilor.partido || "Sem partido informado",
        count: distinct.size,
        photo: councilor.foto_url,
      };
    })
    .sort((a, b) => b.count - a.count);

  const topItems = [...filteredItems]
    .sort((a, b) => numeric(b.valor_total) - numeric(a.valor_total))
    .slice(0, 10);

  const highestCreditor = creditors[0];
  const yearText = selectedYear === "todos" ? "Todos os anos" : selectedYear;

  return (
    <main className="dashboard">
      <header className="hero">
        <div className="hero-topline">
          <Link href="/" className="brand">
            <span className="brand-symbol">PF</span>
            <span>
              <strong>PORTAL DA FISCALIZAÇÃO</strong>
              <small>TRANSPARÊNCIA PÚBLICA</small>
            </span>
          </Link>
          <span className="live-label"><i /> PAINEL DE DADOS</span>
        </div>

        <div className="hero-content">
          <div>
            <span className="hero-kicker">CÂMARA MUNICIPAL · SÃO FRANCISCO / MG</span>
            <h1>Visão geral das<br /><em>contas públicas.</em></h1>
            <p>Acompanhe a execução das despesas, os fornecedores, as diárias e a produção legislativa em um só lugar.</p>
          </div>

          <div className="hero-period">
            <span>PERÍODO SELECIONADO</span>
            <strong>{yearText}</strong>
            <small>{filteredEmpenhos.length.toLocaleString("pt-BR")} empenhos consultados</small>
          </div>
        </div>

        <div className="hero-bottom">
          <span><i className="hero-dot" /> Dados provenientes das tabelas do portal</span>
          <span>Valores expressos em reais (R$)</span>
        </div>
      </header>

      <nav className="main-nav">
        <Link href="/">Visão geral</Link>
        <Link href="/vereadores">Vereadores</Link>
        <Link href="/materias">Matérias</Link>
        <Link href="/diarias">Diárias</Link>
        <Link href="/rankings" className="nav-active">Rankings <span>↗</span></Link>
      </nav>

      <form className="filter-panel" action="/rankings" method="get">
        <div className="filter-intro">
          <span className="filter-icon">☷</span>
          <div>
            <strong>Personalize sua consulta</strong>
            <small>Selecione o período e o tipo de despesa</small>
          </div>
        </div>
        <label>
          <span>ANO</span>
          <select name="ano" defaultValue={selectedYear}>
            <option value="todos">Todos os anos</option>
            {availableYears.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </label>
        <label>
          <span>CATEGORIA</span>
          <select name="categoria" defaultValue={selectedCategory}>
            <option value="todas">Todas as despesas</option>
            <option value="Diárias">Diárias</option>
            <option value="Reembolsos">Reembolsos</option>
            <option value="Outras despesas">Outras despesas</option>
          </select>
        </label>
        <button type="submit">Atualizar painel <span>→</span></button>
      </form>

      <section className="overview-section">
        <div className="overview-heading">
          <div>
            <span className="eyebrow">INDICADORES FINANCEIROS</span>
            <h2>Resumo da execução orçamentária</h2>
          </div>
          <span className="period-chip">{yearText}</span>
        </div>

        <div className="metrics-grid">
          <MetricCard title="Total empenhado" value={brl(committed)} note="Valores comprometidos" icon="↗" tone="green" />
          <MetricCard title="Total liquidado" value={brl(liquidated)} note="Despesas liquidadas" icon="▤" tone="blue" />
          <MetricCard title="Total pago" value={brl(paid)} note="Pagamentos registrados" icon="✓" tone="gold" />
          <MetricCard title="Total anulado" value={brl(annulled)} note="Anulações registradas" icon="↶" tone="rose" />
        </div>

        <div className="metrics-grid secondary-metrics">
          <MetricCard title="Diárias identificadas" value={brl(dailyAllowances)} note="Soma dos itens classificados" icon="⌁" />
          <MetricCard title="Reembolsos identificados" value={brl(reimbursements)} note="Soma dos itens classificados" icon="↩" tone="gold" />
          <MetricCard title="Itens de despesa" value={filteredItems.length.toLocaleString("pt-BR")} note="Itens incluídos no filtro" icon="▦" tone="blue" />
          <MetricCard title="Fornecedores / credores" value={creditors.length.toLocaleString("pt-BR")} note="Nomes distintos no período" icon="♧" tone="rose" />
        </div>

        <p className="disclaimer">
          Empenhado, liquidado e pago são etapas distintas e não devem ser somadas entre si. Os valores de diárias e reembolsos vêm dos itens classificados no banco e podem não representar todas as despesas da Câmara.
        </p>
      </section>

      <section className="analytics-grid">
        <article className="panel panel-large">
          <SectionHeading
            eyebrow="EVOLUÇÃO NO TEMPO"
            title="Movimentação mensal"
            description="Comparação entre valores empenhados e pagos nos últimos meses disponíveis."
          />
          <MonthlyChart rows={monthlyRows} />
        </article>

        <article className="panel">
          <SectionHeading
            eyebrow="COMPOSIÇÃO DAS DESPESAS"
            title="Categorias identificadas"
            description="Distribuição dos valores dos itens incluídos no filtro."
          />
          <DonutChart rows={categoryRows} />
        </article>
      </section>

      <section className="panel annual-panel">
        <SectionHeading
          eyebrow="ANÁLISE HISTÓRICA"
          title="Comparativo anual de pagamentos"
          description="Veja a evolução do total pago em cada ano disponível no banco."
        />
        <HorizontalBars
          rows={annualBars}
          color="#c5a45a"
          formatter={compactBRL}
        />
        <div className="annual-footnote">
          <span>Período histórico disponível: {annualRows.length ? `${annualRows[0].year}–${annualRows[annualRows.length - 1].year}` : "sem dados"}</span>
          <span>O comparativo usa o total pago por ano, sem misturar com o empenhado.</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading-row">
          <SectionHeading
            eyebrow="DESPESAS POR CREDOR"
            title="Maiores fornecedores"
            description="Classificação pelo valor total pago no período selecionado."
          />
          <span className="count-chip">TOP 10</span>
        </div>

        {highestCreditor && (
          <div className="featured-creditor">
            <div className="featured-icon">R$</div>
            <div>
              <span>MAIOR VALOR PAGO NO RANKING</span>
              <strong>{highestCreditor.name}</strong>
              <small>{highestCreditor.count} empenho(s) registrados</small>
            </div>
            <b>{brl(highestCreditor.paid)}</b>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Posição</th><th>Fornecedor / credor</th><th>Empenhos</th><th>Empenhado</th><th>Pago</th></tr>
            </thead>
            <tbody>
              {creditors.slice(0, 10).map((creditor, index) => (
                <tr key={creditor.name}>
                  <td><span className={`rank-number ${index < 3 ? "rank-medal" : ""}`}>{String(index + 1).padStart(2, "0")}</span></td>
                  <td className="table-name">{creditor.name}</td>
                  <td>{creditor.count}</td>
                  <td>{brl(creditor.committed)}</td>
                  <td className="money-cell">{brl(creditor.paid)}</td>
                </tr>
              ))}
              {!creditors.length && <tr><td colSpan={5}>Nenhum fornecedor encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading-row">
          <SectionHeading
            eyebrow="DIÁRIAS E REEMBOLSOS"
            title="Despesas atribuídas aos vereadores"
            description="Atribuição baseada em nomes de credores cadastrados como aliases e marcados como conferidos."
          />
          <span className="count-chip">{councilorRanking.length} VEREADORES</span>
        </div>

        <div className="councilor-grid">
          {councilorRanking.slice(0, 6).map((councilor, index) => (
            <article className="councilor-card" key={councilor.id}>
              <div className="councilor-card-top">
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                {councilor.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="councilor-photo"
                    src={councilor.foto_url}
                    alt={`Foto de ${councilor.displayName}`}
                  />
                ) : (
                  <div className="councilor-photo photo-placeholder">
                    {(councilor.displayName.trim()[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <span className="party-chip">{councilor.partido || "—"}</span>
              </div>
              <h3>{councilor.displayName}</h3>
              <div className="councilor-total">{brl(councilor.total)}</div>
              <span className="councilor-caption">Total atribuído identificado</span>
              <div className="councilor-breakdown">
                <div><span>Diárias</span><strong>{brl(councilor.daily)}</strong></div>
                <div><span>Reembolsos</span><strong>{brl(councilor.reimbursement)}</strong></div>
              </div>
              <div className="councilor-footer">
                <span>{councilor.count} empenho(s) relacionado(s)</span>
                <span className="arrow-mark">↗</span>
              </div>
            </article>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Vereador</th><th>Partido</th><th>Diárias</th><th>Reembolsos</th><th>Total</th></tr>
            </thead>
            <tbody>
              {councilorRanking.map((councilor, index) => (
                <tr key={councilor.id}>
                  <td><span className={`rank-number ${index < 3 ? "rank-medal" : ""}`}>{String(index + 1).padStart(2, "0")}</span></td>
                  <td className="table-name">{councilor.displayName}</td>
                  <td>{councilor.partido || "—"}</td>
                  <td>{brl(councilor.daily)}</td>
                  <td>{brl(councilor.reimbursement)}</td>
                  <td className="money-cell">{brl(councilor.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="disclaimer">
          Os valores individuais podem aparecer zerados quando não há alias confirmado que corresponda exatamente ao nome do credor. Isso não comprova ausência de despesas. Confira os dados antes de publicar conclusões sobre qualquer vereador.
        </p>
      </section>

      <section className="analytics-grid">
        <article className="panel panel-large">
          <SectionHeading
            eyebrow="ITENS DE MAIOR VALOR"
            title="Maiores itens de despesa"
            description="Itens ordenados pelo valor total registrado."
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Descrição</th><th>Categoria</th><th>Quantidade</th><th>Valor total</th></tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item.id}>
                    <td className="table-name">{item.descricao || "Sem descrição"}</td>
                    <td><span className="category-chip">{itemCategory(item.descricao)}</span></td>
                    <td>{numeric(item.quantidade).toLocaleString("pt-BR")}</td>
                    <td className="money-cell">{brl(numeric(item.valor_total))}</td>
                  </tr>
                ))}
                {!topItems.length && <tr><td colSpan={4}>Nenhum item encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <SectionHeading
            eyebrow="PRODUÇÃO LEGISLATIVA"
            title="Matérias por vereador"
            description="Quantidade de matérias distintas relacionadas a cada vereador."
          />
          <HorizontalBars
            rows={legislativeRanking.slice(0, 10).map((c) => ({
              label: c.name,
              value: c.count,
              detail: c.party,
            }))}
            color="#6b8ca6"
            formatter={(v) => `${v} matéria(s)`}
          />
          <p className="disclaimer">
            A contagem depende dos vínculos cadastrados em materias_autores e não representa, isoladamente, uma avaliação da atuação parlamentar.
          </p>
        </article>
      </section>

      <section className="panel annual-table-panel">
        <SectionHeading
          eyebrow="SÉRIE HISTÓRICA"
          title="Resumo por ano"
          description="Indicadores anuais calculados a partir dos registros de empenhos disponíveis."
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Ano</th><th>Empenhado</th><th>Liquidado</th><th>Pago</th><th>Diferença empenhado − pago</th></tr>
            </thead>
            <tbody>
              {[...annualRows].sort((a, b) => b.year - a.year).map((row) => (
                <tr key={row.year}>
                  <td className="year-cell">{row.year}</td>
                  <td>{brl(row.committed)}</td>
                  <td>{brl(row.liquidated)}</td>
                  <td className="money-cell">{brl(row.paid)}</td>
                  <td>{brl(row.committed - row.paid)}</td>
                </tr>
              ))}
              {!annualRows.length && <tr><td colSpan={5}>Não há dados anuais disponíveis.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="dashboard-footer">
        <div className="footer-brand">
          <span className="brand-symbol">PF</span>
          <div>
            <strong>PORTAL DA FISCALIZAÇÃO</strong>
            <small>Informação pública para acompanhamento cidadão.</small>
          </div>
        </div>
        <div className="footer-meta">
          <span>São Francisco · Minas Gerais</span>
          <span>Valores sujeitos à atualização e à integridade das fontes.</span>
        </div>
      </footer>

      <style>{`
        :root {
          --forest: #123c2b;
          --forest-light: #1c5940;
          --green: #247a55;
          --gold: #c5a45a;
          --ink: #1d2b23;
          --muted: #738077;
          --line: #e5ebe5;
          --canvas: #f3f6f2;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: var(--canvas);
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
        }

        .dashboard {
          max-width: 1600px;
          margin: 0 auto;
          padding: 28px clamp(14px, 3vw, 44px) 36px;
        }

        .hero {
          position: relative;
          overflow: hidden;
          padding: 28px 34px 22px;
          border-radius: 18px;
          color: white;
          background:
            radial-gradient(ellipse at 90% 20%, rgba(197,164,90,.18), transparent 35%),
            linear-gradient(125deg, #0c3021, #164832 70%, #20563c);
          box-shadow: 0 14px 34px rgba(18,60,43,.13);
        }

        .hero::after {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 50%;
          right: -95px;
          bottom: -210px;
          box-shadow: 0 0 0 30px rgba(255,255,255,.025), 0 0 0 60px rgba(255,255,255,.02);
          pointer-events: none;
        }

        .hero-topline, .hero-bottom, .brand, .live-label, .hero-content,
        .main-nav, .filter-panel, .filter-intro, .overview-heading,
        .section-heading-row, .featured-creditor, .footer-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .brand {
          justify-content: flex-start;
          text-decoration: none;
          color: white;
        }

        .brand-symbol {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border: 1px solid rgba(220,192,122,.55);
          border-radius: 13px;
          color: #f0d28a;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -1px;
          flex: 0 0 auto;
        }

        .brand strong, .footer-brand strong {
          display: block;
          font-size: 12px;
          letter-spacing: 1.7px;
        }

        .brand small, .footer-brand small {
          display: block;
          margin-top: 6px;
          color: #b9c9bd;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .live-label {
          gap: 8px;
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 30px;
          color: #dce9df;
          font-size: 10px;
          letter-spacing: 1.1px;
          white-space: nowrap;
        }

        .live-label i, .hero-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a4d9a8;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          align-items: flex-end;
          padding: 44px 0 36px;
        }

        .hero-kicker, .eyebrow {
          display: block;
          color: var(--gold);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .hero h1 {
          margin: 15px 0;
          font-size: clamp(34px, 4vw, 54px);
          line-height: 1.08;
          letter-spacing: -1.8px;
          font-weight: 800;
        }

        .hero h1 em {
          color: #e4c77f;
          font-style: normal;
        }

        .hero-content p {
          max-width: 620px;
          margin: 0;
          color: #c8d7cc;
          font-size: 14px;
          line-height: 1.8;
        }

        .hero-period {
          min-width: 220px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 13px;
          background: rgba(255,255,255,.055);
        }

        .hero-period span, .hero-period small {
          display: block;
          color: #bdcec1;
          font-size: 10px;
        }

        .hero-period strong {
          display: block;
          margin: 12px 0 8px;
          color: #f1d38c;
          font-size: 28px;
        }

        .hero-bottom {
          position: relative;
          z-index: 1;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,.13);
          padding-top: 17px;
          color: #bdcec1;
          font-size: 10px;
          flex-wrap: wrap;
        }

        .hero-dot { margin-right: 7px; }

        .main-nav {
          justify-content: flex-start;
          gap: 5px;
          margin: 18px 0 22px;
          padding: 7px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 12px;
          flex-wrap: wrap;
        }

        .main-nav a {
          padding: 12px 17px;
          border-radius: 8px;
          text-decoration: none;
          color: #68756b;
          font-size: 12px;
          font-weight: 700;
          transition: background .2s, color .2s;
        }

        .main-nav a:hover { background: #f0f4ef; color: var(--forest); }

        .main-nav .nav-active {
          background: var(--forest);
          color: white;
        }

        .nav-active span { margin-left: 7px; color: #e2c477; }

        .filter-panel {
          padding: 20px;
          margin-bottom: 32px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 13px;
          flex-wrap: wrap;
        }

        .filter-intro {
          justify-content: flex-start;
          flex: 1 1 220px;
        }

        .filter-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #edf4ed;
          color: var(--forest);
          font-size: 23px;
        }

        .filter-intro strong { display: block; font-size: 13px; }
        .filter-intro small { display: block; margin-top: 5px; color: var(--muted); font-size: 11px; }

        .filter-panel label {
          display: grid;
          gap: 7px;
          min-width: 160px;
        }

        .filter-panel label > span {
          color: #758077;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .filter-panel select {
          width: 100%;
          min-width: 170px;
          padding: 12px 35px 12px 12px;
          border: 1px solid #dce4dc;
          border-radius: 8px;
          background: #fbfcfa;
          color: #304337;
          font: inherit;
          font-size: 12px;
        }

        .filter-panel button {
          align-self: end;
          border: 0;
          border-radius: 8px;
          padding: 13px 17px;
          background: var(--forest);
          color: white;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .filter-panel button span { margin-left: 8px; color: #e4c77f; }

        .overview-section { margin-bottom: 28px; }

        .overview-heading { margin-bottom: 18px; }

        .overview-heading h2, .section-heading h2 {
          margin: 8px 0 0;
          color: var(--ink);
          font-size: clamp(20px, 2.2vw, 26px);
          letter-spacing: -.5px;
        }

        .period-chip, .count-chip {
          padding: 8px 11px;
          border-radius: 6px;
          background: #e8efe7;
          color: #386247;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .secondary-metrics { margin-top: 14px; }

        .metric-card {
          position: relative;
          min-width: 0;
          padding: 21px;
          overflow: hidden;
          background: white;
          border: 1px solid #e4eae3;
          border-radius: 13px;
          box-shadow: 0 3px 12px rgba(27,49,33,.025);
        }

        .metric-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #247a55;
        }

        .tone-blue::before { background: #6b8ca6; }
        .tone-gold::before { background: var(--gold); }
        .tone-rose::before { background: #b77c78; }

        .metric-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .metric-title { color: #6c796f; font-size: 11px; font-weight: 700; }
        .metric-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex: 0 0 auto;
          border-radius: 9px;
          background: #eaf3ec;
          color: var(--forest);
          font-size: 16px;
          font-weight: 800;
        }

        .tone-blue .metric-icon { background: #edf2f6; color: #55758e; }
        .tone-gold .metric-icon { background: #faf4e6; color: #9b7b32; }
        .tone-rose .metric-icon { background: #f8eeee; color: #a66d69; }

        .metric-value {
          display: block;
          margin: 19px 0 9px;
          color: #1b3827;
          font-size: clamp(19px, 1.9vw, 27px);
          font-weight: 800;
          letter-spacing: -.7px;
          overflow-wrap: anywhere;
        }

        .metric-note { color: #929c93; font-size: 10px; }

        .disclaimer {
          margin: 15px 0 0;
          color: #7c877e;
          font-size: 10px;
          line-height: 1.7;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr);
          align-items: stretch;
          gap: 18px;
          margin-bottom: 20px;
        }

        .panel {
          min-width: 0;
          padding: clamp(17px, 2.2vw, 28px);
          margin-bottom: 20px;
          background: white;
          border: 1px solid #e3e9e2;
          border-radius: 14px;
          box-shadow: 0 4px 18px rgba(27,49,33,.025);
        }

        .analytics-grid > .panel { margin-bottom: 0; }

        .section-heading { margin-bottom: 25px; }
        .section-heading p {
          margin: 9px 0 0;
          color: #7b877e;
          font-size: 12px;
          line-height: 1.7;
        }

        .section-heading-row { align-items: flex-start; margin-bottom: 22px; }
        .section-heading-row .section-heading { margin-bottom: 0; }
        .count-chip { background: #f3f5ef; color: #68776a; }

        .chart-legend {
          display: flex;
          gap: 18px;
          color: #68766c;
          font-size: 10px;
          margin-bottom: 16px;
        }

        .chart-legend span { display: flex; align-items: center; gap: 7px; }
        .legend-dot { display: inline-block; width: 9px; height: 9px; border-radius: 3px; }
        .legend-dot.committed, .column-bar.committed { background: #c5a45a; }
        .legend-dot.paid, .column-bar.paid { background: #247a55; }

        .monthly-chart { min-height: 265px; }
        .chart-bars {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 9px;
          height: 220px;
          align-items: stretch;
          padding: 15px 0 0;
          border-bottom: 1px solid #e8ede7;
          background: repeating-linear-gradient(to bottom, transparent 0, transparent 53px, #edf1ed 54px, transparent 55px);
        }

        .chart-column {
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
        }

        .column-bars {
          width: 100%;
          max-width: 38px;
          height: calc(100% - 24px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
        }

        .column-bar {
          width: 42%;
          min-height: 0;
          border-radius: 4px 4px 0 0;
          transition: height .25s ease;
        }

        .chart-column:hover .column-bar { filter: brightness(.9); }
        .column-label {
          margin-top: 9px;
          color: #849087;
          font-size: 9px;
          white-space: nowrap;
        }

        .chart-scale {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          color: #8a958b;
          font-size: 9px;
        }

        .donut-layout { display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .donut-visual { width: 180px; max-width: 100%; }
        .donut-visual svg { display: block; width: 100%; overflow: visible; }
        .donut-number { font-size: 27px; font-weight: 800; fill: #234832; }
        .donut-caption { font-size: 10px; fill: #859087; }
        .donut-legend { width: 100%; }
        .donut-legend-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 10px;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #edf0ec;
        }

        .donut-name { display: flex; align-items: center; gap: 8px; color: #637067; font-size: 11px; }
        .donut-name i { display: inline-block; width: 9px; height: 9px; flex: 0 0 auto; border-radius: 3px; }
        .donut-legend-row strong { font-size: 11px; white-space: nowrap; }
        .donut-legend-row small { color: #879187; font-size: 10px; }
        .donut-total { display: flex; justify-content: space-between; gap: 10px; padding-top: 15px; color: #637067; font-size: 11px; }
        .donut-total strong { color: var(--forest); font-size: 13px; }

        .donut-empty { display: grid; justify-items: center; gap: 12px; color: #8a958b; font-size: 11px; text-align: center; }
        .donut-ring { width: 130px; height: 130px; border-radius: 50%; }
        .empty-ring { border: 22px solid #edf1ec; }

        .annual-panel { margin-top: 20px; }
        .horizontal-bars { display: flex; flex-direction: column; gap: 18px; }
        .bar-row { min-width: 0; }
        .bar-label-line { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 9px; }
        .bar-label { display: flex; align-items: center; gap: 11px; min-width: 0; color: #526156; font-size: 11px; font-weight: 700; }
        .bar-rank { color: #a2aca3; font-size: 9px; font-weight: 800; }
        .bar-label-line > strong { flex: 0 0 auto; color: #263d2e; font-size: 11px; }
        .bar-track { height: 8px; overflow: hidden; border-radius: 10px; background: #edf1ec; }
        .bar-fill { height: 100%; min-width: 0; border-radius: 10px; }
        .bar-detail { display: block; margin-top: 6px; color: #909a91; font-size: 9px; }
        .annual-footnote { display: flex; justify-content: space-between; gap: 15px; flex-wrap: wrap; margin-top: 25px; padding-top: 15px; border-top: 1px solid #edf0ec; color: #89938a; font-size: 9px; }

        .featured-creditor {
          justify-content: flex-start;
          padding: 17px;
          margin-bottom: 20px;
          border: 1px solid #e9e3d2;
          border-radius: 10px;
          background: linear-gradient(105deg, #fcfaf4, #fff);
        }

        .featured-icon {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          flex: 0 0 auto;
          border-radius: 12px;
          background: #f2e8ca;
          color: #876b28;
          font-size: 14px;
          font-weight: 900;
        }

        .featured-creditor > div:nth-child(2) { display: flex; flex: 1; flex-direction: column; gap: 5px; min-width: 0; }
        .featured-creditor span { color: #9b8248; font-size: 8px; font-weight: 800; letter-spacing: 1px; }
        .featured-creditor strong { overflow-wrap: anywhere; font-size: 13px; }
        .featured-creditor small { color: #899187; font-size: 10px; }
        .featured-creditor > b { color: var(--forest); font-size: 16px; white-space: nowrap; }

        .table-wrap { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
        thead th {
          padding: 14px 12px;
          background: #f5f7f3;
          border-bottom: 1px solid #e7ece6;
          color: #7a867c;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .7px;
          white-space: nowrap;
        }

        tbody td { padding: 15px 12px; border-bottom: 1px solid #edf0ec; color: #68756b; white-space: nowrap; }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:hover { background: #fafbf8; }
        .table-name { color: #263b2d; font-weight: 700; }
        .money-cell { color: #1e6242; font-weight: 800; }
        .rank-number { color: #89968b; font-size: 10px; font-weight: 800; }
        .rank-medal { color: #a17d2c; }
        .year-cell { color: var(--forest); font-weight: 800; font-size: 13px; }
        .category-chip { display: inline-block; padding: 6px 8px; border-radius: 5px; background: #edf4ed; color: #42684b; font-size: 9px; }

        .councilor-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 25px;
        }

        .councilor-card {
          min-width: 0;
          padding: 17px;
          border: 1px solid #e5ebe3;
          border-radius: 12px;
          background: linear-gradient(180deg, #fff, #fcfdfb);
          transition: transform .2s, box-shadow .2s;
        }

        .councilor-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(27,49,33,.07); }
        .councilor-card-top { display: flex; align-items: center; gap: 10px; }
        .councilor-photo { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #e4ebe3; object-fit: cover; flex: 0 0 auto; }
        .photo-placeholder { display: grid; place-items: center; background: #e9f0e8; color: var(--forest); font-size: 19px; font-weight: 800; }
        .party-chip { margin-left: auto; padding: 6px 7px; border-radius: 5px; background: #f0f3ed; color: #647367; font-size: 9px; font-weight: 800; }
        .councilor-card h3 { min-height: 34px; margin: 18px 0 10px; color: #273c2e; font-size: 13px; line-height: 1.4; }
        .councilor-total { color: var(--forest); font-size: clamp(18px, 1.8vw, 24px); font-weight: 800; letter-spacing: -.6px; overflow-wrap: anywhere; }
        .councilor-caption { display: block; margin-top: 5px; color: #89948b; font-size: 9px; }
        .councilor-breakdown { display: grid; gap: 9px; padding: 15px 0; margin-top: 10px; border-bottom: 1px solid #edf0ec; }
        .councilor-breakdown div { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .councilor-breakdown span { color: #7e8a80; font-size: 10px; }
        .councilor-breakdown strong { color: #445b49; font-size: 10px; text-align: right; }
        .councilor-footer { display: flex; justify-content: space-between; gap: 8px; padding-top: 12px; color: #879288; font-size: 9px; }
        .arrow-mark { color: #b29653; font-size: 14px; }

        .empty-state { padding: 20px 0; color: #879187; font-size: 12px; }
        .error-panel { margin: 40px auto; max-width: 900px; padding: 30px; background: white; border: 1px solid #e4e9e2; border-radius: 14px; }
        .error-panel h1 { color: #8b3535; font-size: 25px; }
        .error-panel p { color: #66746a; font-size: 13px; }
        .error-panel code { display: block; margin-top: 15px; padding: 12px; background: #faf2f2; color: #8b3535; overflow-wrap: anywhere; white-space: normal; }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-top: 34px;
          padding: 24px 0 5px;
          border-top: 1px solid #dfe6dd;
        }

        .footer-brand { justify-content: flex-start; }
        .footer-brand .brand-symbol { background: var(--forest); border-color: var(--forest); }
        .footer-brand strong { color: #375342; font-size: 10px; }
        .footer-brand small { color: #849087; font-size: 9px; letter-spacing: 0; }
        .footer-meta { display: grid; gap: 6px; text-align: right; color: #89948b; font-size: 9px; }

        @media (max-width: 1050px) {
          .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .analytics-grid { grid-template-columns: minmax(0, 1fr); }
          .donut-layout { flex-direction: row; align-items: center; }
          .donut-visual { width: 150px; flex: 0 0 150px; }
          .councilor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-content { align-items: flex-start; }
        }

        @media (max-width: 650px) {
          .dashboard { padding: 12px 10px 24px; }
          .hero { padding: 20px 17px 17px; border-radius: 13px; }
          .hero-topline { align-items: flex-start; flex-wrap: wrap; }
          .brand-symbol { width: 40px; height: 40px; }
          .brand strong { font-size: 10px; letter-spacing: 1px; }
          .live-label { font-size: 8px; }
          .hero-content { flex-direction: column; padding: 32px 0 25px; }
          .hero h1 { font-size: 37px; }
          .hero-content p { font-size: 12px; }
          .hero-period { width: 100%; min-width: 0; padding: 15px; }
          .hero-period strong { font-size: 24px; margin: 8px 0; }
          .hero-bottom { font-size: 9px; }
          .main-nav { gap: 2px; padding: 5px; }
          .main-nav a { padding: 10px 9px; font-size: 10px; }
          .filter-panel { align-items: stretch; flex-direction: column; padding: 15px; }
          .filter-intro { flex: auto; }
          .filter-panel label, .filter-panel select, .filter-panel button { width: 100%; }
          .overview-heading { align-items: flex-start; }
          .overview-heading h2, .section-heading h2 { font-size: 20px; }
          .metrics-grid { gap: 9px; }
          .metric-card { padding: 14px 12px; }
          .metric-title { font-size: 10px; }
          .metric-icon { width: 27px; height: 27px; }
          .metric-value { margin: 15px 0 8px; font-size: clamp(16px, 4vw, 22px); }
          .metric-note { font-size: 9px; line-height: 1.4; }
          .panel { padding: 16px 12px; border-radius: 11px; }
          .donut-layout { flex-direction: column; }
          .donut-visual { width: 150px; flex: auto; }
          .chart-bars { gap: 3px; height: 180px; }
          .column-label { font-size: 8px; }
          .column-bars { gap: 2px; }
          .chart-scale { font-size: 8px; }
          .featured-creditor { align-items: flex-start; flex-wrap: wrap; padding: 13px; }
          .featured-creditor > b { margin-left: 55px; font-size: 14px; }
          .councilor-grid { grid-template-columns: minmax(0, 1fr); }
          .councilor-card h3 { min-height: auto; }
          .section-heading-row { gap: 10px; }
          .section-heading-row .count-chip { font-size: 8px; }
          .dashboard-footer { align-items: flex-start; flex-direction: column; }
          .footer-meta { text-align: left; }
          table { font-size: 10px; }
          thead th, tbody td { padding: 12px 10px; }
        }
      `}</style>
    </main>
  );
}
