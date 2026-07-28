import { createElement } from 'react';
import { matchPath } from 'react-router-dom';
import type { EpicId, NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
import { epicNav } from '@/epics/registry';
import { EPICS } from '@/app/epics';

const HomePage = lazyScreen(() => import('@/app/HomePage'), 'HomePage');
const DemoScriptPage = lazyScreen(() => import('@/app/DemoScriptPage'), 'DemoScriptPage');
const EpicLandingPage = lazyScreen(() => import('@/app/EpicLandingPage'), 'EpicLandingPage');

const homeNav: NavItem = {
  path: '/',
  href: '/',
  label: 'Início',
  group: 'Início',
  description: 'Hub dos seis épicos e atalho para a primeira tela de cada um.',
  keywords: ['home', 'inicio', 'hub', 'epicos'],
  element: createElement(HomePage),
};

/** Entradas de hub: entram no Ctrl+K sem contar como tela de produto das trilhas. */
const hubNav: NavItem[] = [
  {
    path: '/roteiro',
    href: '/roteiro',
    label: 'Roteiro da demo',
    group: 'Início',
    description: 'Seis atos de dez minutos com frase de abertura, persona e desfecho de cada épico.',
    keywords: ['roteiro', 'demo', 'apresentacao', 'atos', 'script'],
    element: createElement(DemoScriptPage),
  },
  ...EPICS.map(
    (epic): NavItem => ({
      path: '/epicos/:epicId',
      href: `/epicos/${epic.id}`,
      label: `${epic.id} · ${epic.shortName}`,
      group: 'Landings de épico',
      description: epic.businessOutcome,
      keywords: [epic.id, epic.shortName, epic.name, 'landing', 'trilha', 'jornada'],
      element: createElement(EpicLandingPage),
    }),
  ),
];

export const NAV_ITEMS: NavItem[] = [homeNav, ...epicNav];

/** Índice de busca: telas de produto + hub (roteiro e landings). */
export function searchNav(): NavItem[] {
  return [...NAV_ITEMS, ...hubNav];
}

export function flatNav(): NavItem[] {
  return NAV_ITEMS;
}

export function navGroups(): { name: string; items: NavItem[] }[] {
  const groups: { name: string; items: NavItem[] }[] = [];
  for (const item of NAV_ITEMS) {
    const group = groups.find((entry) => entry.name === item.group);
    if (group) group.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }
  return groups;
}

export function epicScreenCount(epic: EpicId): number {
  return NAV_ITEMS.filter((item) => item.epic === epic).length;
}

export function navByEpic(epic: EpicId): NavItem[] {
  return NAV_ITEMS.filter((item) => item.epic === epic);
}

/**
 * Resolve a tela pelo padrão de rota, e não pelo href de exemplo. Sem isso, o
 * cabeçalho fica sem título assim que o operador abre outro protocolo ou CNPJ.
 */
export function navItemByPathname(pathname: string): NavItem | undefined {
  return (
    NAV_ITEMS.find((item) => item.href === pathname) ??
    NAV_ITEMS.find((item) => Boolean(matchPath(item.path, pathname)))
  );
}
