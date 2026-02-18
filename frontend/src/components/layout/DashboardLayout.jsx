import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * DashboardLayout — Sidebar + content wrapper for owner / admin / analytics
 * pages. The Sidebar is fixed; the content shifts left margin to match its
 * current width and animates with the same easing.
 *
 * Use as a parent route element with `<Outlet />` for child pages, or pass
 * `children` directly.
 *
 * @param {object} props
 * @param {Array<object>} [props.items] - sidebar nav items
 * @param {{full_name:string,role?:string,email?:string}} [props.user]
 * @param {() => void} [props.onLogout]
 * @param {{to:string,label:string,icon?:React.ComponentType}} [props.primaryAction]
 * @param {React.ReactNode} [props.children]
 */
export default function DashboardLayout({
  items,
  user,
  onLogout,
  primaryAction,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-container-low">
      <Sidebar
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        items={items}
        user={user}
        onLogout={onLogout}
        primaryAction={primaryAction}
      />

      {/* Content area: shifts to match sidebar width (w-20 collapsed, w-64 open) */}
      <div
        className={[
          'min-h-screen transition-[margin] duration-300 ease-in-out',
          collapsed ? 'ml-20' : 'ml-64',
        ].join(' ')}
      >
        <main className="px-6 sm:px-10 py-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
