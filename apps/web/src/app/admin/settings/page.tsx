'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/env';
import { configService } from '@/services/config';

interface DeliverySettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings>({
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    isDeliveryEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Get fresh delivery settings from backend
      const deliverySettings = await configService.getDeliverySettings();
      
      setSettings({
        deliveryFee: deliverySettings.deliveryFee,
        freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
        isDeliveryEnabled: deliverySettings.isDeliveryEnabled
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update settings using the existing settings API
      const response = await fetch(`${API_URL}/settings/delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify({
          deliveryFee: settings.deliveryFee,
          freeDeliveryThreshold: settings.freeDeliveryThreshold,
          isDeliveryEnabled: settings.isDeliveryEnabled
        }),
      });

      if (response.ok) {
        // Refresh the config service cache and UI
        await configService.refreshConfig();
        await fetchSettings();
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof DeliverySettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: field === 'isDeliveryEnabled' 
        ? (typeof value === 'boolean' ? value : value === 'true')
        : (typeof value === 'boolean' ? value : (value === '' ? 0 : parseFloat(value) || 0))
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading settings...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Delivery Settings</h2>
              <p className="text-gray-600">Configure delivery fees and free delivery thresholds</p>
            </div>
          </div>

          {/* Settings Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delivery Configuration</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Enable/Disable Delivery */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Enable Delivery Service</h4>
                  <p className="text-sm text-gray-600">Turn delivery service on or off for all orders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isDeliveryEnabled}
                    onChange={(e) => handleInputChange('isDeliveryEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Delivery Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Fee (₨)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₨</span>
                    </div>
                    <input
                      type="number"
                      value={settings.deliveryFee ?? 0}
                      onChange={(e) => handleInputChange('deliveryFee', e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Standard delivery fee charged to customers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Delivery Threshold (₨)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₨</span>
                    </div>
                    <input
                      type="number"
                      value={settings.freeDeliveryThreshold ?? 0}
                      onChange={(e) => handleInputChange('freeDeliveryThreshold', e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Order amount above which delivery is free
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Configuration Preview</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Delivery Service: {settings.isDeliveryEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p>• Delivery Fee: ₨{(settings.deliveryFee || 0).toFixed(2)}</p>
                  <p>• Free Delivery: Orders above ₨{(settings.freeDeliveryThreshold || 0).toFixed(2)}</p>
                  {settings.isDeliveryEnabled && (
                    <p className="text-blue-600 font-medium">
                      • Orders below ₨{(settings.freeDeliveryThreshold || 0).toFixed(2)} will be charged ₨{(settings.deliveryFee || 0).toFixed(2)} delivery fee
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
