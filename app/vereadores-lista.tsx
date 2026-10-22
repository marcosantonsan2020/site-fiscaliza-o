
"use client";

import { useMemo, useState } from "react";

type Vereador = {
  id: string | number;
  nome: string | null;
  nome_parlamentar: string | null;
  partido: string | null;
  legislatura: string | null;
};

export default function VereadoresLista({
  vereadores,
}: {
  vereadores: Vereador[];
}) {
  const [pesquisa, setPesquisa] = useState("");

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return vereadores;

    return vereadores.filter((v) =>
      [v.nome_parlamentar, v.nome, v.partido, v.legislatura]
        .filter(Boolean)
        .some((valor) =>
          valor!.toLocaleLowerCase("pt-BR").includes(termo)
        )
    );
  }, [pesquisa, vereadores]);

  return (
    <div>
      <div className="search-box">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Pesquisar vereador ou partido..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          aria-label="Pesquisar vereadores por nome ou partido"
        />
        {pesquisa && (
          <button
            className="clear-search"
            onClick={() => setPesquisa("")}
            type="button"
          >
            Limpar
          </button>
        )}
      </div>

      <p className="search-result">
        {filtrados.length} vereador(es) encontrado(s)
      </p>

      {filtrados.length === 0 ? (
        <div className="empty-state">
          <span>⌕</span>
          <h3>Nenhum resultado encontrado</h3>
          <p>Tente pesquisar por outro nome ou partido.</p>
        </div>
      ) : (
        <div className="council-grid">
          {filtrados.map((vereador) => {
            const nome =
              vereador.nome_parlamentar ||
              vereador.nome ||
              "Nome não informado";

            return (
              <article className="council-card" key={vereador.id}>
                <div className="avatar">
                  {nome
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((parte) => parte[0])
                    .join("")
                    .toLocaleUpperCase("pt-BR")}
                </div>

                <div className="council-info">
                  <h3>{nome}</h3>
                  <span className="party-tag">
                    {vereador.partido || "Partido não informado"}
                  </span>
                  <p>
                    Legislatura: {vereador.legislatura || "Não informada"}
                  </p>
                </div>

                <span className="card-decoration" aria-hidden="true">
                  →
                </span>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
