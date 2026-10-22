
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Vereador = {
  id: string;
  sapl_id: string | null;
  nome: string | null;
  nome_parlamentar: string | null;
  partido: string | null;
  legislatura: string | null;
  titular: boolean | null;
  foto_url: string | null;
  biografia: string | null;
  fonte_url: string | null;
};

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

type Diaria = {
  id: string;
  ano: number | null;
  beneficiario: string | null;
  cargo_funcao: string | null;
  data_inicial: string | null;
  data_final: string | null;
  origem: string | null;
  destino: string | null;
  objetivo: string | null;
  valor_pago: number | null;
  total_valor_pago: number | null;
  url_oficial: string | null;
};

function dataBR(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.slice(0, 10).split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function dinheiroBR(valor: number | null) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "Não informado";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Cabecalho() {
  return (
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
          <Link href="/vereadores" aria-current="page">
            Vereadores
          </Link>
          <Link href="/materias">Matérias</Link>
          <Link href="/diarias">Diárias</Link>
          <Link href="/despesas">Despesas</Link>
        </nav>
      </div>
    </header>
  );
}

export default async function VereadorPerfilPage({
  params,
}: PageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("vereadores")
    .select(
      "id, sapl_id, nome, nome_parlamentar, partido, legislatura, titular, foto_url, biografia, fonte_url"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="vereador-perfil-page">
        <Cabecalho />
        <div className="records-content perfil-content">
          <div className="records-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/vereadores">Vereadores</Link>
            <span>/</span>
            <span>Perfil</span>
          </div>

          <section className="perfil-error">
            <h1>Erro ao carregar o perfil</h1>
            <p>{error.message}</p>
            <Link href="/vereadores">Voltar aos vereadores</Link>
          </section>
        </div>
        <Estilos />
      </main>
    );
  }

  if (!data) notFound();

  const vereador = data as Vereador;
  const nome =
    vereador.nome_parlamentar || vereador.nome || "Vereador";

  // Consulta as matérias vinculadas ao vereador.
  const autoresResult = await supabase
    .from("materias_autores")
    .select("materia_id")
    .eq("vereador_id", vereador.id);

  let materias: Materia[] = [];
  let erroMaterias: string | null = null;

  if (autoresResult.error) {
    erroMaterias = autoresResult.error.message;
  } else {
    const ids = [
      ...new Set(
        (autoresResult.data ?? [])
          .map((registro) => registro.materia_id)
          .filter((materiaId): materiaId is string => Boolean(materiaId))
      ),
    ];

    if (ids.length > 0) {
      const materiasResult = await supabase
        .from("materias")
        .select(
          "id, sapl_id, tipo, numero, ano, ementa, data_apresentacao, situacao, url_oficial"
        )
        .in("id", ids)
        .order("data_apresentacao", {
          ascending: false,
          nullsFirst: false,
        });

      if (materiasResult.error) {
        erroMaterias = materiasResult.error.message;
      } else {
        materias = (materiasResult.data ?? []) as Materia[];
      }
    }
  }

  // A tabela de diárias não possui vínculo direto por vereador_id.
  // Por isso, a busca por nome é indicativa e pode incluir homônimos.
  const nomes = [
    ...new Set(
      [vereador.nome, vereador.nome_parlamentar]
        .filter((n): n is string => Boolean(n?.trim()))
        .map((n) => n.trim())
    ),
  ];

  const diariasResultados = await Promise.all(
    nomes.map((nomeBusca) =>
      supabase
        .from("diarias")
        .select(
          "id, ano, beneficiario, cargo_funcao, data_inicial, data_final, origem, destino, objetivo, valor_pago, total_valor_pago, url_oficial"
        )
        .ilike("beneficiario", `%${nomeBusca}%`)
        .limit(200)
    )
  );

  const erroDiarias =
    diariasResultados.find((resultado) => resultado.error)?.error
      ?.message ?? null;

  const diariasMap = new Map<string, Diaria>();

  for (const resultado of diariasResultados) {
    for (const registro of resultado.data ?? []) {
      diariasMap.set(registro.id, registro as Diaria);
    }
  }

  const diarias = [...diariasMap.values()].sort((a, b) =>
    (b.data_inicial ?? "").localeCompare(a.data_inicial ?? "")
  );

  const totalDiarias = diarias.reduce(
    (total, diaria) =>
      total + Number(diaria.total_valor_pago ?? diaria.valor_pago ?? 0),
    0
  );

  const totalTipos = new Set(
    materias.map((materia) => materia.tipo?.trim()).filter(Boolean)
  ).size;

  return (
    <main className="vereador-perfil-page">
      <Cabecalho />

      <div className="records-content perfil-content">
        <div className="records-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/vereadores">Vereadores</Link>
          <span>/</span>
          <span>{nome}</span>
        </div>

        <section className="perfil-hero">
          <div className="perfil-hero-decoration" />
          <div className="perfil-hero-content">
            <p className="section-eyebrow">TRANSPARÊNCIA PÚBLICA</p>
            <h1>{nome}</h1>
            <p>
              Perfil parlamentar, matérias legislativas e registros de
              diárias localizados na base de dados do portal.
            </p>

            <div className="perfil-badges">
              <span>{vereador.partido || "Partido não informado"}</span>
              <span>
                Legislatura: {vereador.legislatura || "Não informada"}
              </span>
              {vereador.titular !== null && (
                <span>{vereador.titular ? "Titular" : "Não titular"}</span>
              )}
            </div>
          </div>
        </section>

        <section className="perfil-identificacao">
          <div className="perfil-foto-area">
            {vereador.foto_url ? (
              <img
                src={vereador.foto_url}
                alt={`Foto de ${nome}`}
                className="perfil-foto"
              />
            ) : (
              <div className="perfil-foto perfil-foto-vazia" aria-label="Foto não disponível">
                ♙
              </div>
            )}
          </div>

          <div className="perfil-dados">
            <p className="section-eyebrow">DADOS PARLAMENTARES</p>
            <h2>Identificação</h2>

            <dl className="perfil-dados-grid">
              <div>
                <dt>Nome parlamentar</dt>
                <dd>{vereador.nome_parlamentar || "Não informado"}</dd>
              </div>
              <div>
                <dt>Nome completo</dt>
                <dd>{vereador.nome || "Não informado"}</dd>
              </div>
              <div>
                <dt>Partido</dt>
                <dd>{vereador.partido || "Não informado"}</dd>
              </div>
              <div>
                <dt>Legislatura</dt>
                <dd>{vereador.legislatura || "Não informada"}</dd>
              </div>
              <div>
                <dt>Código de origem</dt>
                <dd>{vereador.sapl_id || "Não informado"}</dd>
              </div>
            </dl>

            {vereador.fonte_url &&
              /^https?:\/\//i.test(vereador.fonte_url) && (
                <a
                  href={vereador.fonte_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="official-link"
                >
                  Consultar fonte oficial ↗
                </a>
              )}
          </div>
        </section>

        {vereador.biografia && (
          <section className="perfil-section">
            <p className="section-eyebrow">TRAJETÓRIA</p>
            <h2>Biografia</h2>
            <p className="biografia-texto">{vereador.biografia}</p>
          </section>
        )}

        <section className="perfil-indicadores">
          <article className="perfil-indicador">
            <span className="indicador-icone">§</span>
            <p>Matérias encontradas</p>
            <strong>{materias.length.toLocaleString("pt-BR")}</strong>
            <small>{totalTipos} tipo(s) de matéria</small>
          </article>

          <article className="perfil-indicador">
            <span className="indicador-icone">R$</span>
            <p>Registros de diárias</p>
            <strong>{diarias.length.toLocaleString("pt-BR")}</strong>
            <small>Correspondências pelo nome</small>
          </article>

          <article className="perfil-indicador">
            <span className="indicador-icone">↗</span>
            <p>Total localizado em diárias</p>
            <strong>{dinheiroBR(totalDiarias)}</strong>
            <small>Valor dos registros encontrados, não necessariamente o total integral</small>
          </article>
        </section>

        <section className="perfil-section">
          <div className="perfil-section-heading">
            <div>
              <p className="section-eyebrow">ATUAÇÃO PARLAMENTAR</p>
              <h2>Matérias legislativas</h2>
              <p className="section-description">
                Projetos, requerimentos e outras proposições vinculadas ao
                parlamentar na base de dados.
              </p>
            </div>
            <Link href="/materias" className="section-action">
              Todas as matérias →
            </Link>
          </div>

          {erroMaterias ? (
            <p className="status-message status-error">
              Erro ao consultar matérias: {erroMaterias}
            </p>
          ) : materias.length === 0 ? (
            <p className="status-message">
              Nenhuma matéria vinculada a este vereador foi encontrada.
            </p>
          ) : (
            <div className="perfil-registros">
              {materias.map((materia) => (
                <article className="perfil-registro" key={materia.id}>
                  <div className="registro-topo">
                    <span className="registro-tipo">
                      {materia.tipo || "Matéria legislativa"}
                    </span>
                    {materia.situacao && (
                      <span className="registro-situacao">
                        {materia.situacao}
                      </span>
                    )}
                  </div>

                  <h3>
                    {materia.numero
                      ? `Nº ${materia.numero}${materia.ano ? `/${materia.ano}` : ""}`
                      : materia.ano
                        ? `Ano ${materia.ano}`
                        : "Matéria legislativa"}
                  </h3>

                  <p className="registro-ementa">
                    {materia.ementa || "Ementa não informada."}
                  </p>

                  <div className="registro-meta">
                    <span>
                      Apresentação: {dataBR(materia.data_apresentacao)}
                    </span>
                    <span>
                      Código: {materia.sapl_id || "Não informado"}
                    </span>
                  </div>

                  {materia.url_oficial &&
                    /^https?:\/\//i.test(materia.url_oficial) && (
                      <a
                        href={materia.url_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="official-link"
                      >
                        Abrir registro oficial ↗
                      </a>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="perfil-section">
          <div className="perfil-section-heading">
            <div>
              <p className="section-eyebrow">GASTOS PÚBLICOS</p>
              <h2>Diárias relacionadas</h2>
              <p className="section-description">
                Registros encontrados pelo nome do beneficiário.
              </p>
            </div>
            <Link href="/diarias" className="section-action">
              Consultar todas as diárias →
            </Link>
          </div>

          <p className="aviso-dados">
            <strong>Importante:</strong> a tabela de diárias não possui um
            identificador direto do vereador nesta consulta. Os resultados
            são encontrados por nome e podem incluir homônimos ou deixar
            registros de fora.
          </p>

          {erroDiarias ? (
            <p className="status-message status-error">
              Erro ao consultar diárias: {erroDiarias}
            </p>
          ) : diarias.length === 0 ? (
            <p className="status-message">
              Nenhuma diária correspondente ao nome deste vereador foi
              encontrada.
            </p>
          ) : (
            <div className="perfil-registros">
              {diarias.map((diaria) => (
                <article className="perfil-registro" key={diaria.id}>
                  <div className="registro-diaria-cabecalho">
                    <div>
                      <h3>{diaria.destino || "Destino não informado"}</h3>
                      <p className="registro-subtexto">
                        Beneficiário: {diaria.beneficiario || "Não informado"}
                      </p>
                    </div>
                    <strong className="valor-diaria">
                      {dinheiroBR(
                        diaria.total_valor_pago ?? diaria.valor_pago
                      )}
                    </strong>
                  </div>

                  <dl className="diaria-detalhes">
                    <div>
                      <dt>Período inicial</dt>
                      <dd>{dataBR(diaria.data_inicial)}</dd>
                    </div>
                    <div>
                      <dt>Período final</dt>
                      <dd>{dataBR(diaria.data_final)}</dd>
                    </div>
                    <div>
                      <dt>Origem</dt>
                      <dd>{diaria.origem || "Não informada"}</dd>
                    </div>
                    <div>
                      <dt>Cargo ou função</dt>
                      <dd>{diaria.cargo_funcao || "Não informado"}</dd>
                    </div>
                    <div>
                      <dt>Ano</dt>
                      <dd>{diaria.ano ?? "Não informado"}</dd>
                    </div>
                  </dl>

                  {diaria.objetivo && (
                    <div className="diaria-objetivo">
                      <strong>Objetivo</strong>
                      <p>{diaria.objetivo}</p>
                    </div>
                  )}

                  {diaria.url_oficial &&
                    /^https?:\/\//i.test(diaria.url_oficial) && (
                      <a
                        href={diaria.url_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="official-link"
                      >
                        Consultar registro oficial ↗
                      </a>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="perfil-section ranking-aviso">
          <p className="section-eyebrow">ACOMPANHAMENTO DE GASTOS</p>
          <h2>Despesas e comparação entre vereadores</h2>
          <p>
            Para apresentar um ranking confiável de gastos por parlamentar,
            é necessário que os registros de despesas/empenhos estejam
            associados ao vereador correto, com valor, data e identificação
            do beneficiário. Esses dados não são consultados nesta página
            porque a estrutura da tabela de despesas ainda não foi
            especificada aqui.
          </p>
          <Link href="/despesas" className="section-action">
            Consultar despesas cadastradas →
          </Link>
        </section>

        <div className="perfil-voltar">
          <Link href="/vereadores">← Voltar à lista de vereadores</Link>
        </div>

        <footer className="records-footer">
          <Link href="/">Portal da Fiscalização</Link>
          <span>São Francisco — MG</span>
        </footer>
      </div>

      <Estilos />
    </main>
  );
}

function Estilos() {
  return (
    <style>{`
      .vereador-perfil-page {
        min-height: 100vh;
        background: #f5f7f5;
        color: #24332b;
      }

      .vereador-perfil-page .records-content {
        width: min(1120px, calc(100% - 40px));
        margin-inline: auto;
      }

      .vereador-perfil-page .records-top {
        background: #123c2b;
        color: #fff;
        border-bottom: 3px solid #c6a45b;
      }

      .vereador-perfil-page .records-top-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;
        padding-top: 16px;
        padding-bottom: 16px;
      }

      .vereador-perfil-page .records-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        text-decoration: none;
      }

      .vereador-perfil-page .brand-mark {
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

      .vereador-perfil-page .records-brand strong,
      .vereador-perfil-page .records-brand small {
        display: block;
      }

      .vereador-perfil-page .records-brand strong {
        color: #fff;
        font-size: 1rem;
      }

      .vereador-perfil-page .records-brand small {
        margin-top: 4px;
        color: #d5e1d6;
        font-size: 0.76rem;
      }

      .vereador-perfil-page .records-nav {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .vereador-perfil-page .records-nav a {
        padding: 9px 12px;
        color: #e2eae2;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .vereador-perfil-page .records-nav a:hover,
      .vereador-perfil-page .records-nav a[aria-current="page"] {
        color: #fff;
        background: #28563b;
      }

      .vereador-perfil-page .perfil-content {
        padding-top: 24px;
        padding-bottom: 36px;
      }

      .vereador-perfil-page .records-breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-bottom: 22px;
        color: #78857c;
        font-size: 0.84rem;
      }

      .vereador-perfil-page .records-breadcrumb a {
        color: #286444;
        text-decoration: none;
      }

      .vereador-perfil-page .records-breadcrumb a:hover,
      .vereador-perfil-page .official-link:hover,
      .vereador-perfil-page .section-action:hover {
        text-decoration: underline;
      }

      .vereador-perfil-page .perfil-hero {
        position: relative;
        overflow: hidden;
        padding: 34px;
        border-radius: 18px;
        background: linear-gradient(125deg, #123c2b, #1e5038 70%, #286444);
        color: #fff;
      }

      .vereador-perfil-page .perfil-hero-decoration {
        position: absolute;
        top: -95px;
        right: -35px;
        width: 270px;
        height: 270px;
        border: 1px solid #ffffff20;
        border-radius: 50%;
        pointer-events: none;
      }

      .vereador-perfil-page .perfil-hero-content {
        position: relative;
      }

      .vereador-perfil-page .section-eyebrow {
        margin: 0 0 8px;
        color: #987a38;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .vereador-perfil-page .perfil-hero .section-eyebrow {
        color: #d4b56b;
      }

      .vereador-perfil-page .perfil-hero h1 {
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 2.6rem);
        font-weight: 800;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }

      .vereador-perfil-page .perfil-hero-content > p:not(.section-eyebrow) {
        max-width: 700px;
        margin-top: 14px;
        color: #e0e9e1;
        line-height: 1.7;
      }

      .vereador-perfil-page .perfil-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin-top: 22px;
      }

      .vereador-perfil-page .perfil-badges span {
        padding: 8px 11px;
        border: 1px solid #ffffff26;
        border-radius: 7px;
        background: #ffffff12;
        font-size: 0.82rem;
      }

      .vereador-perfil-page .perfil-identificacao {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 28px;
        margin-top: 22px;
        padding: 26px;
        border: 1px solid #e1e8e2;
        border-radius: 16px;
        background: #fff;
      }

      .vereador-perfil-page .perfil-foto-area {
        width: 100%;
      }

      .vereador-perfil-page .perfil-foto {
        display: flex;
        width: 100%;
        max-width: 220px;
        aspect-ratio: 1;
        align-items: center;
        justify-content: center;
        margin-inline: auto;
        border: 1px solid #e1e8e2;
        border-radius: 14px;
        background: #eef4ef;
        object-fit: cover;
      }

      .vereador-perfil-page .perfil-foto-vazia {
        color: #286444;
        font-size: 4rem;
      }

      .vereador-perfil-page .perfil-dados h2,
      .vereador-perfil-page .perfil-section h2 {
        margin: 0;
        color: #123c2b;
        font-size: 1.45rem;
        font-weight: 800;
      }

      .vereador-perfil-page .perfil-dados-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 24px;
        margin-top: 14px;
      }

      .vereador-perfil-page .perfil-dados-grid div {
        padding: 13px 0;
        border-bottom: 1px solid #edf1ed;
      }

      .vereador-perfil-page dt {
        color: #758178;
        font-size: 0.78rem;
      }

      .vereador-perfil-page dd {
        margin-top: 5px;
        color: #26372c;
        font-size: 0.9rem;
        font-weight: 650;
        overflow-wrap: anywhere;
      }

      .vereador-perfil-page .official-link {
        display: inline-flex;
        margin-top: 15px;
        color: #236441;
        font-size: 0.88rem;
        font-weight: 750;
        text-decoration: none;
      }

      .vereador-perfil-page .perfil-section {
        margin-top: 24px;
        padding: 26px;
        border: 1px solid #e1e8e2;
        border-radius: 16px;
        background: #fff;
      }

      .vereador-perfil-page .biografia-texto {
        margin-top: 12px;
        color: #536157;
        line-height: 1.8;
        white-space: pre-line;
      }

      .vereador-perfil-page .perfil-indicadores {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      .vereador-perfil-page .perfil-indicador {
        min-width: 0;
        padding: 21px;
        border: 1px solid #e1e8e2;
        border-radius: 14px;
        background: #fff;
      }

      .vereador-perfil-page .indicador-icone {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        margin-bottom: 13px;
        border-radius: 9px;
        background: #e8f1e9;
        color: #236441;
        font-size: 1rem;
        font-weight: 800;
      }

      .vereador-perfil-page .perfil-indicador p {
        color: #6b796e;
        font-size: 0.85rem;
      }

      .vereador-perfil-page .perfil-indicador strong {
        display: block;
        margin-top: 8px;
        color: #123c2b;
        font-size: clamp(1.3rem, 2.5vw, 1.8rem);
        font-weight: 850;
        overflow-wrap: anywhere;
      }

      .vereador-perfil-page .perfil-indicador small {
        display: block;
        margin-top: 8px;
        color: #7b867e;
        font-size: 0.75rem;
        line-height: 1.5;
      }

      .vereador-perfil-page .perfil-section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 18px;
      }

      .vereador-perfil-page .section-description {
        margin-top: 7px;
        color: #738076;
        font-size: 0.88rem;
        line-height: 1.6;
      }

      .vereador-perfil-page .section-action {
        color: #236441;
        font-size: 0.86rem;
        font-weight: 750;
        text-decoration: none;
      }

      .vereador-perfil-page .perfil-registros {
        display: grid;
        gap: 13px;
      }

      .vereador-perfil-page .perfil-registro {
        padding: 19px;
        border: 1px solid #e5ebe5;
        border-radius: 12px;
        background: #fff;
      }

      .vereador-perfil-page .registro-topo {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .vereador-perfil-page .registro-tipo {
        padding: 5px 8px;
        border-radius: 5px;
        background: #e8f1e9;
        color: #236441;
        font-size: 0.72rem;
        font-weight: 800;
      }

      .vereador-perfil-page .registro-situacao {
        padding: 5px 8px;
        border-radius: 5px;
        background: #f0f2ef;
        color: #626f65;
        font-size: 0.72rem;
      }

      .vereador-perfil-page .perfil-registro h3 {
        margin-top: 11px;
        color: #1e3829;
        font-size: 1rem;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .vereador-perfil-page .registro-ementa {
        margin-top: 8px;
        color: #56645a;
        font-size: 0.9rem;
        line-height: 1.7;
        white-space: pre-line;
      }

      .vereador-perfil-page .registro-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 20px;
        margin-top: 13px;
        color: #7a867c;
        font-size: 0.77rem;
      }

      .vereador-perfil-page .registro-diaria-cabecalho {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }

      .vereador-perfil-page .registro-diaria-cabecalho h3 {
        margin-top: 0;
      }

      .vereador-perfil-page .registro-subtexto {
        margin-top: 5px;
        color: #758178;
        font-size: 0.82rem;
      }

      .vereador-perfil-page .valor-diaria {
        color: #1c6541;
        font-size: 1.05rem;
        font-weight: 850;
      }

      .vereador-perfil-page .diaria-detalhes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid #edf1ed;
      }

      .vereador-perfil-page .diaria-objetivo {
        margin-top: 16px;
        color: #56645a;
        font-size: 0.88rem;
        line-height: 1.7;
      }

      .vereador-perfil-page .diaria-objetivo strong {
        color: #34483a;
      }

      .vereador-perfil-page .diaria-objetivo p {
        margin-top: 5px;
        white-space: pre-line;
      }

      .vereador-perfil-page .aviso-dados {
        margin: 0 0 18px;
        padding: 13px 15px;
        border-left: 3px solid #c6a45b;
        border-radius: 5px;
        background: #faf7ee;
        color: #645b45;
        font-size: 0.83rem;
        line-height: 1.7;
      }

      .vereador-perfil-page .ranking-aviso > p:not(.section-eyebrow) {
        margin-top: 12px;
        color: #667368;
        font-size: 0.9rem;
        line-height: 1.8;
      }

      .vereador-perfil-page .status-message {
        padding: 18px;
        border-radius: 9px;
        background: #f4f6f3;
        color: #69766c;
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .vereador-perfil-page .status-error {
        background: #fff0ef;
        color: #9b2929;
      }

      .vereador-perfil-page .perfil-voltar {
        margin-top: 25px;
      }

      .vereador-perfil-page .perfil-voltar a {
        display: inline-flex;
        padding: 11px 15px;
        border-radius: 8px;
        background: #123c2b;
        color: #fff;
        font-size: 0.86rem;
        font-weight: 700;
        text-decoration: none;
      }

      .vereador-perfil-page .records-footer {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
        padding: 22px 0;
        border-top: 1px solid #dfe6df;
        color: #7a867c;
        font-size: 0.8rem;
      }

      .vereador-perfil-page .records-footer a {
        color: #236441;
        font-weight: 750;
        text-decoration: none;
      }

      .vereador-perfil-page .perfil-error {
        padding: 25px;
        border: 1px solid #f1caca;
        border-radius: 14px;
        background: #fff;
      }

      .vereador-perfil-page .perfil-error h1 {
        color: #982e2e;
        font-size: 1.3rem;
        font-weight: 800;
      }

      .vereador-perfil-page .perfil-error p {
        margin-top: 10px;
        color: #9a4141;
      }

      .vereador-perfil-page .perfil-error a {
        display: inline-block;
        margin-top: 15px;
        color: #236441;
        font-weight: 700;
      }

      @media (max-width: 760px) {
        .vereador-perfil-page .records-content {
          width: min(100% - 28px, 1120px);
        }

        .vereador-perfil-page .records-top-inner {
          align-items: flex-start;
        }

        .vereador-perfil-page .records-nav {
          width: 100%;
          gap: 4px;
        }

        .vereador-perfil-page .records-nav a {
          padding: 8px 9px;
          font-size: 0.82rem;
        }

        .vereador-perfil-page .perfil-hero {
          padding: 25px 21px;
        }

        .vereador-perfil-page .perfil-identificacao {
          grid-template-columns: 1fr;
          padding: 20px;
        }

        .vereador-perfil-page .perfil-foto {
          max-width: 180px;
        }

        .vereador-perfil-page .perfil-indicadores {
          grid-template-columns: 1fr;
        }

        .vereador-perfil-page .perfil-section {
          padding: 20px;
        }

        .vereador-perfil-page .perfil-dados-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 420px) {
        .vereador-perfil-page .diaria-detalhes {
          grid-template-columns: 1fr;
        }

        .vereador-perfil-page .perfil-registro {
          padding: 15px;
        }
      }
    `}</style>
  );
}
