import type { Request, Config, RouteConfig, EngineResult, Rejection, TraceStep } from './types';

export function execute(request: Request, config: Config): EngineResult {
  const trace: TraceStep[] = [];
  const rejections: Rejection[] = [];

  const host = request.host.toLowerCase();
  trace.push({ step: 'host', result: 'normalized', reason: `host: ${host}` });

  const matched: RouteConfig[] = [];
  for (const route of config.routes) {
    const reason = matchRoute(request, route);
    if (reason === null) {
      matched.push(route);
    } else {
      rejections.push({ route: `${route.type} ${route.path} → ${route.service}`, reason });
    }
  }

  if (matched.length === 0) {
    trace.push({ step: 'route', result: 'no_match', reason: 'no routes matched the request' });
    return { trace, rejections, error: 'NO_MATCH' };
  }

  const selected = rankRoutes(matched);
  trace.push({
    step: 'route',
    result: 'matched',
    reason: `${selected.type} "${selected.path}" → ${selected.service}`,
  });

  return {
    selected: { route: `${selected.type} ${selected.path}`, service: selected.service },
    trace,
    rejections,
  };
}

function matchRoute(req: Request, route: RouteConfig): string | null {
  if (!matchPath(req.path, route)) {
    return 'path mismatch';
  }
  return null;
}

function matchPath(requestPath: string, route: RouteConfig): boolean {
  switch (route.type) {
    case 'exact':
      return requestPath === route.path;
    case 'prefix':
      return requestPath.startsWith(route.path);
    default:
      return false;
  }
}

function rankRoutes(routes: RouteConfig[]): RouteConfig {
  let best = routes[0];
  let bestScore = scoreRoute(best);

  for (let i = 1; i < routes.length; i++) {
    const s = scoreRoute(routes[i]);
    if (s > bestScore) {
      best = routes[i];
      bestScore = s;
    }
  }

  return best;
}

function scoreRoute(r: RouteConfig): number {
  let score = 0;
  score += r.type === 'exact' ? 10 : 5;
  score += r.path.length;
  return score;
}
