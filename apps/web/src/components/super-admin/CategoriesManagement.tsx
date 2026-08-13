'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { categoriesApi, Category, CreateCategoryDto } from '@/services/categories';
import Icon from '@/components/ui/Icon';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    image: '',
    active: true,
    sortOrder: 0,
  });

  // File selected locally — uploaded to Cloudinary only when Save is clicked
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string>('');
  const pendingImagePreviewRef = useRef('');
  pendingImagePreviewRef.current = pendingImagePreview;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Revoke pending blob URL if the component unmounts before the form is saved or cancelled
  useEffect(() => () => {
    if (pendingImagePreviewRef.current) URL.revokeObjectURL(pendingImagePreviewRef.current);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trimmedName = formData.name.trim();
      if (!trimmedName) return;
      if (isDuplicateName) return;

      // Upload pending file to Cloudinary now (on Save, not on select)
      let imageUrl = formData.image;
      if (pendingImageFile) {
        const fd = new FormData();
        fd.append('file', pendingImageFile);
        const res = await fetch('/api/v1/products/upload-image', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) { toast.error('Image upload failed'); return; }
        const data = await res.json();
        imageUrl = data.data?.url || data.url;
      }

      const payload = { ...formData, name: trimmedName, image: imageUrl };
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, payload);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(payload);
        toast.success('Category created');
      }
      await loadCategories();
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    // Clear any pending file from a previous session before opening a new edit form
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImageFile(null);
    setPendingImagePreview('');

    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      active: category.active,
      sortOrder: category.sortOrder,
    });
    setIsDuplicateName(false);
    setNameTouched(false);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await categoriesApi.delete(pendingDelete.id);
      toast.success('Category deleted');
      await loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setShowConfirmDialog(false);
      setPendingDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setPendingDelete(null);
  };

  const resetForm = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImageFile(null);
    setPendingImagePreview('');
    setFormData({ name: '', description: '', image: '', active: true, sortOrder: 0 });
    setIsDuplicateName(false);
    setNameTouched(false);
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Products', href: '/admin/products' }, { label: 'Categories' }]}
        action={
          <button onClick={() => { setEditingCategory(null); setShowForm(true); }} className="btn-primary text-sm px-4 py-2">
            + Add Category
          </button>
        }
      />

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">All Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-16 w-16 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          sizes="64px"
                          className="object-contain opacity-50"
                        />
                      </div>
                      <p className="font-['Open_Sans']">No categories available. Add your first organic product category!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {category.image ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={category.image}
                              alt={category.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-400 to-green-400 flex items-center justify-center text-white text-sm font-bold">
                              {category.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">{category.name}</div>
                          <div className="text-sm text-neutral-500">ID: {category.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {category.sortOrder}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="inline-flex items-center px-3 py-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-md transition-colors"
                        title="Edit category"
                      >
                        <Icon name="edit" className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete category"
                      >
                        <Icon name="delete" className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-side drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black bg-opacity-40" onClick={resetForm} />

          {/* Panel */}
          <div className="w-full max-w-md bg-white flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-600">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} id="cat-form" className="p-6 space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFormData({ ...formData, name: next });
                      const normalizedNext = next.trim().toLowerCase();
                      const normalizedCurrent = editingCategory?.name?.trim().toLowerCase();
                      const duplicate = categories.some(
                        c => c.name.trim().toLowerCase() === normalizedNext &&
                             (!editingCategory || c.id !== editingCategory.id)
                      );
                      setIsDuplicateName(duplicate);
                    }}
                    onBlur={() => setNameTouched(true)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors ${
                      isDuplicateName && nameTouched
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                        : 'border-neutral-300'
                    }`}
                    placeholder="e.g., Fresh Produce, Dairy Products"
                    required
                    aria-invalid={isDuplicateName && nameTouched}
                    aria-describedby="cat-name-error"
                  />
                  {isDuplicateName && nameTouched && (
                    <p id="cat-name-error" className="mt-1 text-xs text-red-600">
                      A category with this name already exists.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none"
                    rows={2}
                    placeholder="Describe this category and what products it includes..."
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Image</label>

                  {/* Preview — shows local blob OR saved URL */}
                  {(pendingImagePreview || formData.image) && (
                    <div className="relative w-24 h-24 mb-3">
                      <img
                        src={pendingImagePreview || formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-neutral-200"
                      />
                      {pendingImagePreview && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-primary-500 text-white rounded-b-lg py-0.5">
                          Saves on Save
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
                          setPendingImageFile(null);
                          setPendingImagePreview('');
                          setFormData(prev => ({ ...prev, image: '' }));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      >×</button>
                    </div>
                  )}

                  {/* Upload button — stores file locally, no network call yet */}
                  {!pendingImageFile && !pendingImagePreview && !formData.image && (
                    <label className="flex items-center gap-2 cursor-pointer bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg px-4 py-2.5 hover:border-primary-400 transition-colors mb-2">
                      <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-neutral-500">Choose image (JPG, PNG, WebP — max 5MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('File too large. Max 5MB.');
                            return;
                          }
                          if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
                          setPendingImageFile(file);
                          setPendingImagePreview(URL.createObjectURL(file));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}

                  {/* Or paste URL directly */}
                  {!pendingImageFile && (
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors text-sm"
                      placeholder="Or paste image URL directly"
                    />
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-700">Active</span>
                    <p className="text-xs text-neutral-400">Make this category visible to customers</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 ${
                      formData.active
                        ? 'bg-primary-500'
                        : 'bg-neutral-300'
                    }`}
                    aria-pressed={formData.active}
                    aria-label="Toggle category active"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        formData.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 bg-neutral-50">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cat-form"
                disabled={isDuplicateName || !formData.name.trim()}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
