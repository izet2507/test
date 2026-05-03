import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import RecipeForm from './pages/RecipeForm';
import MaterialList from './pages/MaterialList';
import MaterialDetail from './pages/MaterialDetail';
import MaterialForm from './pages/MaterialForm';
import FileManager from './pages/FileManager';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="/materials" element={<MaterialList />} />
          <Route path="/materials/new" element={<MaterialForm />} />
          <Route path="/materials/:id" element={<MaterialDetail />} />
          <Route path="/materials/:id/edit" element={<MaterialForm />} />
          <Route path="/files" element={<FileManager />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
