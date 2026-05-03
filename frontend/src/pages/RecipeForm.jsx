import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const UNITS = ['кг', 'г', 'л', 'мл', 'шт', 'упак', '%', 'г/л', 'мг/кг', 'ед.'];
const TEMP_UNITS = ['°C', '°F', 'К'];

function emptyIngredient() { return { material_name: '', amount: '', unit: 'кг' }; }
function emptyStep() { return { description: '', duration_min: '', temperature: '', temperature_unit: '°C' }; }

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', category: '', description: '', yield_amount: '', yield_unit: 'кг', notes: '',
    ingredients: [emptyIngredient()],
    steps: [emptyStep()],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/recipes/${id}`).then(data => {
        setForm({
          name: data.name,
          category: data.category || '',
          description: data.description || '',
          yield_amount: data.yield_amount ?? '',
          yield_unit: data.yield_unit || 'кг',
          notes: data.notes || '',
          ingredients: data.ingredients.length ? data.ingredients.map(i => ({
            material_name: i.material_name,
            amount: i.amount ?? '',
            unit: i.unit,
          })) : [emptyIngredient()],
          steps: data.steps.length ? data.steps.map(s => ({
            description: s.description,
            duration_min: s.duration_min ?? '',
            temperature: s.temperature ?? '',
            temperature_unit: s.temperature_unit || '°C',
          })) : [emptyStep()],
        });
      }).catch(() => setError('Не удалось загрузить рецептуру'));
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setIngredient = (i, field, value) => setForm(f => {
    const ingredients = [...f.ingredients];
    ingredients[i] = { ...ingredients[i], [field]: value };
    return { ...f, ingredients };
  });

  const setStep = (i, field, value) => setForm(f => {
    const steps = [...f.steps];
    steps[i] = { ...steps[i], [field]: value };
    return { ...f, steps };
  });

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }));
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, emptyStep()] }));
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Введите название рецептуры'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        yield_amount: form.yield_amount ? parseFloat(form.yield_amount) : null,
        ingredients: form.ingredients.filter(i => i.material_name.trim()).map(i => ({
          ...i,
          amount: i.amount ? parseFloat(i.amount) : null,
        })),
        steps: form.steps.filter(s => s.description.trim()).map(s => ({
          ...s,
          duration_min: s.duration_min ? parseInt(s.duration_min) : null,
          temperature: s.temperature ? parseFloat(s.temperature) : null,
        })),
      };
      if (isEdit) {
        await api.put(`/recipes/${id}`, payload);
        navigate(`/recipes/${id}`);
      } else {
        const { id: newId } = await api.post('/recipes', payload);
        navigate(`/recipes/${newId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="text-muted text-sm mb-4">
            <Link to={isEdit ? `/recipes/${id}` : '/recipes'}>
              ← {isEdit ? 'К рецептуре' : 'Рецептуры'}
            </Link>
          </div>
          <h1 className="page-title">{isEdit ? 'Редактирование рецептуры' : 'Новая рецептура'}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Основная информация</div>
          <div className="form-row">
            <div className="form-group">
              <label>Название *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Название рецептуры" />
            </div>
            <div className="form-group">
              <label>Категория</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="Колбасы, Консервы, Хлеб..." />
            </div>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Краткое описание продукта" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Выход готовой продукции</label>
              <input type="number" step="0.001" value={form.yield_amount} onChange={e => set('yield_amount', e.target.value)} placeholder="100" />
            </div>
            <div className="form-group">
              <label>Единица измерения выхода</label>
              <select value={form.yield_unit} onChange={e => set('yield_unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Примечания</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Дополнительные замечания, особые условия..." rows={3} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Состав (рецептура)</div>
          <table className="sub-table">
            <thead>
              <tr>
                <th style={{ width: 30, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>#</th>
                <th style={{ paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Наименование сырья</th>
                <th style={{ width: 120, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Количество</th>
                <th style={{ width: 100, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Ед.</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.ingredients.map((ing, i) => (
                <tr key={i}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td>
                    <input
                      value={ing.material_name}
                      onChange={e => setIngredient(i, 'material_name', e.target.value)}
                      placeholder="Название сырья или ингредиента"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.001"
                      value={ing.amount}
                      onChange={e => setIngredient(i, 'amount', e.target.value)}
                      placeholder="0.000"
                    />
                  </td>
                  <td>
                    <select value={ing.unit} onChange={e => setIngredient(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="remove-row-btn" onClick={() => removeIngredient(i)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="add-row-btn" onClick={addIngredient}>+ Добавить ингредиент</button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Технологический процесс</div>
          {form.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <div className="step-num" style={{ marginTop: 4, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={step.description}
                  onChange={e => setStep(i, 'description', e.target.value)}
                  placeholder="Описание технологического этапа..."
                  rows={2}
                  style={{ marginBottom: 6 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={step.duration_min}
                      onChange={e => setStep(i, 'duration_min', e.target.value)}
                      placeholder="Время (мин)"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      step="0.1"
                      value={step.temperature}
                      onChange={e => setStep(i, 'temperature', e.target.value)}
                      placeholder="Температура"
                    />
                  </div>
                  <div style={{ width: 80 }}>
                    <select value={step.temperature_unit} onChange={e => setStep(i, 'temperature_unit', e.target.value)}>
                      {TEMP_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button type="button" className="remove-row-btn" style={{ marginTop: 4 }} onClick={() => removeStep(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addStep}>+ Добавить этап</button>
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="btn btn-outline">Отмена</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать рецептуру')}
          </button>
        </div>
      </form>
    </div>
  );
}
