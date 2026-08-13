'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { productTypesApi, ProductType, CreateProductTypeDto } from '@/services/productTypes';
import { categoriesApi, Category } from '@/services/categories';
import Dropdown from '@/components/ui/Dropdown';
import { dropdownUtils } from '@/hooks/useDropdown';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';

const QUICK_UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'dozen', 'pack', 'bunch', 'box', 'bottle', 'jar'];
const QUICK_COLORS = [
  { label: 'Green',  value: '#10B981' },
  { label: 'Orange', value: '#F59E0B' },
  { label: 'Blue',   value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Red',    value: '#EF4444' },
  { label: 'Pink',   value: '#EC4899' },
];

const EMPTY_FORM: CreateProductTypeDto = {
  displayName: '',
  description: '',
  categoryId: '',
  units: [],
  isActive: true,
  sortOrder: 0,
  color: '#10B981',
};

export default function ProductTypesManagement() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [formData, setFormData] = useState<CreateProductTypeDto>(EMPTY_FORM);
  const [unitInput, setUnitInput] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { loadProductTypes(); loadCategories(); }, []);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      setProductTypes(await productTypesApi.getAll());
    } catch { toast.error('Failed to load product types'); }
    finally { setLoading(false); }
  };

  const loadCategories = async () => {
    try { setCategories(await categoriesApi.getAll()); } catch { /* silent */ }
  };

  const openCreate = () => {
    setEditingType(null);
    setFormData(EMPTY_FORM);
    setCategoryId('');
    setUnitInput('');
    setShowForm(true);
  };

  const handleEdit = (pt: ProductType) => {
    setEditingType(pt);
    setFormData({
      displayName: pt.displayName,
      description: pt.description || '',
      categoryId: pt.categoryId || '',
      units: pt.units || [],
      isActive: pt.isActive,
      sortOrder: pt.sortOrder,
      color: pt.color || '#10B981',
    });
    setCategoryId(pt.categoryId || '');
    setUnitInput('');
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData(EMPTY_FORM);
    setCategoryId('');
    setUnitInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { toast.error('Please select a category'); return; }
    try {
      const payload = { ...formData, categoryId };
      if (editingType) {
        await productTypesApi.update(editingType.id, payload);
        toast.success('Product type updated');
      } else {
        await productTypesApi.create(payload);
        toast.success('Product type created');
      }
      await loadProductTypes();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product type');
    }
  };

  const addUnit = (unit: string) => {
    const u = unit.trim();
    if (u && !(formData.units || []).includes(u)) {
      setFormData(prev => ({ ...prev, units: [...(prev.units || []), u] }));
    }
  };

  const removeUnit = (idx: number) =>
    setFormData(prev => ({ ...prev, units: (prev.units || []).filter((_, i) => i !== idx) }));

  const handleDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await productTypesApi.delete(pendingDelete.id);
      toast.success('Product type deleted');
      await loadProductTypes();
    } catch (err: any) {
      toast.error(err.message || 'Cannot delete — products may be using this type');
    } finally {
      setShowConfirmDialog(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Types"
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Products', href: '/admin/products' }, { label: 'Types' }]}
        action={
          <button onClick={openCreate} className="btn-primary text-sm px-4 py-2">
            + Add Type
          </button>
        }
      />

      {/* List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Units</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)
            ) : productTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 relative opacity-30">
                      <Image src="/images/logo.png" alt="" fill className="object-contain" />
                    </div>
                    <p>No product types yet. Create your first one.</p>
                  </div>
                </td>
              </tr>
            ) : (
              productTypes.map(type => (
                <tr key={type.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: type.color || '#6B7280' }}
                      >
                        {type.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{type.displayName}</div>
                        {type.description && <div className="text-xs text-neutral-400 truncate max-w-xs">{type.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {categories.find(c => c.id === type.categoryId)?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(type.units || []).length > 0
                        ? (type.units || []).map((u, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">{u}</span>
                          ))
                        : <span className="text-xs text-neutral-400">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      type.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => handleEdit(type)} className="text-orange-600 hover:text-orange-800 px-2 py-1 rounded hover:bg-orange-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(type.id, type.displayName)} className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Right-side drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-40" onClick={resetForm} />
          <div className="w-full max-w-md bg-white flex flex-col shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingType ? 'Edit Product Type' : 'New Product Type'}
              </h3>
              <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} id="pt-form" className="p-6 space-y-5">

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={dropdownUtils.toOptions(categories)}
                    value={categoryId}
                    onChange={v => setCategoryId(v as string)}
                    placeholder="Select category"
                    searchable={false}
                    clearable={false}
                    variant="default"
                    size="md"
                    className="w-full"
                    showCheckmark={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    placeholder="e.g. Chaunsa Mango, Buffalo Milk"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-none"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                      className="w-10 h-8 border border-neutral-300 rounded cursor-pointer p-0.5"
                    />
                    <div className="flex gap-1.5">
                      {QUICK_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          onClick={() => setFormData(p => ({ ...p, color: c.value }))}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            formData.color === c.value ? 'border-neutral-700 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Selling Units</label>
                  {(formData.units || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(formData.units || []).map((u, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                          {u}
                          <button type="button" onClick={() => removeUnit(i)} className="text-primary-400 hover:text-primary-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={unitInput}
                      onChange={e => setUnitInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addUnit(unitInput); setUnitInput(''); }
                      }}
                      placeholder="Type a unit and press Enter"
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    />
                    <button
                      type="button"
                      onClick={() => { addUnit(unitInput); setUnitInput(''); }}
                      className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_UNITS.map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => addUnit(u)}
                        disabled={(formData.units || []).includes(u)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          (formData.units || []).includes(u)
                            ? 'bg-primary-50 text-primary-400 border-primary-100 cursor-default'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-neutral-100" />

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                    <p className="text-xs text-neutral-400">Available for creating products</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 ${
                      formData.isActive ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50 flex-shrink-0">
              <button type="button" onClick={resetForm}
                className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="pt-form"
                className="btn-primary text-sm px-5 py-2">
                {editingType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setPendingDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Product Type"
        message={`Delete "${pendingDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
