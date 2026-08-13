'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  BanknotesIcon,
  UsersIcon,
  CubeIcon,
} from '@heroicons/react/24/solid';
import AdminStatCard from './AdminStatCard';
import AttentionCard from './AttentionCard';
import StatusBadge from './StatusBadge';
import { AdminSkeletonRow } from './AdminSkeletonRow';

interface PendingReview {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RecentMessage {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: any[];
  topProducts: any[];
  pendingReviewsCount: number;
  unreadMessagesCount: number;
  lowStockCount: number;
  newCustomersThisWeek: number;
  newWishlistToday: number;
  pendingReviews: PendingReview[];
  recentMessages: RecentMessage[];
}

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0,
  pendingOrders: 0, completedOrders: 0, recentOrders: [], topProducts: [],
  pendingReviewsCount: 0, unreadMessagesCount: 0, lowStockCount: 0,
  newCustomersThisWeek: 0, newWishlistToday: 0, pendingReviews: [], recentMessages: [],
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/dashboard', { credentials: 'include' });
      if (response.ok) {
        const d = await response.json();
        const data = d.data || d;
        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          totalCustomers: data.totalCustomers || 0,
          totalProducts: data.totalProducts || 0,
          pendingOrders: data.pendingOrders || 0,
          completedOrders: data.completedOrders || 0,
          recentOrders: data.recentOrders || [],
          topProducts: data.topProducts || [],
          pendingReviewsCount: data.pendingReviewsCount || 0,
          unreadMessagesCount: data.unreadMessagesCount || 0,
          lowStockCount: data.lowStockCount || 0,
          newCustomersThisWeek: data.newCustomersThisWeek || 0,
          newWishlistToday: data.newWishlistToday || 0,
          pendingReviews: data.pendingReviews || [],
          recentMessages: data.recentMessages || [],
        });
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    setApprovingId(id);
    try {
      await fetch(`/api/v1/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      });
      toast.success('Review approved');
      fetchDashboardData();
    } catch {
      toast.error('Failed to approve review');
    } finally {
      setApprovingId(null);
    }
  };

  const attentionItems = [
    { key: 'orders',   count: stats.pendingOrders,       label: 'Pending Orders',   href: '/admin/orders',            cta: 'View Orders',      color: 'amber' as const },
    { key: 'reviews',  count: stats.pendingReviewsCount, label: 'Pending Reviews',  href: '/admin/reviews',           cta: 'Review Now',       color: 'amber' as const },
    { key: 'messages', count: stats.unreadMessagesCount, label: 'Unread Messages',  href: '/admin/contacts',          cta: 'View Messages',    color: 'blue'  as const },
    { key: 'stock',    count: stats.lowStockCount,       label: 'Low Stock Items',  href: '/admin/products/inventory', cta: 'Check Inventory', color: 'red'   as const },
  ].filter(i => i.count > 0);

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {attentionItems.length > 0
              ? `${attentionItems.length} item${attentionItems.length > 1 ? 's' : ''} need${attentionItems.length === 1 ? 's' : ''} your attention.`
              : "Everything looks good — no pending actions."}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="text-xs text-neutral-400 hover:text-neutral-700 border border-neutral-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Attention strip — only shown when there are items */}
      {!loading && attentionItems.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {attentionItems.map(item => (
            <AttentionCard key={item.key} label={item.label} count={item.count} href={item.href} cta={item.cta} color={item.color} />
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Orders"
          value={loading ? '—' : stats.totalOrders.toLocaleString()}
          icon={<ShoppingBagIcon />}
          color="green"
          trend={loading || !stats.pendingOrders ? undefined : { delta: `${stats.pendingOrders} pending`, up: true }}
        />
        <AdminStatCard
          label="Total Revenue"
          value={loading ? '—' : `₨${Number(stats.totalRevenue).toLocaleString('en-PK')}`}
          icon={<BanknotesIcon />}
          color="amber"
        />
        <AdminStatCard
          label="Customers"
          value={loading ? '—' : stats.totalCustomers.toLocaleString()}
          icon={<UsersIcon />}
          color="blue"
          trend={loading || !stats.newCustomersThisWeek ? undefined : { delta: `+${stats.newCustomersThisWeek} this week`, up: true }}
        />
        <AdminStatCard
          label="Products"
          value={loading ? '—' : stats.totalProducts.toLocaleString()}
          icon={<CubeIcon />}
          color="purple"
        />
      </div>

      {/* Main two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Orders — 3/5 width */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Order</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Customer</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Amount</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Status</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)
                  : stats.recentOrders.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">
                          No orders yet
                        </td>
                      </tr>
                    )
                    : stats.recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono font-medium text-neutral-700">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-600">
                          {order.user?.name ?? 'Guest'}
                        </td>
                        <td className="px-5 py-3 text-xs font-medium text-neutral-800">
                          ₨{Number(order.totalAmount || 0).toLocaleString('en-PK')}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-400">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — 2/5 width */}
        <div className="lg:col-span-2 space-y-4">

          {/* This Week stats */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-neutral-800 mb-4">This Week</h2>
            <div className="space-y-3">
              {[
                { label: 'New customers',        value: loading ? '—' : stats.newCustomersThisWeek },
                { label: 'Wishlist saves today', value: loading ? '—' : stats.newWishlistToday },
                { label: 'Completed orders',     value: loading ? '—' : stats.completedOrders },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500">{row.label}</span>
                  <span className="text-sm font-semibold text-neutral-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Pending Reviews</h2>
              <Link href="/admin/reviews" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 animate-pulse space-y-1.5">
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                    <div className="h-2.5 bg-neutral-100 rounded w-3/4" />
                  </div>
                ))
                : stats.pendingReviews.length === 0
                  ? <p className="px-5 py-4 text-xs text-neutral-400">No pending reviews</p>
                  : stats.pendingReviews.map(review => (
                    <div key={review.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-800 truncate">{review.productName}</p>
                          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <span>{review.customerName}</span>
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium text-[10px]">
                              {review.rating}/5
                            </span>
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{review.comment}</p>
                        </div>
                        <button
                          onClick={() => approveReview(review.id)}
                          disabled={approvingId === review.id}
                          className="flex-shrink-0 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 whitespace-nowrap"
                        >
                          {approvingId === review.id ? '...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages — only shown when there are messages */}
      {(loading || stats.recentMessages.length > 0) && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Unread Messages</h2>
            <Link href="/admin/contacts" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <AdminSkeletonRow key={i} cols={3} />)
              : stats.recentMessages.map((msg: any) => (
                <div key={msg.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-800">{msg.name}</p>
                    <p className="text-xs text-neutral-500">{msg.subject}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{timeAgo(msg.createdAt)}</span>
                    <Link
                      href="/admin/contacts"
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Reply →
                    </Link>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

    </div>
  );
}
