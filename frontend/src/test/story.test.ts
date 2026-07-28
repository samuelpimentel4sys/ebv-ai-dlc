import { describe, expect, it } from 'vitest';
import { AURORA, MARIA, VEGA } from '@/app/story';
import { scoreCurrent, scoreHistory } from '@/epics/score-vivo/data';
import { explain } from '@/epics/explicabilidade/data';
import { titularRecords, credentials, onboardingPrefill } from '@/epics/contestacao/data';
import { simulationActions } from '@/epics/thinfile/data';
import { portfolioNodes } from '@/epics/sala-risco/data';
import { library } from '@/epics/copiloto-pj/data';

/**
 * A V2 da avaliação UX caiu porque Maria valia 742 em EP-01 e 486 nos outros.
 * Este teste trava a fixture canónica: se algum épico inventar número próprio,
 * a suíte quebra antes da plateia.
 */
describe('fixture canónica story.ts', () => {
  it('Maria tem o mesmo score, decisão e modelo no Score Vivo e na Explicabilidade', () => {
    const current = scoreCurrent(MARIA.document);
    expect(current.score).toBe(MARIA.score);
    expect(current.band).toBe(MARIA.scoreBand);
    expect(current.modelVersion).toBe(MARIA.modelVersion);

    const history = scoreHistory();
    expect(history[history.length - 1].score).toBe(MARIA.score);
    expect(history[history.length - 2].score).toBe(MARIA.previousScore);

    const factors = explain(MARIA.decisionId);
    expect(factors.score).toBe(MARIA.score);
    expect(factors.decisionId).toBe(MARIA.decisionId);
    expect(factors.outcome).toBe('recusado');
  });

  it('Maria tem exatamente dois apontamentos no portal, com o primeiro sob contestação', () => {
    const apontamentos = titularRecords.filter((row) => row.type === 'apontamento');
    expect(apontamentos).toHaveLength(2);
    expect(apontamentos[0].recordId).toBe(MARIA.records[0].id);
    expect(apontamentos[0].disputable).toBe(false);
    expect(apontamentos[1].recordId).toBe(MARIA.records[1].id);
    expect(apontamentos[1].disputable).toBe(true);
  });

  it('o simulador do coach aponta para a contestação canónica e o teto 548', () => {
    const action = simulationActions.find((entry) => entry.kind === 'quitar');
    expect(action?.label).toContain(MARIA.disputeProtocol);
    expect(MARIA.scoreAfterDispute).toBe(548);
  });

  it('Aurora é o epicentro do grafo e não aparece como metalúrgica', () => {
    const node = portfolioNodes.find((entry) => entry.id === AURORA.graphNodeId);
    expect(node).toBeDefined();
    expect(node!.exposure).toBe(AURORA.exposure);
    expect(node!.label).toBe(AURORA.shortName);
    expect(JSON.stringify(library)).not.toMatch(/Metalúrgica/i);
  });

  it('Vega preenche o onboarding e as credenciais B2B', () => {
    expect(onboardingPrefill.cnpj).toBe(VEGA.document);
    expect(onboardingPrefill.razaoSocial).toBe(VEGA.name);
    expect(onboardingPrefill.plan).toBe('escala');
    expect(credentials.some((row) => row.clientId === VEGA.clientId)).toBe(true);
  });
});
