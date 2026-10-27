# Cenários BDD — PRISMA-EP-05-AUTH · Portal de Contestação

Fonte aprovada: HTML `11_BDD_PRISMA-EP-05-AUTH_PortalContestacao.html` (14 cenários).
Engenharia reversa (GherkinFlow DEMO): telas lab Prisma — captura biométrica, MFA, resultado.
Pacote HTML não tem CPF/senha na UI lab; papel = cliente do portal. Dígitos só no DataForge.

| Tipo | Qtd |
|---|:---:|
| ✅ Positivo | 6 |
| ❌ Negativo | 5 |
| 🔁 Regressivo | 3 |
| **Total** | **14** |

## SCR-01 — Tela Principal (Login & OTP)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| AUTH-01 | [Positivo] Autenticação inicial e emissão de OTP | Dado que o cliente está na tela de autenticação do Portal de Contestação | Quando informar documento válido fictício e senha cadastrada e solicitar a autenticação | Então o sistema valida as credenciais e envia um código de verificação de 6 dígitos ao canal cadastrado | E exibe a verificação do código com temporizador ativo | `BDD-EP05-AUTH-001` · `LivenessCapturePage.tsx:75` `registerConsent` · `LivenessCapturePage.tsx:97` `createSession` |
| AUTH-02 | [Positivo] Validação bem-sucedida do OTP | Dado que o cliente recebeu o código de 6 dígitos no dispositivo móvel | Quando informar o código correto dentro do prazo de validade | Então o sistema valida o código e emite a sessão temporária | E segue para a verificação biométrica facial | `BDD-EP05-AUTH-002` · `LivenessMfaPage.tsx:44` `confirm` score ≥ 80 |
| AUTH-04 | [Positivo] Reenvio de código após o temporizador | Dado que o cliente não recebeu a mensagem no prazo inicial | Quando o temporizador zera e o cliente solicita novo código | Então o sistema emite novo código válido e reinicia a contagem | E confirma na tela o reenvio | `BDD-EP05-AUTH-004` · lab: badge TTL `LivenessCapturePage.tsx:152` |
| AUTH-07 | [Negativo] Código de verificação incorreto | Dado que o cliente está na tela de inserção do código | Quando informar um código divergente ou incompleto | Então o sistema rejeita o código e apresenta alerta de código inválido | E informa tentativas restantes antes do bloqueio | `BDD-EP05-AUTH-007` · `LivenessMfaPage.tsx:45` formato 6 dígitos |
| AUTH-08 | [Negativo] Bloqueio temporário após três erros | Dado que o cliente já errou o código duas vezes seguidas | Quando informar código incorreto pela terceira vez consecutiva | Então o sistema bloqueia temporariamente novas tentativas | E informa o bloqueio de segurança com prazo de espera | `BDD-EP05-AUTH-008` · lab OTP `000000` → `LivenessMfaPage.tsx:52` / HTTP 429 `LivenessCapturePage.tsx:115` |
| AUTH-12 | [Regressivo] Expiração da sessão temporária | Dado que o cliente ficou inativo além do prazo da sessão | Quando tentar seguir após o vencimento do temporizador | Então o sistema invalida a sessão por expiração | E solicita reinício da autenticação | `BDD-EP05-AUTH-012` · `LivenessCapturePage.tsx:135` TTL 0 → `expired` |

## SCR-02 — Modal Interativo (Biometria Facial)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| AUTH-03 | [Positivo] Validação biométrica facial e prova de vida | Dado que o cliente autorizou a câmera e está posicionado à frente do dispositivo | Quando enquadrar o rosto na moldura sob iluminação adequada e realizar o movimento de prova de vida | Então o sistema reconhece a prova de vida e dispara a captura | E aprova a autenticação biométrica acima do patamar mínimo | `BDD-EP05-AUTH-003` · `LivenessCapturePage.tsx:226` guia oval · `finishCaptureLab:130` |
| AUTH-05 | [Positivo] Ajuste de iluminação facial | Dado que o ambiente inicial está pouco iluminado | Quando o cliente se desloca para local mais iluminado após a orientação | Então a moldura passa a indicar prontidão para captura | E a prova de vida segue sem interrupção | `BDD-EP05-AUTH-005` · `LivenessCapturePage.tsx:228` instrução do oval |
| AUTH-06 | [Positivo] Conclusão da autenticação forte e acesso | Dado que o cliente concluiu credenciais, código e biometria | Quando a validação final for confirmada | Então o sistema concede acesso ao painel do titular | E oferece o próximo passo no portal | `BDD-EP05-AUTH-006` · `LivenessResultPage.tsx:26` · CTA `/titular/registros` L84 |
| AUTH-09 | [Negativo] Similaridade abaixo do patamar | Dado que a captura não corresponde ao titular da conta | Quando o índice de similaridade ficar abaixo do mínimo de negócio | Então o sistema nega a autenticação biométrica | E oferece nova tentativa ou outro canal | `BDD-EP05-AUTH-009` · `LivenessMfaPage.tsx:52` score 42 · título `Vivacidade insuficiente` |
| AUTH-10 | [Negativo] Falha na prova de vida | Dado que o cliente tenta usar imagem estática no lugar da câmera ao vivo | Quando o processo não identifica movimentos de uma pessoa presente | Então o sistema invalida a captura e alerta a prova de vida | E solicita nova captura em tempo real | `BDD-EP05-AUTH-010` · notice lab `LivenessCapturePage.tsx:159` Amplify fora do slice |
| AUTH-11 | [Negativo] Recusa de permissão da câmera | Dado que o portal solicita acesso à câmera para a captura | Quando o cliente recusa a permissão no navegador | Então o sistema impede o avanço e exibe orientação | E explica como liberar a câmera neste ambiente | `BDD-EP05-AUTH-011` · `startCamera` catch L68 |
| AUTH-13 | [Regressivo] Purga de imagem biométrica | Dado que uma verificação biométrica já foi processada | Quando transcorre o prazo máximo de retenção da imagem temporária | Então o material bruto deixa de ficar disponível na jornada | E permanece o registro de consentimento do termo | `BDD-EP05-AUTH-013` · termo v1.0 RN006 `LivenessCapturePage.tsx:180` |
| AUTH-14 | [Regressivo] Indisponibilidade do serviço biométrico | Dado que o serviço de validação biométrica está temporariamente indisponível | Quando o cliente tenta concluir a captura e a espera estoura | Então o portal informa indisponibilidade momentânea sem detalhe interno | E mantém a jornada em modo de contingência do laboratório | `BDD-EP05-AUTH-014` · notice `LivenessCapturePage.tsx:159` · toast falha L123 |
