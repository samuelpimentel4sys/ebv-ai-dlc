import { Suspense, lazy, type ComponentType } from 'react';
import { SkeletonPanel } from '@/ds/Feedback';
import { SectionWrapper } from '@/shell/SectionWrapper';

function ScreenFallback() {
  return (
    <SectionWrapper wide>
      <div className="mb-6 h-1 w-24 rounded-pill bg-eqx-border" />
      <SkeletonPanel rows={7} />
    </SectionWrapper>
  );
}

/**
 * Carrega a tela sob demanda para manter o bundle inicial dentro do budget do DS.
 * O loader recebe o módulo e devolve o componente nomeado exportado por ele.
 */
export function lazyScreen<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  name: K,
): ComponentType {
  const Lazy = lazy(async () => ({ default: (await loader())[name] as ComponentType }));
  return function LazyScreen() {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <Lazy />
      </Suspense>
    );
  };
}
