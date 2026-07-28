import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Lock, Sparkles } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Metric,
  Modal,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatNumber } from '@/lib/format';
import { achievements, missions, type Mission } from '@/epics/thinfile/data';

const difficultyTone = {
  facil: 'success',
  media: 'info',
  dificil: 'warning',
} as const;
const categoryLabel: Record<Mission['category'], string> = {
  educacao: 'Educação financeira',
  habito: 'Hábito',
  dados: 'Meus dados',
  regularizacao: 'Regularização',
};

const ALL = 'todas';

/** A missão de regularização é o elo com a contestação de EP-05. */
const nextStepFor: Record<Mission['category'], { to: string; label: string }> = {
  regularizacao: { to: '/titular/registros', label: 'Ver meus registros' },
  dados: { to: '/titular/vinculos', label: 'Vincular outra conta' },
  habito: { to: '/coach/jornada', label: 'Voltar à jornada' },
  educacao: { to: '/coach/simulador', label: 'Simular o próximo ganho' },
};

export function MissionsPage() {
  const toast = useToast();
  const [category, setCategory] = useState(ALL);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<Mission | null>(null);
  const [completed, setCompleted] = useState<Mission | null>(null);

  const query = useMockQuery(
    () => ({
      missions: missions.filter((mission) => category === ALL || mission.category === category),
      achievements,
    }),
    {
      latency: 330,
      deps: [category],
      isEmpty: (data) => data.missions.length === 0,
    },
  );

  function withProgress(mission: Mission): Mission {
    const override = progressById[mission.missionId];
    if (override === undefined) return mission;
    return {
      ...mission,
      progress: override,
      status: override >= mission.target ? 'concluida' : 'em_andamento',
    };
  }

  function advance(mission: Mission) {
    const previous = progressById[mission.missionId];
    const progress = Math.min(mission.progress + 1, mission.target);
    const done = progress >= mission.target;
    setProgressById((current) => ({
      ...current,
      [mission.missionId]: progress,
    }));
    setDetail(null);
    setCompleted(done ? mission : null);
    toast.undoable(
      done ? `Missão concluída! +${mission.points} pontos` : 'Progresso registrado',
      `POST /api/v1/missions/${mission.missionId}/progress`,
      () => {
        setProgressById((current) => {
          const next = { ...current };
          if (previous === undefined) delete next[mission.missionId];
          else next[mission.missionId] = previous;
          return next;
        });
        setCompleted(null);
      },
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F05-US-FE-01"
      title="Catálogo de missões"
      description="Missões que traduzem boas práticas de crédito em passos concretos: categoria, dificuldade, pontuação, progresso acumulado, pré-requisitos de desbloqueio e impacto estimado no score."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Coach B2C
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /coach/missoes
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader
            eyebrow="GET /api/v1/missions"
            title="Filtrar missões"
            description="Escolha um tema para focar sua próxima ação."
          />
          <div className="max-w-xs">
            <SelectField
              label="Categoria"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={[
                { value: ALL, label: 'Todas as categorias' },
                { value: 'educacao', label: 'Educação financeira' },
                { value: 'habito', label: 'Hábito' },
                { value: 'dados', label: 'Meus dados' },
                { value: 'regularizacao', label: 'Regularização' },
              ]}
            />
          </div>
        </Card>

        {completed ? (
          <Notice tone="success" title={`Missão concluída: ${completed.title}`}>
            <p>
              O ganho estimado é {completed.estimatedImpact}. Continue pela trilha para manter a
              sequência ativa.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={nextStepFor[completed.category].to}
                className={buttonClass('secondary', 'sm')}
              >
                {nextStepFor[completed.category].label}
              </Link>
              <Link to="/coach/simulador" className={buttonClass('ghost', 'sm')}>
                Ver impacto no score
              </Link>
              <Link to="/marketplace/ofertas" className={buttonClass('ghost', 'sm')}>
                Conferir ofertas destravadas
              </Link>
            </div>
          </Notice>
        ) : null}

        <QueryBoundary
          query={query}
          loadingRows={6}
          empty={{
            title: 'Nenhuma missão disponível para você agora.',
            description:
              'Todas as missões deste tema já foram concluídas ou dependem de um passo anterior da jornada. Volte à trilha do coach para ver qual é a etapa atual.',
            action: (
              <Link to="/coach/jornada" className={buttonClass('secondary', 'sm')}>
                Abrir minha trilha
              </Link>
            ),
          }}
          noResults={{
            active: category !== ALL,
            description:
              'Nenhuma missão deste tema está aberta no momento. Volte para todas as categorias para ver o catálogo completo.',
            onClear: () => setCategory(ALL),
          }}
        >
          {(data) => {
            const list = data.missions.map(withProgress);
            const earned = list
              .filter((mission) => mission.status === 'concluida')
              .reduce((sum, mission) => sum + mission.points, 0);

            return (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    value={list.filter((mission) => mission.status === 'concluida').length}
                    label="Missões concluídas"
                    tone="success"
                  />
                  <Metric
                    value={list.filter((mission) => mission.status === 'em_andamento').length}
                    label="Em andamento"
                    icon={<Compass size={18} aria-hidden="true" />}
                  />
                  <Metric value={formatNumber(earned)} label="Pontos acumulados" tone="action" />
                  <Metric
                    value={list.filter((mission) => mission.status === 'bloqueada').length}
                    label="Bloqueadas"
                    hint="dependem de pré-requisito"
                  />
                </div>

                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((mission) => (
                    <li key={mission.missionId}>
                      <Card
                        accent={
                          mission.status === 'concluida'
                            ? 'success'
                            : mission.status === 'bloqueada'
                              ? 'none'
                              : 'action'
                        }
                        className="h-full"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">{categoryLabel[mission.category]}</Badge>
                          <Badge tone={difficultyTone[mission.difficulty]}>
                            {mission.difficulty}
                          </Badge>
                          <Badge tone="accent">{mission.points} pts</Badge>
                        </div>
                        <h3 className="mt-3 text-base">{mission.title}</h3>
                        <p className="mt-1 text-sm text-eqx-text-muted">{mission.description}</p>
                        <div className="mt-4">
                          <ProgressBar
                            label={`${mission.progress}/${mission.target} ${mission.unit}`}
                            value={mission.progress}
                            max={mission.target}
                            tone={mission.status === 'concluida' ? 'success' : 'action'}
                          />
                        </div>
                        <p className="mt-3 text-xs text-eqx-text-muted">
                          Impacto estimado: {mission.estimatedImpact}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {mission.status === 'bloqueada' ? (
                            <p className="flex items-center gap-2 text-xs text-eqx-text-muted">
                              <Lock size={14} aria-hidden="true" />
                              {mission.requirement}
                            </p>
                          ) : mission.status === 'concluida' ? (
                            <>
                              <Badge tone="success">concluída</Badge>
                              <Link
                                to={nextStepFor[mission.category].to}
                                className={buttonClass('ghost', 'sm')}
                              >
                                {nextStepFor[mission.category].label}
                              </Link>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => setDetail(mission)}>
                              {mission.status === 'disponivel'
                                ? 'Começar missão'
                                : 'Registrar progresso'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>

                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/missions/achievements"
                    title="Conquistas ligadas às missões"
                    actions={<Sparkles size={18} aria-hidden="true" />}
                  />
                  <ul className="flex flex-wrap gap-2">
                    {data.achievements.map((achievement) => (
                      <li key={achievement.achievementId}>
                        <Badge tone={achievement.unlockedAt ? 'success' : 'neutral'}>
                          {achievement.title}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          }}
        </QueryBoundary>
      </div>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ''}
        description="Detalhe da missão e efeito esperado"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Depois
            </Button>
            <Button onClick={() => detail && advance(detail)}>Registrar progresso</Button>
          </>
        }
      >
        {detail ? (
          <div className="grid gap-4">
            <p className="text-sm">{detail.description}</p>
            <ProgressBar
              label={`${detail.progress}/${detail.target} ${detail.unit}`}
              value={detail.progress}
              max={detail.target}
            />
            <Notice tone="info" title="Impacto estimado">
              {detail.estimatedImpact}. O efeito real depende da atualização das fontes e do seu
              comportamento no período.
            </Notice>
          </div>
        ) : null}
      </Modal>
    </ScreenLayout>
  );
}
