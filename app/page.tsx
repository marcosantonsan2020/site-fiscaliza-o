
import Link from "next/link";

const secoes = [
  {
    titulo: "Diárias e viagens",
    descricao:
      "Consulte beneficiários, destinos, períodos, justificativas e valores pagos em viagens custeadas com recursos públicos.",
    href: "/diarias",
    icon: "⌁",
    categoria: "GASTOS PÚBLICOS",
  },
  {
    titulo: "Despesas públicas",
    descricao:
      "Acompanhe despesas, pagamentos e informações financeiras disponíveis nos registros públicos.",
    href: "/despesas",
    icon: "R$",
    categoria: "CONTROLE DE GASTOS",
  },
  {
    titulo: "Vereadores",
    descricao:
      "Consulte os representantes municipais e acompanhe informações públicas sobre seus mandatos.",
    href: "/vereadores",
    icon: "◎",
    categoria: "ACOMPANHAMENTO",
  },
  {
    titulo: "Matérias legislativas",
    descricao:
      "Pesquise projetos, propostas e documentos relacionados à atividade legislativa municipal.",
    href: "/materias",
    icon: "▤",
    categoria: "DOCUMENTOS PÚBLICOS",
  },
];

const linksNavegacao = [
  { label: "Início", href: "/" },
  { label: "Diárias", href: "/diarias" },
  { label: "Despesas", href: "/despesas" },
  { label: "Vereadores", href: "/vereadores" },
  { label: "Matérias", href: "/materias" },
  { label: "Rankings", href: "/rankings" },
];

const consultas = [
  {
    nome: "Despesas e pagamentos",
    detalhe: "Valores e registros financeiros",
    href: "/despesas",
  },
  {
    nome: "Diárias e deslocamentos",
    detalhe: "Beneficiários e finalidade das viagens",
    href: "/diarias",
  },
  {
    nome: "Mandatos e representantes",
    detalhe: "Consulta de vereadores",
    href: "/vereadores",
  },
  {
    nome: "Projetos e documentos",
    detalhe: "Pesquisa de matérias públicas",
    href: "/materias",
  },
  {
    nome: "Rankings e comparativos",
    detalhe: "Compare despesas, credores e atividade legislativa",
    href: "/rankings",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#172536]">
      {/* Cabeçalho */}
      <header className="border-b border-white/10 bg-[#101d2c] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9a23b] text-[#101d2c]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5M7.5 10.5l2 2 4-4" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-wide sm:text-base">
                PORTAL DA FISCALIZAÇÃO
              </p>
              <p className="mt-0.5 text-xs text-[#b9c5d2]">
                São Francisco · Minas Gerais
              </p>
            </div>
          </Link>

          <span className="hidden items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-[#d5dee8] sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[#e9a23b]" />
            Transparência e controle social
          </span>
        </div>
      </header>

      {/* Navegação */}
      <nav className="border-b border-[#dfe5eb] bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {linksNavegacao.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition " +
                (item.href === "/"
                  ? "border-[#e9a23b] text-[#172536]"
                  : "border-transparent text-[#647386] hover:border-[#e9a23b] hover:text-[#172536]")
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Apresentação principal */}
      <section className="bg-[#101d2c] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#e9a23b]">
              <span className="h-px w-8 bg-[#e9a23b]" />
              Informação pública, interesse coletivo
            </p>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Fiscalizar é acompanhar onde o dinheiro público é aplicado.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#c3ceda] sm:text-lg">
              Um portal independente para consultar informações públicas de
              São Francisco, acompanhar gastos, pesquisar documentos e ampliar
              o acesso do cidadão aos dados disponíveis.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/diarias"
                className="inline-flex items-center gap-2 rounded-lg bg-[#e9a23b] px-5 py-3.5 text-sm font-bold text-[#101d2c] transition hover:bg-[#f5b957]"
              >
                Consultar gastos
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/rankings"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-[#e9a23b] hover:text-[#e9a23b]"
              >
                Ver rankings
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Central de consultas */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-bold">Central de consultas</p>
                <p className="mt-1 text-xs text-[#9eacbb]">
                  Acesso às informações públicas
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9a23b]/15 text-[#e9a23b]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M4 19V5m0 14h17M8 15l3-4 3 2 5-7" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {consultas.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-[#e9a23b]/50 hover:bg-white/[0.07]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-sm font-bold text-[#e9a23b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {item.nome}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#aebbc9]">
                      {item.detalhe}
                    </span>
                  </span>

                  <span className="text-[#e9a23b] transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-[#91a0b0]">
              As informações devem ser consultadas conforme a fonte e a
              disponibilidade dos registros publicados.
            </p>
          </div>
        </div>
      </section>

      {/* Áreas de fiscalização e rankings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a96c15]">
              Ferramentas de consulta
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172536] sm:text-3xl">
              Acompanhe os dados públicos
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657487] sm:text-base">
              Escolha uma área para consultar registros, analisar informações
              e acompanhar a utilização dos recursos públicos.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {secoes.map((secao) => (
            <article
              key={secao.href}
              className="group rounded-2xl border border-[#dfe5eb] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#e9a23b] hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#101d2c] text-lg font-bold text-[#e9a23b]">
                  {secao.icon}
                </div>

                <span className="rounded-md bg-[#f3f5f7] px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-[#657487]">
                  {secao.categoria}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#172536]">
                {secao.titulo}
              </h3>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#657487]">
                {secao.descricao}
              </p>

              <Link
                href={secao.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#172536] transition group-hover:text-[#a96c15]"
              >
                Acessar consulta
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        {/* Rankings na página inicial */}
        <section
          aria-labelledby="rankings-title"
          className="mt-10 overflow-hidden rounded-2xl border border-[#dfe5eb] bg-white shadow-sm"
        >
          <div className="grid gap-6 bg-[#101d2c] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e9a23b]">
                Dados em perspectiva
              </p>

              <h2
                id="rankings-title"
                className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                Rankings e comparativos
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c3ceda] sm:text-base">
                Consulte os rankings calculados a partir dos registros
                disponíveis no portal e compare informações financeiras e
                legislativas.
              </p>
            </div>

            <Link
              href="/rankings"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#e9a23b] px-5 py-3 text-sm font-bold text-[#101d2c] transition hover:bg-[#f5b957]"
            >
              Abrir página de rankings
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid divide-y divide-[#dfe5eb] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Link
              href="/rankings"
              className="group p-6 transition hover:bg-[#f8fafc]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1d9] text-xl font-bold text-[#a96c15]">
                R$
              </span>

              <h3 className="mt-4 font-bold text-[#172536]">
                Ranking de despesas
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#657487]">
                Explore valores registrados, credores e categorias de gastos.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#a96c15]">
                Consultar{" "}
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>

            <Link
              href="/rankings"
              className="group p-6 transition hover:bg-[#f8fafc]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1f8] text-xl font-bold text-[#294c70]">
                ◎
              </span>

              <h3 className="mt-4 font-bold text-[#172536]">
                Ranking de vereadores
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#657487]">
                Consulte os comparativos disponíveis sobre os representantes.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#a96c15]">
                Consultar{" "}
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>

            <Link
              href="/rankings"
              className="group p-6 transition hover:bg-[#f8fafc]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f5ed] text-xl font-bold text-[#287446]">
                ▤
              </span>

              <h3 className="mt-4 font-bold text-[#172536]">
                Ranking de matérias
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#657487]">
                Acesse os comparativos relacionados à atividade legislativa.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#a96c15]">
                Consultar{" "}
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </div>

          <div className="border-t border-[#dfe5eb] px-6 py-4">
            <p className="text-xs leading-5 text-[#657487]">
              Os rankings devem ser interpretados conforme o período, os
              critérios de cálculo e a cobertura dos registros. Uma posição
              no ranking não comprova, por si só, irregularidade.
            </p>
          </div>
        </section>

        {/* Compromisso editorial */}
        <div className="mt-10 grid gap-5 rounded-2xl border border-[#dfe5eb] bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff1d9] text-[#a96c15]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M12 3 20 6v5c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6l8-3Z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#172536]">
              Transparência exige fontes e contexto
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#657487]">
              O portal busca facilitar o acesso a informações de interesse
              público. Os registros devem ser apresentados com indicação de
              origem, período e contexto, distinguindo fatos documentados de
              interpretações. Uma despesa registrada, por si só, não comprova
              irregularidade.
            </p>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-white/10 bg-[#101d2c] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold tracking-wide">
              PORTAL DA FISCALIZAÇÃO
            </p>

            <p className="mt-1 text-xs text-[#aebbc9]">
              São Francisco · Minas Gerais
            </p>
          </div>

          <p className="max-w-lg text-xs leading-5 text-[#aebbc9] sm:text-right">
            Portal independente de consulta e acompanhamento de informações
            públicas. As fontes devem ser identificadas em cada área.
          </p>
        </div>
      </footer>
    </main>
  );
}
