'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import toast from 'react-hot-toast';

interface InventoryItem {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
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
  inventory?: InventoryItem;
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
  const [editForm, setEditForm] = useState({ quantity: 0, minimumStock: 0, location: '', batchNumber: '', expiryDate: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('backend_token');
    try {
      const res = await fetch('/api/v1/products?limit=100&page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data.data?.products || data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInventory = async (productId: string) => {
    const token = localStorage.getItem('backend_token');
    try {
      const payload = {
        productId,
        quantity: editForm.quantity,
        minimumStock: editForm.minimumStock,
        location: editForm.location || undefined,
        batchNumber: editForm.batchNumber || undefined,
        expiryDate: editForm.expiryDate || undefined,
      };

      const res = await fetch(`/api/v1/products/${productId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update inventory');
      toast.success('Inventory updated');
      setEditingId(null);
      fetchProducts();
    } catch {
      toast.error('Failed to update inventory');
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      quantity: product.inventory?.quantity || 0,
      minimumStock: product.inventory?.minimumStock || 10,
      location: product.inventory?.location || '',
      batchNumber: product.inventory?.batchNumber || '',
      expiryDate: product.inventory?.expiryDate ? product.inventory.expiryDate.split('T')[0] : '',
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Inventory Management</h1>
        <p className="text-neutral-600 mt-1">Set stock levels for each product</p>
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
              const inv = product.inventory;
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
                    {inv?.reservedQuantity || 0}
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
                      <span className="text-neutral-500 text-sm">{inv?.minimumStock || 10}</span>
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
                          className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Save
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
      </div>
    </div>
  );
}
