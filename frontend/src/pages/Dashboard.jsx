import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.stats().then(setStats).catch(() => setError('Не удалось загрузить данные'));
  }, []);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!stats) return <div className="loading"><div className="spinner" /> Загрузка...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Дашборд</h1>
      </div>

      <div className="grid-3 mb-4">
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{stats.recipes}</div>
            <div className="stat-label">Рецептур</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🧪</div>
          <div>
            <div className="stat-value">{stats.materials}</div>
            <div className="stat-label">Спецификаций сырья</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📁</div>
          <div>
            <div className="stat-value">{stats.files}</div>
            <div className="stat-label">Файлов</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Последние рецептуры</span>
            <Link to="/recipes" className="btn btn-outline btn-sm">Все</Link>
          </div>
          {stats.recent_recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Рецептур пока нет</div>
              <Link to="/recipes/new" className="btn btn-primary btn-sm mt-2">Добавить</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Название</th><th>Категория</th><th>Изменено</th></tr>
              </thead>
              <tbody>
                {stats.recent_recipes.map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/recipes/${r.id}`}>{r.name}</Link></td>
                    <td>{r.category ? <span className="badge badge-blue">{r.category}</span> : '—'}</td>
                    <td className="text-muted text-sm">{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Последнее сырьё</span>
            <Link to="/materials" className="btn btn-outline btn-sm">Все</Link>
          </div>
          {stats.recent_materials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧪</div>
              <div className="empty-title">Сырья пока нет</div>
              <Link to="/materials/new" className="btn btn-primary btn-sm mt-2">Добавить</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Название</th><th>Поставщик</th><th>Изменено</th></tr>
              </thead>
              <tbody>
                {stats.recent_materials.map(m => (
                  <tr key={m.id}>
                    <td><Link to={`/materials/${m.id}`}>{m.name}</Link></td>
                    <td className="text-muted text-sm">{m.supplier || '—'}</td>
                    <td className="text-muted text-sm">{formatDate(m.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
