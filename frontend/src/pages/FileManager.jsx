import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

function fileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function fileIcon(mime) {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.endsWith('.xlsx')) return '📊';
  if (mime.includes('word') || mime.endsWith('.docx')) return '📝';
  return '📄';
}

const FILE_CATEGORIES = ['Общее', 'Рецептуры', 'Спецификации', 'Сертификаты', 'НД (ГОСТ/ТУ)', 'Протоколы', 'Прочее'];

function UploadModal({ onClose, onUploaded, recipes, materials }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Общее');
  const [description, setDescription] = useState('');
  const [linkedRecipeId, setLinkedRecipeId] = useState('');
  const [linkedMaterialId, setLinkedMaterialId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (f) => { if (f) setFile(f); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Выберите файл'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('description', description);
      if (linkedRecipeId) fd.append('linked_recipe_id', linkedRecipeId);
      if (linkedMaterialId) fd.append('linked_material_id', linkedMaterialId);
      await api.uploadFile(fd);
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Загрузить файл</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div
              className={`drop-zone ${dragging ? 'drag-over' : ''}`}
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{ marginBottom: 16 }}
            >
              <input ref={inputRef} type="file" onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{fileIcon(file.type)}</div>
                  <div style={{ fontWeight: 500 }}>{file.name}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{fileSize(file.size)}</div>
                </>
              ) : (
                <>
                  <div className="file-icon">📂</div>
                  <div style={{ fontWeight: 500 }}>Перетащите файл сюда или нажмите для выбора</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Любые форматы, до 50 МБ</div>
                </>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Категория</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Необязательное описание" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Связать с рецептурой</label>
                <select value={linkedRecipeId} onChange={e => setLinkedRecipeId(e.target.value)}>
                  <option value="">— не выбрано —</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Связать со сырьём</label>
                <select value={linkedMaterialId} onChange={e => setLinkedMaterialId(e.target.value)}>
                  <option value="">— не выбрано —</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const [data, cats] = await Promise.all([
        api.get(`/files?${params}`),
        api.get('/files/categories'),
      ]);
      setFiles(data);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/recipes/categories').catch(() => []),
      api.get('/materials/names').catch(() => []),
    ]).then(([, mats]) => {
      setMaterials(mats);
    });
    api.get('/recipes').then(r => setRecipes(r)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [search, category]);

  const deleteFile = async (id, name) => {
    if (!confirm(`Удалить файл "${name}"?`)) return;
    await api.delete(`/files/${id}`);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Файлы</h1>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Загрузить файл</button>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Поиск по названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || category) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCategory(''); }}>Сбросить</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /> Загрузка...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-title">{search || category ? 'Ничего не найдено' : 'Файлов пока нет'}</div>
            {!search && !category && (
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowUpload(true)}>
                Загрузить первый файл
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Файл</th>
                  <th>Категория</th>
                  <th>Размер</th>
                  <th>Привязан к</th>
                  <th>Загружен</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 18 }}>{fileIcon(f.mime_type)}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{f.original_name}</div>
                          {f.description && <div className="text-muted text-sm">{f.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {f.category && <span className="badge badge-gray">{f.category}</span>}
                    </td>
                    <td className="text-muted text-sm">{fileSize(f.size)}</td>
                    <td className="text-sm">
                      {f.recipe_name && (
                        <Link to={`/recipes/${f.linked_recipe_id}`} className="badge badge-blue">
                          📋 {f.recipe_name}
                        </Link>
                      )}
                      {f.material_name && (
                        <Link to={`/materials/${f.linked_material_id}`} className="badge badge-green" style={{ marginLeft: 4 }}>
                          🧪 {f.material_name}
                        </Link>
                      )}
                      {!f.recipe_name && !f.material_name && <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(f.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <div className="table-actions">
                        <a href={api.downloadUrl(f.id)} className="btn btn-outline btn-sm" download>
                          Скачать
                        </a>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteFile(f.id, f.original_name)}>
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

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={load}
          recipes={recipes}
          materials={materials}
        />
      )}
    </div>
  );
}
