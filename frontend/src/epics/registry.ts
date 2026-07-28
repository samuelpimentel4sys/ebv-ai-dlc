import type { NavItem } from '@/app/types';
import { scoreVivoNav } from '@/epics/score-vivo/nav';
import { explicabilidadeNav } from '@/epics/explicabilidade/nav';
import { copilotoPjNav } from '@/epics/copiloto-pj/nav';
import { salaRiscoNav } from '@/epics/sala-risco/nav';
import { contestacaoNav } from '@/epics/contestacao/nav';
import { thinfileNav } from '@/epics/thinfile/nav';

/**
 * Telas de produto por épico. Cada épico registra suas rotas reais
 * (definidas nas US-FE) em `<epico>/nav.tsx`.
 */
export const epicNav: NavItem[] = [
  ...scoreVivoNav,
  ...explicabilidadeNav,
  ...copilotoPjNav,
  ...salaRiscoNav,
  ...contestacaoNav,
  ...thinfileNav,
];
