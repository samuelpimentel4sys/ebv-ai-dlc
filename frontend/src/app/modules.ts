import type { EpicId, NavItem } from '@/app/types';
import { NAV_ITEMS } from '@/app/navigation';

/** Módulo de produto visível ao operador — não é código de épico BMAD. */
export type ProductModuleId =
  | 'plataforma'
  | 'dados'
  | 'risco'
  | 'integracao'
  | 'ml'
  | 'compliance'
  | 'credito-pj'
  | 'portfolio'
  | 'contestacao'
  | 'inclusao';

export interface ProductModule {
  id: ProductModuleId;
  label: string;
  shortName: string;
  description: string;
  /** Hrefs (navegáveis) pertencentes ao módulo. */
  hrefs: string[];
  /** Épicos BMAD de origem (rastreio interno). */
  epicIds: EpicId[];
}

/**
 * IA de navegação do produto Prisma Equifax.
 * Rotas das US-FE permanecem; só a agrupamento muda.
 */
export const PRODUCT_MODULES: ProductModule[] = [
  {
    id: 'plataforma',
    label: 'Plataforma',
    shortName: 'Plataforma',
    description: 'Saúde do barramento, SLO e replay operacional.',
    hrefs: [
      '/plataforma/eventos/saude',
      '/plataforma/observabilidade/slo',
      '/dados/replay/jobs',
    ],
    epicIds: ['EP-01'],
  },
  {
    id: 'dados',
    label: 'Dados',
    shortName: 'Dados',
    description: 'Ingestão, identidade dourada e catálogo de atributos.',
    hrefs: [
      '/dados/ingestao/conectores',
      '/dados/identidade/mesclagem',
      '/risco/features/catalogo',
    ],
    epicIds: ['EP-01'],
  },
  {
    id: 'risco',
    label: 'Risco & Score',
    shortName: 'Risco',
    description: 'Histórico de score do titular e leitura operacional.',
    hrefs: ['/risco/score/12345678901/historico'],
    epicIds: ['EP-01'],
  },
  {
    id: 'integracao',
    label: 'Integração',
    shortName: 'Integração',
    description: 'Playground da API de decisões para parceiros.',
    hrefs: ['/integracao/playground/decisoes'],
    epicIds: ['EP-01'],
  },
  {
    id: 'ml',
    label: 'Modelos',
    shortName: 'ML',
    description: 'Registry, promoção e rollback de versões de score.',
    hrefs: ['/ml/models/registry'],
    epicIds: ['EP-01'],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    shortName: 'Compliance',
    description: 'Snapshots, explicabilidade, auditoria e direitos do titular.',
    hrefs: [], // preenchido por épico EP-01 F04 + todo EP-02
    epicIds: ['EP-01', 'EP-02'],
  },
  {
    id: 'credito-pj',
    label: 'Crédito PJ',
    shortName: 'Crédito PJ',
    description: 'Copiloto GenAI com grounding e alçadas.',
    hrefs: [],
    epicIds: ['EP-03'],
  },
  {
    id: 'portfolio',
    label: 'Portfólio',
    shortName: 'Portfólio',
    description: 'Sala de risco, contágio e dossiê de comitê.',
    hrefs: [],
    epicIds: ['EP-04'],
  },
  {
    id: 'contestacao',
    label: 'Contestações',
    shortName: 'Contestações',
    description: 'Fila, SLA, portal do titular e console B2B.',
    hrefs: [],
    epicIds: ['EP-05'],
  },
  {
    id: 'inclusao',
    label: 'Inclusão',
    shortName: 'Inclusão',
    description: 'Thin-file, consentimento, coach e ofertas.',
    hrefs: [],
    epicIds: ['EP-06'],
  },
];

function navByEpic(epic: EpicId): NavItem[] {
  return NAV_ITEMS.filter((item) => item.epic === epic && item.href !== '/');
}

/** Resolve módulos com hrefs dinâmicos a partir do registry de rotas. */
export function resolvedProductModules(): ProductModule[] {
  return PRODUCT_MODULES.map((mod) => {
    if (mod.hrefs.length > 0 && mod.id !== 'compliance') {
      return mod;
    }
    if (mod.id === 'compliance') {
      const compare = NAV_ITEMS.find((item) => item.href.includes('/compliance/decisoes/comparar'));
      const ep02 = navByEpic('EP-02');
      return {
        ...mod,
        hrefs: [...(compare ? [compare.href] : []), ...ep02.map((item) => item.href)],
      };
    }
    const fromEpics = mod.epicIds.flatMap((epicId) =>
      navByEpic(epicId)
        .filter(() => {
          // EP-01 já fatiado nos módulos acima — não duplicar
          if (epicId === 'EP-01') return false;
          return true;
        })
        .map((item) => item.href),
    );
    return { ...mod, hrefs: fromEpics };
  }).filter((mod) => mod.hrefs.length > 0);
}

export function productModuleForHref(href: string): ProductModule | undefined {
  const modules = resolvedProductModules();
  return modules.find((mod) =>
    mod.hrefs.some((h) => h === href || href.startsWith(h.split('/:')[0])),
  );
}

export function productModuleForPathname(pathname: string): ProductModule | undefined {
  const item = NAV_ITEMS.find(
    (nav) =>
      nav.href === pathname ||
      nav.path === pathname ||
      (nav.path.includes(':') && pathname.startsWith(nav.path.split('/:')[0] + '/')) ||
      (nav.path.includes(':') && matchPathSafe(nav.path, pathname)),
  );
  if (item?.href) {
    const byHref = productModuleForHref(item.href);
    if (byHref) return byHref;
    // Match by epic module fallback for EP-02+
    if (item.epic && item.epic !== 'EP-01') {
      return resolvedProductModules().find((mod) => mod.epicIds.includes(item.epic!));
    }
  }
  return resolvedProductModules().find((mod) =>
    mod.hrefs.some((href) => pathname === href || pathname.startsWith(href)),
  );
}

function matchPathSafe(pattern: string, pathname: string): boolean {
  const prefix = pattern.split('/:')[0];
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function navItemsForModule(mod: ProductModule): NavItem[] {
  return mod.hrefs
    .map((href) => NAV_ITEMS.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
}
