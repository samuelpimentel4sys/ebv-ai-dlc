import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Check, Flame, Lock, Target } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDate, formatNumber, relativeFromNow } from '@/lib/format';
import { MARIA } from '@/app/story';
import {
  achievements,
  coachProgress,
  journeyStages,
  weeklyGoals,
  type WeeklyGoal,
} from '@/epics/thinfile/data';

const rarityTone = { comum: 'neutral', raro: 'info', epico: 'accent' } as const;

export function CoachJourneyPage() {
  const toast = useToast();
  const query = useMockQuery(
    () => ({
      stages: journeyStages,
      goals: weeklyGoals,
      achievements,
      progress: coachProgress,
    }),
    { latency: 340 },
  );
  const { setData } = query;
  const [lastDone, setLastDone] = useState<WeeklyGoal | null>(null);

  function complete(goal: WeeklyGoal) {
    setData((current) => ({
      ...current,
      goals: current.goals.map((item) =>
        item.goalId === goal.goalId ? { ...item, progress: item.target, done: true } : item,
      ),
    }));
    setLastDone(goal);
    toast.undoable(`+${goal.points} pontos`, `Meta concluída: ${goal.title}`, () => {
      setData((current) => ({
        ...current,
        goals: current.goals.map((item) => (item.goalId === goal.goalId ? goal : item)),
      }));
      setLastDone(null);
    });
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F03-US-FE-01"
      title="Jornada do coach financeiro"
      description="Trilha gamificada de melhoria do score: etapas encadeadas com impacto estimado, metas semanais com pontuação, sequência de semanas ativas e conquistas desbloqueadas."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Coach B2C
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /coach/jornada
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Sua trilha ainda não começou.',
          description:
            'Nenhuma etapa foi liberada porque ainda não há dados de consumo ou de pagamento no seu histórico. Vincule uma conta de energia, água ou telecom para o coach montar o primeiro passo.',
          action: (
            <Link to="/titular/vinculos" className={buttonClass('secondary', 'sm')}>
              Vincular minha primeira conta
            </Link>
          ),
        }}
      >
        {(data) => {
          const progress = data.progress;
          const scoreProgress =
            ((progress.scoreNow - progress.scoreStart) /
              (progress.scoreGoal - progress.scoreStart)) *
            100;

          return (
            <div className="grid gap-5">
              <Card accent="accent">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-eqx-accent-text">
                      nível {progress.level} · {progress.levelName}
                    </p>
                    <h2 className="mt-1 text-2xl">
                      Você saiu de {progress.scoreStart} para {progress.scoreNow} pontos
                    </h2>
                    <p className="mt-2 max-w-[60ch] text-sm text-eqx-text-muted">
                      Faltam {progress.scoreGoal - progress.scoreNow} pontos para a meta de{' '}
                      {progress.scoreGoal}, faixa em que a maioria das ofertas de crédito fica
                      disponível sem garantia.
                    </p>
                    <div className="mt-4 grid gap-3 sm:max-w-md">
                      <ProgressBar
                        label={`Progresso até a meta (${formatNumber(scoreProgress)}%)`}
                        value={progress.scoreNow - progress.scoreStart}
                        max={progress.scoreGoal - progress.scoreStart}
                        tone="success"
                      />
                      <ProgressBar
                        label={`${formatNumber(progress.points)} de ${formatNumber(progress.pointsToNextLevel)} pontos para o nível ${progress.level + 1}`}
                        value={progress.points}
                        max={progress.pointsToNextLevel}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to="/coach/missoes" className={buttonClass('secondary', 'sm')}>
                        Escolher a próxima missão
                      </Link>
                      <Link
                        to={`/titular/contestacoes/${MARIA.disputeProtocol}`}
                        className={buttonClass('ghost', 'sm')}
                      >
                        Acompanhar minha contestação
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Metric
                      value={`${progress.streakWeeks} sem.`}
                      label="Sequência ativa"
                      tone="action"
                      icon={<Flame size={18} aria-hidden="true" />}
                      hint="semanas consecutivas com meta cumprida"
                    />
                    <Metric
                      value={data.achievements.filter((item) => item.unlockedAt).length}
                      label="Conquistas desbloqueadas"
                      icon={<Award size={18} aria-hidden="true" />}
                      hint={`de ${data.achievements.length} disponíveis`}
                    />
                  </div>
                </div>
              </Card>

              {lastDone ? (
                <Notice tone="success" title={`Meta concluída: ${lastDone.title}`}>
                  <p>
                    A sequência continua ativa. O próximo passo da trilha é transformar a meta em
                    ganho de score.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/coach/simulador" className={buttonClass('secondary', 'sm')}>
                      Simular o efeito no score
                    </Link>
                    <Link to="/coach/missoes" className={buttonClass('ghost', 'sm')}>
                      Ver missões relacionadas
                    </Link>
                  </div>
                </Notice>
              ) : null}

              <Card>
                <CardHeader
                  eyebrow="GET /api/v1/coach/journey"
                  title="Sua trilha"
                  description="Cada etapa libera a seguinte. O impacto é uma estimativa para perfis semelhantes ao seu."
                />
                <ol className="grid gap-3">
                  {data.stages.map((stage, index) => (
                    <li
                      key={stage.id}
                      className={`relative flex gap-4 rounded-md border px-4 py-3 ${
                        stage.status === 'atual'
                          ? 'border-eqx-action bg-eqx-action/5'
                          : 'border-eqx-border'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-pill text-sm font-bold ${
                          stage.status === 'concluida'
                            ? 'bg-eqx-success text-white'
                            : stage.status === 'atual'
                              ? 'bg-eqx-action text-white'
                              : 'bg-eqx-surface-subtle text-eqx-text-muted'
                        }`}
                      >
                        {stage.status === 'concluida' ? (
                          <Check size={16} />
                        ) : stage.status === 'bloqueada' ? (
                          <Lock size={14} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{stage.title}</p>
                          <Badge
                            tone={
                              stage.status === 'concluida'
                                ? 'success'
                                : stage.status === 'atual'
                                  ? 'info'
                                  : 'neutral'
                            }
                          >
                            {stage.status === 'concluida'
                              ? 'concluída'
                              : stage.status === 'atual'
                                ? 'etapa atual'
                                : 'bloqueada'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-eqx-text-muted">{stage.description}</p>
                        <p className="mt-1 text-xs">
                          Impacto estimado: <strong>{stage.scoreImpact}</strong> · {stage.points}{' '}
                          pontos
                        </p>
                        {stage.status === 'atual' ? (
                          <Link
                            to="/coach/missoes"
                            className={`${buttonClass('secondary', 'sm')} mt-3`}
                          >
                            Agir nesta etapa
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <Card>
                  <CardHeader
                    eyebrow="POST /api/v1/coach/goals"
                    title="Metas desta semana"
                    description="Metas curtas mantêm a sequência ativa e valem pontos."
                    actions={<Target size={18} aria-hidden="true" />}
                  />
                  <ul className="grid gap-3">
                    {data.goals.map((goal) => (
                      <li
                        key={goal.goalId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-eqx-border px-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{goal.title}</p>
                          <p className="mt-1 text-sm text-eqx-text-muted">{goal.description}</p>
                          <div className="mt-2 max-w-xs">
                            <ProgressBar
                              label={`${goal.progress}/${goal.target} ${goal.unit}`}
                              value={goal.progress}
                              max={goal.target}
                              tone={goal.done ? 'success' : 'action'}
                            />
                          </div>
                          <p className="mt-1 text-xs text-eqx-text-muted">
                            Prazo {relativeFromNow(goal.dueAt)} · vale {goal.points} pontos
                          </p>
                        </div>
                        {goal.done ? (
                          <Badge tone="success">concluída</Badge>
                        ) : (
                          <Button size="sm" onClick={() => complete(goal)}>
                            Marcar como feita
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/coach/progress"
                    title="Conquistas"
                    description="Selos permanentes no seu histórico de evolução."
                  />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {data.achievements.map((achievement) => {
                      const unlocked = Boolean(achievement.unlockedAt);
                      return (
                        <li
                          key={achievement.achievementId}
                          className={`rounded-md border px-3 py-3 ${
                            unlocked
                              ? 'border-eqx-border bg-eqx-surface'
                              : 'border-dashed border-eqx-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Award
                              size={18}
                              aria-hidden="true"
                              className={unlocked ? 'text-eqx-accent-text' : 'text-eqx-text-muted'}
                            />
                            <Badge tone={rarityTone[achievement.rarity]}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-semibold">{achievement.title}</p>
                          <p className="mt-1 text-xs text-eqx-text-muted">
                            {achievement.description}
                          </p>
                          <p className="mt-2 text-xs">
                            {achievement.unlockedAt
                              ? `desbloqueada em ${formatDate(achievement.unlockedAt)}`
                              : 'ainda não desbloqueada'}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>

              <Notice tone="warning" title="Estimativas, não promessas">
                Os ganhos indicados são projeções baseadas em pessoas com histórico parecido.
                Nenhuma ação garante aumento de score, e o coach nunca cobra por melhoria de
                pontuação.
              </Notice>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
