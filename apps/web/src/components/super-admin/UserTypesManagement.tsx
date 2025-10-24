'use client';

import { useState, useEffect } from 'react';
import { userTypesApi, UserType, CreateUserTypeDto } from '@/services/userTypes';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

export default function UserTypesManagement() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<UserType | null>(null);
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState<CreateUserTypeDto>({
    name: '',
    displayName: '',
    description: '',
    permissions: {
      canSellProducts: false,
      canBuyProducts: true,
      canManageOrders: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canManageCategories: false,
      canManageProducts: false,
      canViewAnalytics: false,
      canManageSettings: false,
    },
    features: {
      hasDashboard: true,
      hasProfile: true,
      hasInventory: false,
      hasOrders: false,
      hasAnalytics: false,
      hasNotifications: true,
    },
    isActive: true,
    sortOrder: 0,
    icon: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    loadUserTypes();
  }, []);

  const loadUserTypes = async () => {
    try {
      setLoading(true);
      const data = await userTypesApi.getAll();
      setUserTypes(data);
    } catch (error) {
      // Error loading user types
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await userTypesApi.update(editingType.id, formData);
      } else {
        await userTypesApi.create(formData);
      }
      await loadUserTypes();
      resetForm();
    } catch (error) {
      // Error saving user type
    }
  };

  const handleEdit = (userType: UserType) => {
    setEditingType(userType);
    setFormData({
      name: userType.name,
      displayName: userType.displayName,
      description: userType.description || '',
      permissions: userType.permissions || {
        canSellProducts: false,
        canBuyProducts: true,
        canManageOrders: false,
        canAccessAdmin: false,
        canManageUsers: false,
        canManageCategories: false,
        canManageProducts: false,
        canViewAnalytics: false,
        canManageSettings: false,
      },
      features: userType.features || {
        hasDashboard: true,
        hasProfile: true,
        hasInventory: false,
        hasOrders: false,
        hasAnalytics: false,
        hasNotifications: true,
      },
      isActive: userType.isActive,
      sortOrder: userType.sortOrder,
      icon: userType.icon || '',
      color: userType.color || '#3B82F6',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    setPendingDelete({ id, name });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await userTypesApi.delete(pendingDelete.id);
      await loadUserTypes();
    } catch (error) {
      // Error deleting user type
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
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: {
        canSellProducts: false,
        canBuyProducts: true,
        canManageOrders: false,
        canAccessAdmin: false,
        canManageUsers: false,
        canManageCategories: false,
        canManageProducts: false,
        canViewAnalytics: false,
        canManageSettings: false,
      },
      features: {
        hasDashboard: true,
        hasProfile: true,
        hasInventory: false,
        hasOrders: false,
        hasAnalytics: false,
        hasNotifications: true,
      },
      isActive: true,
      sortOrder: 0,
      icon: '',
      color: '#3B82F6',
    });
    setEditingType(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading user types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Types Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add User Type
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {editingType ? 'Edit User Type' : 'Create New User Type'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., user, store, truck"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                Active
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-20 border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingType ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userTypes.map((userType) => (
          <div key={userType.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {userType.icon && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: userType.color }}
                  >
                    {userType.icon}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{userType.displayName}</h3>
                  <p className="text-sm text-gray-600">{userType.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(userType)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(userType.id, userType.name)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {userType.description && (
              <p className="text-gray-600 text-sm mb-4">{userType.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs ${
                userType.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userType.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">Order: {userType.sortOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete User Type"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
