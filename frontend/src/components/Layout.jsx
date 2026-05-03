import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api';

function NavItem({ to, icon, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
      <span className="icon">{icon}</span>
      {children}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef();
  const timerRef = useRef();

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults(null); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(val.trim());
        setResults(data);
      } catch {
        setResults(null);
      }
    }, 300);
  };

  const goTo = (path) => {
    setResults(null);
    setQuery('');
    navigate(path);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setResults(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults = results && (results.recipes.length || results.materials.length || results.files.length);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Агрегатор рецептур</h1>
          <p>Технологические данные</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Обзор</div>
          <NavItem to="/dashboard" icon="📊">Дашборд</NavItem>
          <div className="nav-section-title" style={{ marginTop: 8 }}>База данных</div>
          <NavItem to="/recipes" icon="📋">Рецептуры</NavItem>
          <NavItem to="/materials" icon="🧪">Сырьё</NavItem>
          <NavItem to="/files" icon="📁">Файлы</NavItem>
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <div className="search-wrap" ref={searchRef}>
            <input
              className="search-input"
              placeholder="Поиск по рецептурам, сырью, файлам..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
            {results && (
              <div className="search-results">
                {!hasResults && (
                  <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Ничего не найдено
                  </div>
                )}
                {results.recipes.length > 0 && (
                  <>
                    <div className="search-group-title">Рецептуры</div>
                    {results.recipes.map(r => (
                      <div key={r.id} className="search-result-item" onClick={() => goTo(`/recipes/${r.id}`)}>
                        <span>📋</span>
                        <span>{r.name}</span>
                        {r.category && <span className="badge badge-blue">{r.category}</span>}
                      </div>
                    ))}
                  </>
                )}
                {results.materials.length > 0 && (
                  <>
                    <div className="search-group-title">Сырьё</div>
                    {results.materials.map(m => (
                      <div key={m.id} className="search-result-item" onClick={() => goTo(`/materials/${m.id}`)}>
                        <span>🧪</span>
                        <span>{m.name}</span>
                        {m.supplier && <span className="text-muted text-sm">— {m.supplier}</span>}
                      </div>
                    ))}
                  </>
                )}
                {results.files.length > 0 && (
                  <>
                    <div className="search-group-title">Файлы</div>
                    {results.files.map(f => (
                      <div key={f.id} className="search-result-item" onClick={() => goTo('/files')}>
                        <span>📄</span>
                        <span>{f.original_name}</span>
                        {f.category && <span className="badge badge-gray">{f.category}</span>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
