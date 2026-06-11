'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import toast from 'react-hot-toast';

interface InventoryRecord {
  id?: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  unit: string;
  inventory: InventoryRecord[];
}

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'staff']}>
      <AdminLayout>
        <InventoryContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function InventoryContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: 0, minimumStock: 0, location: '', batchNumber: '', expiryDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const LIMIT = 20;

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/products/admin?includeAll=true&limit=${LIMIT}&page=${page}`, {
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const payload = data.data || data;
      setProducts(payload.products || []);
      setTotalPages(payload.totalPages || 1);
      setTotalProducts(payload.total || 0);
      setCurrentPage(page);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const handleUpdateInventory = async (productId: string) => {
    setSavingId(productId);
    try {
      const res = await fetch(`/api/v1/products/${productId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: editForm.quantity,
          minimumStock: editForm.minimumStock,
          location: editForm.location || undefined,
          batchNumber: editForm.batchNumber || undefined,
          expiryDate: editForm.expiryDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Inventory updated');
      setEditingId(null);
      fetchProducts(currentPage);
    } catch {
      toast.error('Failed to update inventory');
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (product: Product) => {
    if (editingId && editingId !== product.id) {
      if (!confirm('You have unsaved changes. Discard and edit this product instead?')) {
        return;
      }
    }
    const inv = product.inventory?.[0];
    setEditingId(product.id);
    setEditForm({
      quantity: inv?.quantity ?? 0,
      minimumStock: inv?.minimumStock ?? 10,
      location: inv?.location ?? '',
      batchNumber: inv?.batchNumber ?? '',
      expiryDate: inv?.expiryDate ? inv.expiryDate.split('T')[0] : '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Inventory Management</h1>
          <p className="text-neutral-600 mt-1">Set stock levels for each product ({totalProducts} total)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-600">Product</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Available</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Reserved</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Min Stock</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const inv = product.inventory?.[0];
              const available = inv ? (inv.quantity - (inv.reservedQuantity || 0)) : null;
              const isLow = inv && available !== null && available <= (inv.minimumStock || 10);
              const isEditing = editingId === product.id;

              return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                      />
                      <div>
                        <p className="font-medium text-neutral-800 text-sm">{product.name}</p>
                        <p className="text-xs text-neutral-400">PKR {product.price} / {product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.quantity}
                        onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-20 text-center border border-neutral-300 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className={`font-semibold ${available === null ? 'text-neutral-400' : isLow ? 'text-red-600' : 'text-green-600'}`}>
                        {available === null ? '∞' : available}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-neutral-500 text-sm">
                    {inv?.reservedQuantity ?? 0}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.minimumStock}
                        onChange={e => setEditForm(f => ({ ...f, minimumStock: parseInt(e.target.value) || 0 }))}
                        className="w-20 text-center border border-neutral-300 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-neutral-500 text-sm">{inv?.minimumStock ?? 10}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {inv ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-500">Untracked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdateInventory(product.id)}
                          disabled={savingId === product.id}
                          className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingId === product.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-3 py-1.5 bg-neutral-200 text-neutral-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(product)}
                        className="text-xs px-3 py-1.5 border border-neutral-300 text-neutral-600 rounded-lg hover:border-primary-400 hover:text-primary-600 transition-colors"
                      >
                        Edit Stock
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-4xl mb-3">📦</p>
            <p>No products found. Add products first.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
