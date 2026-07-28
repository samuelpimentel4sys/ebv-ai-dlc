import type { ReactElement } from 'react';

export type EpicId = 'EP-01' | 'EP-02' | 'EP-03' | 'EP-04' | 'EP-05' | 'EP-06';

export interface NavItem {
  /** Rota real definida na US-FE (ex.: /risco/score/:documento/historico). */
  path: string;
  /** Caminho navegável (params já preenchidos com exemplo). */
  href: string;
  label: string;
  /** Ausente na home do hub; obrigatório nas telas de produto. */
  epic?: EpicId;
  usId?: string;
  group: string;
  description: string;
  keywords?: string[];
  element: ReactElement;
}

export interface EpicMeta {
  id: EpicId;
  code: string;
  name: string;
  shortName: string;
  color: string;
  summary: string;
  /** Resultado de negócio que sustenta o épico na conversa executiva. */
  businessOutcome: string;
  /** Como este épico se liga ao anterior na história da demonstração. */
  connectsTo: string;
}
