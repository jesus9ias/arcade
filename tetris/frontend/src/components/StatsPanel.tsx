import { useTranslation } from 'react-i18next';
import { formatScore } from './format';

interface Props {
  level: number;
  score: number;
  linesCleared: number;
  remaining: number;
  language: string;
}

export function StatsPanel({ level, score, linesCleared, remaining, language }: Props) {
  const { t } = useTranslation();
  const rows: Array<[string, string]> = [
    [t('hud.level'), String(level)],
    [t('hud.score'), formatScore(score, language)],
    [t('hud.lines'), String(linesCleared)],
    [t('hud.remaining'), String(Math.max(0, Math.ceil(remaining)))],
  ];
  return (
    <div className="panel panel--magenta">
      {rows.map(([key, val]) => (
        <div className="stat-row" key={key}>
          <span className="stat-key">{key}</span>
          <span className="stat-val">{val}</span>
        </div>
      ))}
    </div>
  );
}
