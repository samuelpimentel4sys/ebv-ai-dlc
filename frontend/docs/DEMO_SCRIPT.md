# Roteiro da demonstração — EBV Prisma Showcase

Versão navegável em `/roteiro`. Este documento é a versão de bolso para quem apresenta.

## O elenco

Duas histórias atravessam os seis épicos. Nada é apresentado como tela isolada.

| Personagem | Quem é | Onde aparece |
|---|---|---|
| **Maria Souza** — CPF 123.456.789-01 | Titular com histórico curto, score 486, crédito recusado em 27/07/2026, dois apontamentos (um deles indevido) | EP-01 decide · EP-02 explica · EP-05 corrige · EP-06 devolve elegibilidade |
| **Aurora Alimentos S.A.** — CNPJ 12.345.678/0001-90 | Cliente PJ em análise de crédito, rating BB−, exposição de R$ 48,2 mi | EP-03 analisa · EP-04 encontra na carteira |
| **Fintech Vega** — CNPJ 45.998.211/0001-33 | PME que contrata o console B2B por self-service | EP-05 |

As personas que conduzem as trilhas estão em `src/app/personas.ts`. Os números canónicos estão em
`src/app/story.ts` — nenhum mock inventa valores próprios para Maria, Aurora ou Vega.

## Os seis atos (10 minutos cada)

### Ato 1 · EP-01 Score Vivo
> "Uma proposta de crédito de Maria acabou de entrar. Vamos ver o dado chegar e a decisão sair no mesmo minuto."

Trilha principal: **Promover modelo e provar a decisão de Maria** (Camila Prado, ciência de dados).
Fecho: a recusa fica reproduzível — mesmos atributos, mesma versão, mesmo resultado.
Trilha opcional: operação do barramento (Rafael Dias), para plateia técnica.

### Ato 2 · EP-02 Explicabilidade
> "A decisão foi recusar. Agora Maria liga perguntando por que — e o regulador vai perguntar depois."

Trilha principal: **Explicar a recusa de Maria** (Helena Braga, DPO).
Fecho: Maria recebe motivo, caminho de melhoria e dossiê LGPD sem depender do time de dados.
Trilhas opcionais: prestação de contas ao regulador (Sérgio Matias) e ensaio de política (Otávio Lemos).

### Ato 3 · EP-03 Copiloto PJ
> "Trocando de mesa: aqui o cliente é a Aurora Alimentos, e o analista tem 200 páginas de balanço para ler hoje."

Trilha principal: **Do balanço da Aurora ao parecer aprovado** (Bruno Tavares, analista PJ).
Fecho: parecer no mesmo dia, com cada afirmação ligada à página de origem.
Trilha opcional: custo da GenAI por parecer (Rafael Dias) — use quando houver pergunta de FinOps.

### Ato 4 · EP-04 Sala de Risco
> "A Aurora não é um caso isolado. Ela está dentro da nossa carteira, ligada a outros."

Trilha principal: **Rastrear o contágio a partir da Aurora** (Letícia Alencar, risco de carteira).
Fecho: exposição encadeada vira limite revisado antes do vencimento.
Trilha opcional: do estresse macro ao comitê (Cláudia Bastos, CRO) — melhor para plateia executiva.

### Ato 5 · EP-05 Contestação e Console B2B
> "Volta para Maria: um dos dois apontamentos dela está errado, e ela quer resolver sem ligar para o SAC."

Trilha principal: **Contestar o apontamento indevido** (Maria Souza).
Fecho: ela acompanha o próprio caso e o atendimento humano deixa de ser o único caminho.
Trilhas opcionais: fila com SLA (Diego Ramos) e self-service da Vega (Paula Nunes).

### Ato 6 · EP-06 Thin-File e Coach
> "Apontamento corrigido, Maria ainda tem histórico curto. É aqui que ela entra no mercado de crédito."

Trilha principal: **Construir histórico e voltar a ser elegível** (Maria Souza).
Fecho: ela sai de thin-file para elegível usando dado alternativo que autorizou.
Trilha opcional: sustentação do score thin-file (Camila Prado).

## Corte de 20 minutos

Apresente só a história de Maria: ato 2 (recusa explicada), ato 5 (contestação) e ato 6 (retorno à
elegibilidade). Os atos 1 e 3 são o pano de fundo técnico e podem ser resumidos em uma frase.

## Quando a plateia perguntar "e se o serviço cair?"

O seletor de estado no cabeçalho (ícone de frasco) força quatro cenários em qualquer tela:

| Estado | O que mostra |
|---|---|
| Dados normais | resposta completa |
| Resposta vazia | lista sem registros, com o caminho para popular |
| Resposta parcial | uma fonte indisponível, com aviso de que o número pode mudar |
| Falha de serviço | erro 503 com `correlationId` e ação de nova tentativa |

Também funciona por URL: `?state=empty`, `?state=partial`, `?state=error`.

## Atalhos

| Atalho | Ação |
|---|---|
| `Ctrl+K` | busca por nome de tela, rota ou identificador de User Story |
| Setas no cabeçalho | passo anterior e próximo **dentro da trilha atual** |
| Ícone de tema | claro / escuro, ambos aprovados em contraste WCAG 2.2 AA |
| Ícone de densidade | compacta / confortável / espaçosa, conforme a seção 13 do Design System |
