import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

const MOBILE_BP = 768;

export default function Layout() {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const isMobile = () => window.innerWidth <= MOBILE_BP;

  function handleToggle() {
    if (isMobile()) {
      setMobileOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  }

  function handleClose() { setMobileOpen(false); }

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > MOBILE_BP) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={handleClose} />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={handleClose}
      />

      <div className="main-wrapper">
        <Navbar onToggleSidebar={handleToggle} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
