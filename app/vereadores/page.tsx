import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Vereador = {
  id: string;
  sapl_id: string | null;
  nome: string | null;
  nome_parlamentar: string | null;
  partido: string | null;
  legislatura: string | null;
  foto_url: string | null;
};

export default async function VereadoresPage() {
  const { data: vereadores, error } = await supabase
    .from("vereadores")
    .select(
      "id, sapl_id, nome, nome_parlamentar, partido, legislatura, foto_url"
    )
    .eq("em_exercicio", true)
    .order("nome_parlamentar", { ascending: true });

  return (
    <main className="records-page vereadores-page">
      {/* Cabeçalho padronizado */}
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

      {/* Conteúdo */}
      <div className="records-content vereadores-content">
        {/* Título */}
        <section className="vereadores-heading">
          <div className="vereadores-heading-decoration" />

          <div className="vereadores-heading-content">
            <p className="section-eyebrow">
              <span />
              TRANSPARÊNCIA PÚBLICA
            </p>

            <h1>Vereadores</h1>

            <p className="vereadores-intro">
              Conheça os parlamentares de São Francisco, consulte seus
              perfis e acompanhe matérias legislativas, diárias e despesas
              públicas.
            </p>

            <div className="vereadores-heading-badges">
              <span>
                <span className="status-dot" />
                Câmara Municipal
              </span>
              <span>Legislatura 2025–2028</span>
            </div>
          </div>
        </section>

        {/* Identificação da seção */}
        <section className="vereadores-section-heading">
          <div>
            <p className="section-label">PODER LEGISLATIVO</p>
            <h2>Composição atual</h2>
            <p className="section-description">
              Consulte os dados e acesse o perfil de cada parlamentar.
            </p>
          </div>

          {!error && vereadores && (
            <div className="vereadores-count">
              <div className="vereadores-count-icon">♙</div>
              <div>
                <strong>{vereadores.length}</strong>
                <span>Parlamentares</span>
              </div>
            </div>
          )}
        </section>

        {/* Erro de consulta */}
        {error ? (
          <section className="vereadores-message vereadores-error">
            <h2>Não foi possível carregar os vereadores.</h2>
            <p>{error.message}</p>
            <Link href="/">Voltar ao início</Link>
          </section>
        ) : !vereadores || vereadores.length === 0 ? (
          <section className="vereadores-message vereadores-empty">
            <div className="empty-icon">♙</div>
            <h2>Nenhum parlamentar encontrado</h2>
            <p>
              Verifique se os vereadores da composição atual estão
              cadastrados e marcados corretamente no sistema.
            </p>
          </section>
        ) : (
          <section className="vereadores-grid" aria-label="Lista de vereadores">
            {vereadores.map((vereador: Vereador) => {
              const nome =
                vereador.nome_parlamentar ||
                vereador.nome ||
                "Nome não informado";

              return (
                <article className="vereador-card" key={vereador.id}>
                  <div className="vereador-card-accent" />

                  <div className="vereador-card-content">
                    <div className="vereador-person">
                      {vereador.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vereador.foto_url}
                          alt={`Foto de ${nome}`}
                          className="vereador-photo"
                        />
                      ) : (
                        <div className="vereador-photo-placeholder">
                          ♙
                        </div>
                      )}

                      <div className="vereador-person-info">
                        <span className="vereador-badge">
                          Parlamentar
                        </span>

                        <h3>{nome}</h3>

                        <p>
                          {vereador.partido || "Partido não informado"}
                        </p>
                      </div>
                    </div>

                    {vereador.legislatura && (
                      <div className="vereador-legislatura">
                        <span>Legislatura</span>
                        <strong>{vereador.legislatura}</strong>
                      </div>
                    )}

                    <Link
                      href={`/vereadores/${vereador.id}`}
                      className="vereador-profile-link"
                    >
                      Consultar perfil
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Fonte oficial */}
        <section className="vereadores-source">
          <div className="source-icon">✓</div>

          <div className="source-info">
            <h2>Fonte de referência</h2>
            <p>
              Câmara Municipal de São Francisco, Minas Gerais.
            </p>
          </div>

          <a
            href="https://www.saofrancisco.mg.leg.br/processo-legislativo/parlamentares"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            Acessar site oficial ↗
          </a>
        </section>

        {/* Rodapé */}
        <footer className="records-footer">
          <Link href="/">← Voltar à página inicial</Link>
          <span>Portal da Fiscalização · São Francisco — MG</span>
        </footer>
      </div>

      <style>{`
        .vereadores-page {
          min-height: 100vh;
          background: #f5f7f2;
          color: #173b2b;
        }

        /* Cabeçalho igual ao padrão da página de Diárias */
        .vereadores-page .records-top {
          background: #123c2b;
          color: #fff;
          border-bottom: 3px solid #c6a45b;
        }

        .vereadores-page .records-top-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .vereadores-page .records-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
        }

        .vereadores-page .brand-mark {
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

        .vereadores-page .records-brand strong,
        .vereadores-page .records-brand small {
          display: block;
        }

        .vereadores-page .records-brand strong {
          color: #fff;
          font-size: 1rem;
        }

        .vereadores-page .records-brand small {
          margin-top: 4px;
          color: #d5e1d6;
          font-size: 0.76rem;
        }

        .vereadores-page .records-nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .vereadores-page .records-nav a {
          padding: 9px 12px;
          color: #e2eae2;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }

        .vereadores-page .records-nav a:hover,
        .vereadores-page .records-nav a[aria-current="page"] {
          color: #fff;
          background: #28563b;
        }

        /* Conteúdo principal */
        .vereadores-page .vereadores-content {
          padding-top: 32px;
          padding-bottom: 42px;
        }

        /* Banner de apresentação */
        .vereadores-page .vereadores-heading {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          margin-bottom: 32px;
          padding: 36px;
          color: #fff;
          background: linear-gradient(
            125deg,
            #123c2b 0%,
            #1c4934 58%,
            #246744 100%
          );
          border-radius: 16px;
          box-shadow: 0 8px 24px rgb(18 60 43 / 9%);
        }

        .vereadores-page .vereadores-heading-decoration {
          position: absolute;
          z-index: -1;
          top: -90px;
          right: -40px;
          width: 270px;
          height: 270px;
          border: 1px solid rgb(255 255 255 / 10%);
          border-radius: 50%;
        }

        .vereadores-page .vereadores-heading-decoration::after {
          position: absolute;
          top: 35px;
          right: 30px;
          width: 185px;
          height: 185px;
          border: 1px solid rgb(198 164 91 / 30%);
          border-radius: 50%;
          content: "";
        }

        .vereadores-page .vereadores-heading-content {
          position: relative;
        }

        .vereadores-page .section-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #d4b56b;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .vereadores-page .section-eyebrow > span {
          width: 28px;
          height: 2px;
          background: #d4b56b;
        }

        .vereadores-page .vereadores-heading h1 {
          margin: 12px 0;
          color: #fff;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.15;
        }

        .vereadores-page .vereadores-intro {
          max-width: 700px;
          color: rgb(255 255 255 / 78%);
          font-size: 0.98rem;
          line-height: 1.8;
        }

        .vereadores-page .vereadores-heading-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .vereadores-page .vereadores-heading-badges > span {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          color: #fff;
          background: rgb(255 255 255 / 8%);
          border: 1px solid rgb(255 255 255 / 15%);
          border-radius: 7px;
          font-size: 0.83rem;
        }

        .vereadores-page .vereadores-heading-badges > span:last-child {
          color: rgb(255 255 255 / 85%);
        }

        .vereadores-page .status-dot {
          width: 8px;
          height: 8px;
          background: #d4b56b;
          border-radius: 50%;
        }

        /* Título da listagem */
        .vereadores-page .vereadores-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 22px;
        }

        .vereadores-page .section-label {
          color: #286744;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        .vereadores-page .vereadores-section-heading h2 {
          margin-top: 5px;
          color: #123c2b;
          font-size: 1.4rem;
          font-weight: 800;
        }

        .vereadores-page .section-description {
          margin-top: 6px;
          color: #6c7973;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .vereadores-page .vereadores-count {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fff;
          border: 1px solid #dce9df;
          border-radius: 11px;
          box-shadow: 0 4px 14px rgb(18 60 43 / 4%);
        }

        .vereadores-page .vereadores-count-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          color: #286744;
          background: #e8f4ed;
          border-radius: 8px;
          font-size: 1.4rem;
        }

        .vereadores-page .vereadores-count strong,
        .vereadores-page .vereadores-count span {
          display: block;
        }

        .vereadores-page .vereadores-count strong {
          color: #123c2b;
          font-size: 1.35rem;
          line-height: 1.2;
        }

        .vereadores-page .vereadores-count span {
          margin-top: 4px;
          color: #6c7973;
          font-size: 0.76rem;
        }

        /* Grade de vereadores */
        .vereadores-page .vereadores-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .vereadores-page .vereador-card {
          min-width: 0;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e0e7df;
          border-radius: 14px;
          box-shadow: 0 4px 14px rgb(18 60 43 / 4%);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .vereadores-page .vereador-card:hover {
          transform: translateY(-3px);
          border-color: #b9d7c5;
          box-shadow: 0 12px 26px rgb(18 60 43 / 9%);
        }

        .vereadores-page .vereador-card-accent {
          height: 4px;
          background: linear-gradient(
            90deg,
            #176b4a,
            #348461 58%,
            #d4b56b
          );
        }

        .vereadores-page .vereador-card-content {
          padding: 22px;
        }

        .vereadores-page .vereador-person {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .vereadores-page .vereador-photo,
        .vereadores-page .vereador-photo-placeholder {
          display: grid;
          place-items: center;
          width: 82px;
          height: 82px;
          flex-shrink: 0;
          color: #286744;
          background: #e8f4ed;
          border: 1px solid #e0e7df;
          border-radius: 13px;
          object-fit: cover;
        }

        .vereadores-page .vereador-photo-placeholder {
          font-size: 2rem;
        }

        .vereadores-page .vereador-person-info {
          min-width: 0;
        }

        .vereadores-page .vereador-badge {
          display: inline-block;
          padding: 5px 8px;
          color: #286744;
          background: #e8f4ed;
          border-radius: 5px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .vereadores-page .vereador-person-info h3 {
          margin-top: 9px;
          color: #123c2b;
          font-size: 1.05rem;
          font-weight: 800;
          line-height: 1.4;
          overflow-wrap: anywhere;
          transition: color 0.2s;
        }

        .vereadores-page .vereador-card:hover .vereador-person-info h3 {
          color: #286744;
        }

        .vereadores-page .vereador-person-info p {
          margin-top: 4px;
          color: #6c7973;
          font-size: 0.86rem;
        }

        .vereadores-page .vereador-legislatura {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eef1ee;
        }

        .vereadores-page .vereador-legislatura span {
          color: #6c7973;
          font-size: 0.8rem;
        }

        .vereadores-page .vereador-legislatura strong {
          color: #234b36;
          font-size: 0.8rem;
        }

        .vereadores-page .vereador-profile-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: 20px;
          padding: 12px 16px;
          color: #fff;
          background: #1c5939;
          border: 1px solid #1c5939;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s;
        }

        .vereadores-page .vereador-profile-link:hover {
          background: #123c2b;
        }

        .vereadores-page .vereador-profile-link span {
          font-size: 1.1rem;
          transition: transform 0.2s;
        }

        .vereadores-page .vereador-profile-link:hover span {
          transform: translateX(3px);
        }

        /* Estados de erro e lista vazia */
        .vereadores-page .vereadores-message {
          padding: 32px;
          background: #fff;
          border: 1px solid #e0e7df;
          border-radius: 13px;
          box-shadow: 0 4px 14px rgb(18 60 43 / 4%);
        }

        .vereadores-page .vereadores-error {
          border-color: #f0caca;
        }

        .vereadores-page .vereadores-error h2 {
          color: #9b2525;
          font-weight: 800;
        }

        .vereadores-page .vereadores-error p {
          margin-top: 10px;
          color: #a33434;
          overflow-wrap: anywhere;
        }

        .vereadores-page .vereadores-error a {
          display: inline-block;
          margin-top: 16px;
          color: #286744;
          font-weight: 700;
        }

        .vereadores-page .vereadores-empty {
          text-align: center;
        }

        .vereadores-page .empty-icon {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          margin: 0 auto;
          color: #286744;
          background: #e8f4ed;
          border-radius: 13px;
          font-size: 1.8rem;
        }

        .vereadores-page .vereadores-empty h2 {
          margin-top: 16px;
          color: #123c2b;
          font-weight: 800;
        }

        .vereadores-page .vereadores-empty p {
          max-width: 460px;
          margin: 9px auto 0;
          color: #6c7973;
          font-size: 0.9rem;
          line-height: 1.7;
        }

        /* Fonte oficial */
        .vereadores-page .vereadores-source {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 32px;
          padding: 22px;
          background: #fff;
          border: 1px solid #e0e7df;
          border-radius: 13px;
        }

        .vereadores-page .source-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          color: #286744;
          background: #e8f4ed;
          border-radius: 10px;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .vereadores-page .source-info {
          flex: 1 1 200px;
        }

        .vereadores-page .source-info h2 {
          color: #123c2b;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .vereadores-page .source-info p {
          margin-top: 5px;
          color: #6c7973;
          font-size: 0.84rem;
          line-height: 1.5;
        }

        .vereadores-page .source-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          color: #286744;
          background: #fff;
          border: 1px solid #dce9df;
          border-radius: 7px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s;
        }

        .vereadores-page .source-link:hover {
          background: #e8f4ed;
        }

        /* Rodapé no mesmo padrão das demais páginas */
        .vereadores-page .records-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
          padding-top: 22px;
          border-top: 1px solid #dce5da;
        }

        .vereadores-page .records-footer a {
          color: #1c5939;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
        }

        .vereadores-page .records-footer a:hover {
          text-decoration: underline;
        }

        .vereadores-page .records-footer span {
          color: #748075;
          font-size: 0.82rem;
        }

        @media (max-width: 1000px) {
          .vereadores-page .vereadores-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .vereadores-page .records-top-inner {
            align-items: flex-start;
          }

          .vereadores-page .records-nav {
            width: 100%;
          }

          .vereadores-page .records-nav a {
            padding: 8px 9px;
          }

          .vereadores-page .vereadores-content {
            padding-top: 22px;
          }

          .vereadores-page .vereadores-heading {
            padding: 25px 22px;
          }

          .vereadores-page .vereadores-section-heading {
            align-items: flex-start;
          }

          .vereadores-page .vereadores-grid {
            grid-template-columns: 1fr;
          }

          .vereadores-page .vereador-card-content {
            padding: 20px;
          }

          .vereadores-page .vereadores-source {
            align-items: flex-start;
          }

          .vereadores-page .source-link {
            width: 100%;
          }

          .vereadores-page .records-footer {
            align-items: flex-start;
          }
        }

        @media (max-width: 380px) {
          .vereadores-page .vereador-person {
            align-items: flex-start;
            gap: 11px;
          }

          .vereadores-page .vereador-photo,
          .vereadores-page .vereador-photo-placeholder {
            width: 68px;
            height: 68px;
          }

          .vereadores-page .vereador-person-info h3 {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </main>
  );
}