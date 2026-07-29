from dataclasses import dataclass

from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmGateway, LlmResult


@dataclass(frozen=True, slots=True)
class SmokeLlmCommand:
    prompt: str


class SmokeLlm:
    """Use case mínimo P0 — valida wiring do LlmGateway."""

    def __init__(self, llm: LlmGateway) -> None:
        self._llm = llm

    async def execute(self, command: SmokeLlmCommand) -> LlmResult:
        return await self._llm.complete(
            [
                ChatMessage(role="system", content="Responda em português, uma frase."),
                ChatMessage(role="user", content=command.prompt),
            ],
            temperature=0.1,
            max_tokens=128,
        )
