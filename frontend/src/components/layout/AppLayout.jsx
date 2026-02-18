import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * AppLayout — public-facing layout (Navbar + content + Footer).
 *
 * Use as a parent route element with `<Outlet />` for child pages, or pass
 * `children` directly. The Navbar is fixed/glass, so the content area gets
 * a top padding (`pt-16`) to avoid sitting under it.
 *
 * @param {object} props
 * @param {object|null} [props.user]
 * @param {() => void} [props.onLogout]
 * @param {React.ReactNode} [props.children] - optional override of <Outlet />
 */
export default function AppLayout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar user={user} onLogout={onLogout} />

      {/* Pad below the fixed glass navbar (h-16) */}
      <main className="flex-1 pt-16">
        {children ?? <Outlet />}
      </main>

      <Footer />
    </div>
  );
}
