import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/materials/${id}`).then(setMaterial).catch(() => setError('Не удалось загрузить спецификацию'));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Удалить спецификацию "${material.name}"?`)) return;
    await api.delete(`/materials/${id}`);
    navigate('/materials');
  };

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!material) return <div className="loading"><div className="spinner" /> Загрузка...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="text-muted text-sm mb-4">
            <Link to="/materials">← Спецификации сырья</Link>
          </div>
          <h1 className="page-title">{material.name}</h1>
          {material.standard && (
            <span className="badge badge-green" style={{ marginTop: 6, display: 'inline-block' }}>
              {material.standard}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/materials/${id}/edit`} className="btn btn-outline">Редактировать</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Удалить</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="detail-section-title">Основная информация</div>
            <div className="detail-grid">
              {material.code && (
                <>
                  <span className="detail-label">Код / Артикул</span>
                  <span className="detail-value">{material.code}</span>
                </>
              )}
              {material.supplier && (
                <>
                  <span className="detail-label">Поставщик</span>
                  <span className="detail-value">{material.supplier}</span>
                </>
              )}
              {material.standard && (
                <>
                  <span className="detail-label">НД (ГОСТ / ТУ)</span>
                  <span className="detail-value">{material.standard}</span>
                </>
              )}
              {material.shelf_life && (
                <>
                  <span className="detail-label">Срок годности</span>
                  <span className="detail-value">{material.shelf_life}</span>
                </>
              )}
              {material.storage_conditions && (
                <>
                  <span className="detail-label">Условия хранения</span>
                  <span className="detail-value">{material.storage_conditions}</span>
                </>
              )}
            </div>
          </div>

          {material.description && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="detail-section-title">Описание</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{material.description}</p>
            </div>
          )}

          {material.files.length > 0 && (
            <div className="card">
              <div className="detail-section-title">Прикреплённые файлы ({material.files.length})</div>
              {material.files.map(f => (
                <div key={f.id} className="flex items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>📄</span>
                  <span className="flex-1">{f.original_name}</span>
                  <span className="text-muted text-sm">{fileSize(f.size)}</span>
                  <a href={api.downloadUrl(f.id)} className="btn btn-outline btn-sm" download>
                    Скачать
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="detail-section-title">
            Показатели качества ({material.parameters.length})
          </div>
          {material.parameters.length === 0 ? (
            <div className="text-muted text-sm">Показатели не указаны</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>Значение</th>
                  <th>Ед.</th>
                  <th>Норма</th>
                </tr>
              </thead>
              <tbody>
                {material.parameters.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.parameter_name}</td>
                    <td>{p.value || '—'}</td>
                    <td className="text-muted">{p.unit || '—'}</td>
                    <td className="text-muted text-sm">{p.norm || '—'}</td>
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
