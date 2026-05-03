import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/recipes/${id}`).then(setRecipe).catch(() => setError('Не удалось загрузить рецептуру'));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Удалить рецептуру "${recipe.name}"?`)) return;
    await api.delete(`/recipes/${id}`);
    navigate('/recipes');
  };

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!recipe) return <div className="loading"><div className="spinner" /> Загрузка...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="text-muted text-sm mb-4">
            <Link to="/recipes">← Рецептуры</Link>
          </div>
          <h1 className="page-title">{recipe.name}</h1>
          {recipe.category && (
            <span className="badge badge-blue" style={{ marginTop: 6, display: 'inline-block' }}>
              {recipe.category}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/recipes/${id}/edit`} className="btn btn-outline">Редактировать</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Удалить</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          {recipe.description && (
            <div className="card detail-section" style={{ marginBottom: 16 }}>
              <div className="detail-section-title">Описание</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.description}</p>
            </div>
          )}

          <div className="card detail-section" style={{ marginBottom: 16 }}>
            <div className="detail-section-title">Параметры</div>
            <div className="detail-grid">
              <span className="detail-label">Выход готовой продукции</span>
              <span className="detail-value">
                {recipe.yield_amount ? `${recipe.yield_amount} ${recipe.yield_unit}` : '—'}
              </span>
            </div>
          </div>

          {recipe.notes && (
            <div className="card detail-section" style={{ marginBottom: 16 }}>
              <div className="detail-section-title">Примечания</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.notes}</p>
            </div>
          )}

          {recipe.files.length > 0 && (
            <div className="card">
              <div className="detail-section-title">Прикреплённые файлы ({recipe.files.length})</div>
              {recipe.files.map(f => (
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

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="detail-section-title">
              Состав ({recipe.ingredients.length} ингредиентов)
            </div>
            {recipe.ingredients.length === 0 ? (
              <div className="text-muted text-sm">Ингредиенты не указаны</div>
            ) : (
              <table>
                <thead>
                  <tr><th>#</th><th>Наименование</th><th>Количество</th><th>Ед.</th></tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing, i) => (
                    <tr key={ing.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td>{ing.material_name}</td>
                      <td>{ing.amount ?? '—'}</td>
                      <td className="text-muted">{ing.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="detail-section-title">
              Технологический процесс ({recipe.steps.length} этапов)
            </div>
            {recipe.steps.length === 0 ? (
              <div className="text-muted text-sm">Этапы не указаны</div>
            ) : (
              <ul className="steps-list">
                {recipe.steps.map(step => (
                  <li key={step.id} className="step-item">
                    <div className="step-num">{step.step_number}</div>
                    <div>
                      <div>{step.description}</div>
                      <div className="step-meta">
                        {step.duration_min && <span>{step.duration_min} мин</span>}
                        {step.duration_min && step.temperature && <span> · </span>}
                        {step.temperature && <span>{step.temperature}{step.temperature_unit}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
