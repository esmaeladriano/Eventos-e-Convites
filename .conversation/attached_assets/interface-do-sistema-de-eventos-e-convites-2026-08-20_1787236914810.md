# Interface do sistema de Eventos e Convites

O backend (perfis, eventos, convites, códigos únicos, controlo de capacidade e validação por código) já existe. Falta construir toda a interface. Plano de implementação:

## 1. Conta

- `/auth`: adicionar campos **Nome** e **Telefone** no separador "Criar conta" (guardados nos metadados e replicados no perfil).
- Corrigir o erro de hidratação atual da página de login.
- Após entrar, o utilizador vai para **Meus eventos**.

## 2. Painel "Meus eventos"

- Nova página `/eventos` (protegida): grelha de cartões com capa, nome, tipo, data, contagem de convites e estado.
- Botão **➕ Criar novo** abre diálogo: nome, tipo (festa, casamento, pedido, aniversário, formatura, empresarial, outro), data/hora, local, descrição, capacidade e capa (URL).
- A antiga página de pessoas/QR deixa de ser a página inicial; o menu lateral passa a ter "Meus eventos" e "Escanear".

## 3. Página do evento

`/eventos/{id}` com:

- Cabeçalho com capa, tipo e data.
- **Cronómetro regressivo** para o início do evento (dias/horas/minutos/segundos).
- Cartões de estatística: capacidade, convites criados, entraram, pendentes, cancelados.
- **Tabela de controlo de entrada**: nome, código, estado, hora de entrada — com filtro por estado e pesquisa.
- Exportação (Excel/PDF) da lista de convidados.

## 4. Convidados e convites

Na mesma página do evento:

- **Adicionar convidado** (nome + contacto opcional) → gera convite com código único; bloqueia ao atingir a capacidade.
- Ações por linha: ver convite, **baixar QR Code** (PNG), copiar link, **cancelar convite**.
- Diálogo de convite com o QR gerado a partir do código único e botão de impressão.

## 5. Convite público

- Rota pública `/convite/{codigo}` (sem login), lê os dados pelo código e mostra: nome do convidado, evento, tipo, data, local, descrição, capa e o **QR Code**.
- Estados visuais: válido, já utilizado (com data/hora), cancelado, código inexistente.
- Metadados de partilha (título/descrição/imagem) para WhatsApp e redes sociais.

## 6. Scanner

- `/scan` passa a validar convites em vez de pessoas:
  - Lê o código → consulta o convite → mostra convidado, evento e estado.
  - Se válido: regista **hora de entrada** e quem leu, mostra "✅ Entrada confirmada".
  - Se já usado: "❌ Convite já utilizado" com a hora da primeira entrada.
  - Se cancelado ou inexistente: mensagem de erro correspondente.
- Feedback sonoro/visual e histórico das últimas leituras da sessão.

## Notas técnicas

- Rotas protegidas sob `src/routes/_authenticated/`; `/convite/$codigo` fica pública e usa a função `get_invite_by_code` (security definer) através de uma server function pública.
- A marcação de entrada é feita por uma função de servidor autenticada, garantindo que só o organizador (ou leitor autenticado) pode confirmar entradas e evitando duplo uso.
- Geração de QR reutiliza `src/lib/qr.ts`, passando a codificar o URL do convite.
- Poderá ser necessária uma pequena migração adicional para permitir a leitura/validação de convites por utilizadores autenticados que não sejam o dono, caso queira delegar a entrada a porteiros.
