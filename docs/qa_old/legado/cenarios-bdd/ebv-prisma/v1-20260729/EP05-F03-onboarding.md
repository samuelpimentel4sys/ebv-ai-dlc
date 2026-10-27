# EP05-F03 — Onboarding B2B · Cenários BDD

| Meta | Valor |
|------|-------|
| Projeto | EBV Prisma |
| Tela | OnboardingPage |
| Versão | v1-20260729 |
| Gerado | 29/07/2026 |
| Agente | GherkinFlow |
| Total | 10 (5 Positivo · 4 Negativo · 1 Regressivo) |
| Par HTML | [EP05-F03-onboarding.html](./EP05-F03-onboarding.html) |

## Tabela BDD (7 colunas)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|--------------------------|--------------|---------------|--------------|----------|----------------------|
| EP05-F03-01 | Positivo · Carregamento do stepper | Dado que um representante da Fintech Vega acessa `/b2b/onboarding` | Quando a página de onboarding é carregada | Então o stepper de 4 etapas é exibido | E a etapa 1 CNPJ está ativa para preenchimento | OnboardingPage.tsx |
| EP05-F03-02 | Positivo · Validação CNPJ Vega | Dado que o representante está na etapa 1 do onboarding | Quando informa CNPJ 45.998.211/0001-33 e razão social Fintech Vega LTDA | Então o sistema valida o CNPJ com sucesso | E habilita avanço para a etapa Representante | OnboardingPage.tsx · POST /api/v1/onboarding/start |
| EP05-F03-03 | Positivo · Verificação do representante | Dado que a etapa CNPJ da Vega foi concluída | Quando informa representante Paula Nunes, CPF 321.987.654-00 e e-mail corporativo paula.nunes@vega.finance | Então a verificação do representante é aceita | E o fluxo avança para a etapa Contrato | OnboardingPage.tsx · POST /api/v1/onboarding/verify |
| EP05-F03-04 | Positivo · Aceite de contrato e plano | Dado que o representante está na etapa Contrato do onboarding Vega | Quando aceita os termos contratuais e seleciona plano Escala | Então o sistema registra aceite e plano escolhido | E habilita avanço para a etapa Credencial | OnboardingPage.tsx |
| EP05-F03-05 | Positivo · Conclusão com credencial sandbox | Dado que todas as etapas anteriores do onboarding Vega foram validadas | Quando o representante conclui o fluxo de onboarding | Então o sistema emite credencial sandbox para integração | E exibe resumo com clientId e instruções de uso | OnboardingPage.tsx · POST /api/v1/onboarding/complete |
| EP05-F03-06 | Negativo · CNPJ inválido | Dado que o representante está na etapa 1 CNPJ | Quando informa CNPJ 11.111.111/1111-11 e tenta avançar | Então o sistema bloqueia o avanço com erro de validação | E permanece na etapa CNPJ sem chamar verificação | OnboardingPage.tsx · POST /api/v1/onboarding/start |
| EP05-F03-07 | Negativo · CPF do representante inválido | Dado que o CNPJ 45.998.211/0001-33 foi aceito na etapa 1 | Quando informa CPF 000.000.000-00 na etapa Representante | Então o sistema rejeita o CPF com mensagem de validação | E impede avanço para a etapa Contrato | OnboardingPage.tsx · POST /api/v1/onboarding/verify |
| EP05-F03-08 | Negativo · E-mail não corporativo | Dado que o representante preencheu nome e CPF válidos | Quando informa e-mail pessoal sem domínio corporativo da Vega | Então o sistema bloqueia a verificação do representante | E solicita e-mail corporativo válido da empresa | OnboardingPage.tsx · POST /api/v1/onboarding/verify |
| EP05-F03-09 | Negativo · Avanço sem aceite contratual | Dado que o representante está na etapa Contrato | Quando tenta avançar sem aceitar termos ou sem selecionar plano | Então o sistema impede conclusão da etapa | E exibe alertas nos campos obrigatórios pendentes | OnboardingPage.tsx |
| EP05-F03-10 | Regressivo · Retorno preserva dados Vega | Dado que o representante preencheu CNPJ 45.998.211/0001-33 e avançou até etapa Representante | Quando retorna à etapa anterior CNPJ e avança novamente | Então os dados da Fintech Vega permanecem preenchidos | E não é exigido novo POST start para o mesmo CNPJ · reg-note: smoke onboarding B2B | OnboardingPage.tsx · POST /api/v1/onboarding/start |
