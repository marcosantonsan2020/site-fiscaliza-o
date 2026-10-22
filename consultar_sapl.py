import requests

url = "https://sapl.saofrancisco.mg.leg.br/api/parlamentares/legislatura/2/parlamentares/"

todos = []
proxima = url

while proxima:
    resposta = requests.get(proxima, timeout=30)
    resposta.raise_for_status()
    dados = resposta.json()

    todos.extend(dados.get("results", []))

    link = dados.get("pagination", {}).get("links", {}).get("next")
    proxima = link.replace("http://", "https://", 1) if link else None

print(f"\nTOTAL ENCONTRADO: {len(todos)}\n")

for p in todos:
    print(
        f"ID SAPL: {p.get('id')} | "
        f"Nome: {p.get('nome_parlamentar')} | "
        f"Ativo: {p.get('ativo')} | "
        f"Titular: {p.get('titular')} | "
        f"Foto: {p.get('fotografia')}"
    )
