import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Beaker, Command, Route as RouteIcon, Users } from 'lucide-react';
import { Button, buttonClass, Modal } from '@/ds';
import { JOURNEYS } from '@/app/journeys';
import { MARIA } from '@/app/story';

const STORAGE_KEY = 'prisma.tour';

const steps = [
  {
    icon: Users,
    title: 'Duas histórias, seis épicos',
    body: `${MARIA.name} tem score ${MARIA.score} e crédito recusado; a Aurora Alimentos é o cliente PJ em análise. Os seis épicos são capítulos da mesma história, não seis produtos avulsos.`,
  },
  {
    icon: RouteIcon,
    title: 'Trilhas por persona',
    body: `As 56 telas estão organizadas em ${JOURNEYS.length} trilhas conduzidas por pessoas com nome e cargo. Cada tela indica o passo anterior, o próximo e o que a trilha entrega no fim.`,
  },
  {
    icon: Beaker,
    title: 'Estados de exceção sob demanda',
    body: 'O seletor de estado no cabeçalho força resposta vazia, resposta parcial ou falha de serviço em qualquer tela, para responder na hora o que acontece quando o serviço cai.',
  },
  {
    icon: Command,
    title: 'Busca por atalho',
    body: 'Ctrl+K abre a busca por nome da tela, rota ou identificador de User Story. Os controles no topo alternam tema e densidade pelos tokens do Design System.',
  },
];

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') return;
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // Navegação privada sem storage: apenas não exibe o tour.
    }
  }, [pathname]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, 'visto');
    } catch {
      // ignora indisponibilidade do storage
    }
  }

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title="Como navegar neste showcase"
      description="Quatro coisas antes de começar."
      footer={
        <>
          <Link to="/roteiro" onClick={dismiss} className={buttonClass('secondary')}>
            Ver roteiro de 60 min
          </Link>
          <Button onClick={dismiss}>Começar</Button>
        </>
      }
    >
      <ul className="grid gap-4">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 text-eqx-action">
              <step.icon size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">{step.title}</span>
              <span className="block text-sm text-eqx-text-muted">{step.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
