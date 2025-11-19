'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Icon from '@/components/ui/Icon';
import toast from 'react-hot-toast';
import { API_URL } from '@/config/env';
import { configService } from '@/services/config';

// Helper function to calculate text copies (same logic as NotificationBar component)
const calculateTextCopies = (text: string): string[] => {
  if (!text) return [];
  
  const textLength = text.length;
  let copies = 4; // Base number of copies
  
  if (textLength < 20) {
    copies = 8;
  } else if (textLength < 50) {
    copies = 6;
  } else if (textLength < 100) {
    copies = 4;
  } else if (textLength < 200) {
    copies = 3;
  } else {
    copies = 2;
  }
  
  return Array(copies).fill(text);
};

// Preview component that matches the actual NotificationBar exactly
function PreviewNotificationBar({ text, backgroundColor, textColor, speed }: { text: string; backgroundColor: string; textColor: string; speed: number }) {
  const previewTextCopies = useMemo(() => calculateTextCopies(text), [text]);
  const previewDuration = Math.max(10, Math.min(100, speed || 50));
  const previewAnimationDuration = `${previewDuration}s`;
  const previewTranslationPercentage = -(100 / previewTextCopies.length);
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Live Preview</h4>
      <p className="text-xs text-blue-700 mb-3">This preview matches exactly how the notification bar will appear on your website</p>
      <div className="w-full overflow-hidden" style={{ maxWidth: '100%' }}>
        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            minHeight: '40px',
            maxHeight: '48px',
            height: '48px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div className="flex items-center h-10 md:h-12 relative w-full overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
            <div 
              className="flex items-center whitespace-nowrap notification-scroll-preview"
              style={{
                '--animation-duration': previewAnimationDuration,
                '--translate-percent': `${previewTranslationPercentage}%`,
              } as React.CSSProperties}
            >
              {previewTextCopies.map((textCopy, index) => (
                <span 
                  key={index}
                  className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base font-medium flex-shrink-0"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {textCopy}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .notification-scroll-preview {
          display: inline-flex;
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          align-items: center;
          animation: notification-scroll-preview var(--animation-duration, 50s) linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          -webkit-perspective: 1000px;
          transform: translateX(0) translateZ(0);
          -webkit-transform: translateX(0) translateZ(0);
        }

        @keyframes notification-scroll-preview {
          0% {
            transform: translateX(0) translateZ(0);
            -webkit-transform: translateX(0) translateZ(0);
          }
          100% {
            transform: translateX(var(--translate-percent, -25%)) translateZ(0);
            -webkit-transform: translateX(var(--translate-percent, -25%)) translateZ(0);
          }
        }
      `}</style>
    </div>
  );
}

interface DeliverySettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;
}

interface NotificationBarSettings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'notification'>('delivery');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    isDeliveryEnabled: false
  });
  const [notificationBarSettings, setNotificationBarSettings] = useState<NotificationBarSettings>({
    isEnabled: false,
    text: '',
    backgroundColor: '#FF6B35',
    textColor: '#FFFFFF',
    speed: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      
      // Get delivery settings
      const deliveryData = await configService.getDeliverySettings();
      setDeliverySettings({
        deliveryFee: deliveryData.deliveryFee,
        freeDeliveryThreshold: deliveryData.freeDeliveryThreshold,
        isDeliveryEnabled: deliveryData.isDeliveryEnabled
      });

      // Get notification bar settings
      const notificationResponse = await fetch('/api/v1/settings/notification-bar');
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        const settings = notificationData.data || notificationData;
        setNotificationBarSettings({
          isEnabled: settings.isEnabled || false,
          text: settings.text || '',
          backgroundColor: settings.backgroundColor || '#FF6B35',
          textColor: settings.textColor || '#FFFFFF',
          speed: settings.speed || 50
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelivery = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/v1/settings/delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify({
          deliveryFee: deliverySettings.deliveryFee,
          freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
          isDeliveryEnabled: deliverySettings.isDeliveryEnabled
        }),
      });

      if (response.ok) {
        await configService.refreshConfig();
        await fetchAllSettings();
        toast.success('Delivery settings saved successfully');
      } else {
        toast.error('Failed to save delivery settings');
      }
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Error saving delivery settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationBar = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/v1/settings/notification-bar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
        body: JSON.stringify(notificationBarSettings),
      });

      if (response.ok) {
        await fetchAllSettings();
        toast.success('Notification bar settings saved successfully');
      } else {
        toast.error('Failed to save notification bar settings');
      }
    } catch (error) {
      console.error('Error saving notification bar settings:', error);
      toast.error('Error saving notification bar settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliveryInputChange = (field: keyof DeliverySettings, value: string | boolean) => {
    setDeliverySettings(prev => ({
      ...prev,
      [field]: field === 'isDeliveryEnabled' 
        ? (typeof value === 'boolean' ? value : value === 'true')
        : (typeof value === 'boolean' ? value : (value === '' ? 0 : parseFloat(value) || 0))
    }));
  };

  const handleNotificationBarInputChange = (field: keyof NotificationBarSettings, value: string | boolean | number) => {
    setNotificationBarSettings(prev => ({
      ...prev,
      [field]: field === 'isEnabled' 
        ? (typeof value === 'boolean' ? value : value === 'true')
        : field === 'speed'
        ? (typeof value === 'number' ? value : parseFloat(String(value)) || 50)
        : value
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
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600">Configure application settings</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('delivery')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'delivery'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Delivery Settings
              </button>
              <button
                onClick={() => setActiveTab('notification')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notification'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notification Bar
              </button>
            </nav>
          </div>

          {/* Delivery Settings Tab */}
          {activeTab === 'delivery' && (
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
                    checked={deliverySettings.isDeliveryEnabled}
                    onChange={(e) => handleDeliveryInputChange('isDeliveryEnabled', e.target.checked)}
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
                      value={deliverySettings.deliveryFee ?? 0}
                      onChange={(e) => handleDeliveryInputChange('deliveryFee', e.target.value)}
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
                      value={deliverySettings.freeDeliveryThreshold ?? 0}
                      onChange={(e) => handleDeliveryInputChange('freeDeliveryThreshold', e.target.value)}
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
                  <p>• Delivery Service: {deliverySettings.isDeliveryEnabled ? 'Enabled' : 'Disabled'}</p>
                  <p>• Delivery Fee: ₨{(deliverySettings.deliveryFee || 0).toFixed(2)}</p>
                  <p>• Free Delivery: Orders above ₨{(deliverySettings.freeDeliveryThreshold || 0).toFixed(2)}</p>
                  {deliverySettings.isDeliveryEnabled && (
                    <p className="text-blue-600 font-medium">
                      • Orders below ₨{(deliverySettings.freeDeliveryThreshold || 0).toFixed(2)} will be charged ₨{(deliverySettings.deliveryFee || 0).toFixed(2)} delivery fee
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveDelivery}
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
          )}

          {/* Notification Bar Settings Tab */}
          {activeTab === 'notification' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notification Bar Configuration</h3>
                <p className="text-sm text-gray-600 mt-1">Configure the scrolling announcement bar at the top of the website</p>
              </div>
              
              <div className="p-6 space-y-6 w-full max-w-full overflow-x-hidden">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Notification Bar</h4>
                    <p className="text-sm text-gray-600">Show or hide the notification bar on the website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationBarSettings.isEnabled}
                      onChange={(e) => handleNotificationBarInputChange('isEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {/* Notification Text */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Text *
                  </label>
                  <div className="relative w-full">
                    <textarea
                      value={notificationBarSettings.text}
                      onChange={(e) => handleNotificationBarInputChange('text', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm resize-y min-h-[100px] max-h-[200px] overflow-y-auto"
                      placeholder="Enter your announcement message here... (Supports short, long, and very long messages)"
                      rows={4}
                      maxLength={1000}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        boxSizing: 'border-box',
                        width: '100%',
                        maxWidth: '100%',
                        overflowX: 'hidden',
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between items-center flex-wrap gap-2">
                    <p className="text-sm text-gray-500">
                      {notificationBarSettings.text.length}/1000 characters
                    </p>
                    {notificationBarSettings.text.length > 500 && (
                      <p className="text-xs text-orange-600 font-medium">
                        Long message - will scroll smoothly
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={notificationBarSettings.backgroundColor}
                        onChange={(e) => handleNotificationBarInputChange('backgroundColor', e.target.value)}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={notificationBarSettings.backgroundColor}
                        onChange={(e) => handleNotificationBarInputChange('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="#FF6B35"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={notificationBarSettings.textColor}
                        onChange={(e) => handleNotificationBarInputChange('textColor', e.target.value)}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={notificationBarSettings.textColor}
                        onChange={(e) => handleNotificationBarInputChange('textColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scroll Speed: {notificationBarSettings.speed} (10 = Fast, 100 = Slow)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={notificationBarSettings.speed}
                    onChange={(e) => handleNotificationBarInputChange('speed', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast</span>
                    <span>Slow</span>
                  </div>
                </div>

                {/* Preview */}
                {notificationBarSettings.isEnabled && notificationBarSettings.text && (
                  <PreviewNotificationBar
                    text={notificationBarSettings.text}
                    backgroundColor={notificationBarSettings.backgroundColor}
                    textColor={notificationBarSettings.textColor}
                    speed={notificationBarSettings.speed}
                  />
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotificationBar}
                    disabled={saving || !notificationBarSettings.text.trim()}
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
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
