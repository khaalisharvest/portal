'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import { API_URL } from '@/config/env';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  totalSuppliers: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: any[];
  topProducts: any[];
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  // This component is only for admins

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders data
      const ordersResponse = await fetch(`${API_URL}/admin/orders?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      // Fetch products data
      const productsResponse = await fetch(`${API_URL}/products?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      // Fetch suppliers data
      const suppliersResponse = await fetch(`${API_URL}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data?.orders || ordersData.orders || [];
        
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
        const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
        const completedOrders = orders.filter((order: any) => order.status === 'delivered').length;

        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders,
          completedOrders,
          recentOrders: orders.slice(0, 5)
        }));
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = productsData.data?.products || productsData.products || [];
        
        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          topProducts: products.slice(0, 5)
        }));
      }

      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        const suppliers = suppliersData.data?.suppliers || suppliersData.suppliers || suppliersData || [];
        const activeSuppliers = suppliers.filter((supplier: any) => supplier.isActive).length;
        
        setStats(prev => ({
          ...prev,
          totalSuppliers: activeSuppliers
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'processing': return 'cog';
      case 'shipped': return 'truck';
      case 'delivered': return 'check';
      case 'cancelled': return 'x-circle';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 relative">
            <Image
              src="/images/logo.png"
              alt="Khaalis Harvest Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Welcome back, {user?.name}!</h2>
            <p className="text-gray-600 font-['Open_Sans']">
              Here's what's happening with your Khaalis Harvest platform today - managing fresh produce, dairy, plants, and all organic products.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="shopping-cart" className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Open_Sans']">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 font-['Poppins']">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="credit-card" className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Open_Sans']">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 font-['Poppins']">₨{Number(stats.totalRevenue).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon name="cube" className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Open_Sans']">
                Organic Products
              </p>
              <p className="text-2xl font-bold text-gray-900 font-['Poppins']">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icon name="truck" className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 font-['Open_Sans']">
                Active Suppliers
              </p>
              <p className="text-2xl font-bold text-gray-900 font-['Poppins']">{stats.totalSuppliers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 font-['Poppins']">Recent Orders</h3>
          </div>
          <div className="p-6">
            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="shopping-cart" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-['Open_Sans']">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon name="shopping-cart" className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₨{Number(order.totalAmount).toFixed(2)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <Icon name={getStatusIcon(order.status)} className="w-3 h-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 font-['Poppins']">Top Organic Products</h3>
          </div>
          <div className="p-6">
            {stats.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="cube" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-['Open_Sans']">No organic products available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category?.name || 'No category'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₨{Number(product.price).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{product.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/admin/products"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="plus" className="w-5 h-5 text-orange-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Manage Products</span>
            </a>
            <a 
              href="/admin/products/categories"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="folder" className="w-5 h-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Manage Categories</span>
            </a>
            <a 
              href="/admin/orders"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="shopping-cart" className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">View Orders</span>
            </a>
            <a 
              href="/admin/customers"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon name="user" className="w-5 h-5 text-purple-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Manage Customers</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
