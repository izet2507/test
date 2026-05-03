import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function emptyParam() { return { parameter_name: '', value: '', unit: '', norm: '' }; }

export default function MaterialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', code: '', supplier: '', standard: '', description: '',
    storage_conditions: '', shelf_life: '',
    parameters: [emptyParam()],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/materials/${id}`).then(data => {
        setForm({
          name: data.name,
          code: data.code || '',
          supplier: data.supplier || '',
          standard: data.standard || '',
          description: data.description || '',
          storage_conditions: data.storage_conditions || '',
          shelf_life: data.shelf_life || '',
          parameters: data.parameters.length ? data.parameters.map(p => ({
            parameter_name: p.parameter_name,
            value: p.value || '',
            unit: p.unit || '',
            norm: p.norm || '',
          })) : [emptyParam()],
        });
      }).catch(() => setError('Не удалось загрузить данные'));
    }
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setParam = (i, field, value) => setForm(f => {
    const parameters = [...f.parameters];
    parameters[i] = { ...parameters[i], [field]: value };
    return { ...f, parameters };
  });

  const addParam = () => setForm(f => ({ ...f, parameters: [...f.parameters, emptyParam()] }));
  const removeParam = (i) => setForm(f => ({ ...f, parameters: f.parameters.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Введите наименование сырья'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        parameters: form.parameters.filter(p => p.parameter_name.trim()),
      };
      if (isEdit) {
        await api.put(`/materials/${id}`, payload);
        navigate(`/materials/${id}`);
      } else {
        const { id: newId } = await api.post('/materials', payload);
        navigate(`/materials/${newId}`);
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
            <Link to={isEdit ? `/materials/${id}` : '/materials'}>
              ← {isEdit ? 'К спецификации' : 'Спецификации сырья'}
            </Link>
          </div>
          <h1 className="page-title">{isEdit ? 'Редактирование спецификации' : 'Новая спецификация сырья'}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Основная информация</div>
          <div className="form-row">
            <div className="form-group">
              <label>Наименование сырья *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Мука пшеничная высший сорт" />
            </div>
            <div className="form-group">
              <label>Код / Артикул</label>
              <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="01-МП-001" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Поставщик</label>
              <input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="ООО Поставщик" />
            </div>
            <div className="form-group">
              <label>НД (ГОСТ / ТУ / СТО)</label>
              <input value={form.standard} onChange={e => set('standard', e.target.value)} placeholder="ГОСТ 26574-2017" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Срок годности</label>
              <input value={form.shelf_life} onChange={e => set('shelf_life', e.target.value)} placeholder="12 месяцев при t° +20°C" />
            </div>
            <div className="form-group">
              <label>Условия хранения</label>
              <input value={form.storage_conditions} onChange={e => set('storage_conditions', e.target.value)} placeholder="t° +5...+25°C, ОВВ не выше 75%" />
            </div>
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Дополнительная информация о сырье..." />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Показатели качества</div>
          <table className="sub-table">
            <thead>
              <tr>
                <th style={{ paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Показатель</th>
                <th style={{ width: 130, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Значение</th>
                <th style={{ width: 90, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Ед.изм.</th>
                <th style={{ width: 160, paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Норма (по НД)</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.parameters.map((p, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={p.parameter_name}
                      onChange={e => setParam(i, 'parameter_name', e.target.value)}
                      placeholder="Влажность, Белок, pH..."
                    />
                  </td>
                  <td>
                    <input
                      value={p.value}
                      onChange={e => setParam(i, 'value', e.target.value)}
                      placeholder="14.5"
                    />
                  </td>
                  <td>
                    <input
                      value={p.unit}
                      onChange={e => setParam(i, 'unit', e.target.value)}
                      placeholder="%"
                    />
                  </td>
                  <td>
                    <input
                      value={p.norm}
                      onChange={e => setParam(i, 'norm', e.target.value)}
                      placeholder="не более 15%"
                    />
                  </td>
                  <td>
                    <button type="button" className="remove-row-btn" onClick={() => removeParam(i)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="add-row-btn" onClick={addParam}>+ Добавить показатель</button>
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <Link to={isEdit ? `/materials/${id}` : '/materials'} className="btn btn-outline">Отмена</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать спецификацию')}
          </button>
        </div>
      </form>
    </div>
  );
}
