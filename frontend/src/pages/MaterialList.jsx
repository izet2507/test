import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function MaterialList() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      setMaterials(await api.get(`/materials?${params}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const deleteMaterial = async (id, name) => {
    if (!confirm(`Удалить спецификацию "${name}"?`)) return;
    await api.delete(`/materials/${id}`);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Спецификации сырья</h1>
        <Link to="/materials/new" className="btn btn-primary">+ Новая спецификация</Link>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Поиск по названию, коду, поставщику..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Сбросить</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /> Загрузка...</div>
        ) : materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧪</div>
            <div className="empty-title">{search ? 'Ничего не найдено' : 'Спецификаций пока нет'}</div>
            {!search && (
              <Link to="/materials/new" className="btn btn-primary btn-sm mt-2">Добавить первую спецификацию</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Код</th>
                  <th>Поставщик</th>
                  <th>НД (ГОСТ / ТУ)</th>
                  <th>Изменено</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/materials/${m.id}`)}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td className="text-muted text-sm">{m.code || '—'}</td>
                    <td className="text-muted">{m.supplier || '—'}</td>
                    <td>
                      {m.standard
                        ? <span className="badge badge-green">{m.standard}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(m.updated_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        <Link to={`/materials/${m.id}/edit`} className="btn btn-outline btn-sm">Изменить</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMaterial(m.id, m.name)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
