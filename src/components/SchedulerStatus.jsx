import { useEffect, useMemo, useState } from 'react';
import './SchedulerStatus.css';

function formatKst(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export default function SchedulerStatus() {
  const repoFullName =
    import.meta.env.VITE_GITHUB_REPO?.trim() || 'wonhwi/festival';
  const workflowFile =
    import.meta.env.VITE_GITHUB_WORKFLOW_FILE?.trim() ||
    'auto-update-festivals.yml';

  const { owner, repo } = useMemo(() => {
    const [o, r] = repoFullName.split('/');
    return { owner: o, repo: r };
  }, [repoFullName]);

  const apiUrl = useMemo(() => {
    if (!owner || !repo) return '';
    return `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1`;
  }, [owner, repo, workflowFile]);

  const actionsUrl = useMemo(() => {
    if (!owner || !repo) return '';
    return `https://github.com/${owner}/${repo}/actions/workflows/${workflowFile}`;
  }, [owner, repo, workflowFile]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [run, setRun] = useState(null);

  useEffect(() => {
    if (!apiUrl) return;
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(apiUrl, {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        });
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
        const json = await res.json();
        const latest = json?.workflow_runs?.[0] || null;
        if (!cancelled) setRun(latest);
      } catch (e) {
        if (!cancelled) setError(e?.message || '불러오기 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLatest();

    // 가볍게 폴링(너무 자주 하면 rate limit 걸릴 수 있어 60초로 제한)
    const id = setInterval(fetchLatest, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [apiUrl]);

  const status = run?.status || '';
  const conclusion = run?.conclusion || '';
  const startedAt = run?.run_started_at || run?.created_at || '';
  const updatedAt = run?.updated_at || '';

  const badgeText = (() => {
    if (loading) return '불러오는 중';
    if (error) return '불러오기 실패';
    if (status === 'in_progress') return '실행 중';
    if (conclusion === 'success') return '성공';
    if (conclusion === 'failure') return '실패';
    if (conclusion) return conclusion;
    return status || '알 수 없음';
  })();

  const badgeTone = (() => {
    if (loading) return 'neutral';
    if (error) return 'danger';
    if (status === 'in_progress') return 'info';
    if (conclusion === 'success') return 'success';
    if (conclusion === 'failure') return 'danger';
    return 'neutral';
  })();

  return (
    <div className="scheduler-status" role="status" aria-live="polite">
      <div className="scheduler-left">
        <span className={`scheduler-badge ${badgeTone}`}>{badgeText}</span>
        <span className="scheduler-title">스케줄러(5분마다) 상태</span>
      </div>

      <div className="scheduler-meta">
        {error ? (
          <span className="scheduler-muted">
            GitHub Actions 정보를 가져오지 못했습니다.
          </span>
        ) : (
          <>
            <span className="scheduler-item">
              마지막 실행: <strong>{formatKst(startedAt) || '-'}</strong>
            </span>
            <span className="scheduler-item scheduler-muted">
              업데이트: {formatKst(updatedAt) || '-'}
            </span>
          </>
        )}
        {actionsUrl && (
          <a
            className="scheduler-link"
            href={actionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            실행 로그 보기
          </a>
        )}
      </div>
    </div>
  );
}

