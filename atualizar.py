import os
import requests
from supabase import create_client, Client

# Pega as chaves do Supabase através das variáveis secretas do GitHub
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") # Use a chave de serviço (service_role) para ter permissão de escrita
supabase: Client = create_client(url, key)

def sincronizar_dados():
    print("Iniciando busca de novos dados da Câmara...")
    
    # EXEMPLO: Aqui você coloca a lógica que busca os dados da Câmara
    # (pode ser um request para uma API externa ou leitura de um link oficial)
    
    # novos_dados = [
    #     {"beneficiario": "Fulano", "valor_pago": 150.00, "ano": 2026, ...}
    # ]

    # Exemplo de inserção/atualização no Supabase:
    # resposta = supabase.table("diarias").upsert(novos_dados).execute()
    # print("Dados atualizados com sucesso:", resposta)

if __name__ == "__main__":
    sincronizar_dados()