/**
 * Lightweight client-side router using the browser History API.
 * Drop-in replacement for react-router-dom's core API:
 *   <Router>, <Route>, <Link>, <Navigate>, useNavigate, useSearchParams
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────
const RouterContext = createContext({});

// ─── Router Provider ──────────────────────────────────────────────────────────
export function Router({ children }) {
  const [location, setLocation] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
    state: window.history.state?._routerState || null,
  });

  useEffect(() => {
    const onPop = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        state: window.history.state?._routerState || null,
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    // Support both navigate(path) and navigate(path, { state, replace })
    const routerState = options.state || null;
    const historyState = routerState ? { _routerState: routerState } : {};
    if (options.replace) {
      window.history.replaceState(historyState, '', to);
    } else {
      window.history.pushState(historyState, '', to);
    }
    setLocation({
      pathname: window.location.pathname,
      search: window.location.search,
      state: routerState,
    });
  }, []);

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useLocation() {
  // Returns { pathname, search, state } — state is whatever was passed via navigate(path, { state })
  return useContext(RouterContext).location;
}

export function useSearchParams() {
  const { location } = useContext(RouterContext);
  const params = new URLSearchParams(location.search);
  return [params];
}

// ─── Components ───────────────────────────────────────────────────────────────
export function Link({ to, children, className = '', onClick }) {
  const { navigate } = useContext(RouterContext);
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export function Navigate({ to, replace = false }) {
  const { navigate } = useContext(RouterContext);
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

// ─── Routes & Route ──────────────────────────────────────────────────────────
export function Routes({ children }) {
  const { location } = useContext(RouterContext);
  const pathname = location.pathname;

  // Find matching route
  let matched = null;
  React.Children.forEach(children, (child) => {
    if (matched || !child) return;
    const { path } = child.props;
    if (path === '*') {
      matched = matched || child;
    } else if (matchPath(path, pathname)) {
      matched = child;
    }
  });

  return matched || null;
}

export function Route({ path, element }) {
  return element;
}

function matchPath(pattern, pathname) {
  // Normalize: strip trailing slash (except root)
  const norm = (p) => (p !== '/' ? p.replace(/\/$/, '') : p);
  return norm(pattern) === norm(pathname);
}
