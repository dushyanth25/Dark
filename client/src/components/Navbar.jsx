import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, LogIn, UserPlus, Shield, Gamepad2 } from 'lucide-react';
import { isAuthenticated, clearAuth, getUser } from '../utils/auth';

const BatLogo = () => (
  <svg viewBox="0 0 100 60" className="w-10 h-6 fill-batman-yellow" aria-hidden="true">
    <path d="M50 5 C35 5 20 15 10 15 C5 15 0 12 0 12 C5 20 10 28 15 30 C10 30 5 28 2 30 C8 38 20 42 30 40 C35 48 42 52 50 52 C58 52 65 48 70 40 C80 42 92 38 98 30 C95 28 90 30 85 30 C90 28 95 20 100 12 C100 12 95 15 90 15 C80 15 65 5 50 5Z" />
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navLinks = [];
  if (authenticated) {
    navLinks.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
    navLinks.push({ to: '/game', label: 'Games', icon: Gamepad2 });
    if (user?.isAdmin) {
      navLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
    }
  } else {
    navLinks.push({ to: '/login', label: 'Login', icon: LogIn });
    navLinks.push({ to: '/register', label: 'Register', icon: UserPlus });
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass-card border-b border-batman-yellow/10 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={authenticated ? '/dashboard' : '/login'} className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -3 }}
            transition={{ duration: 0.2 }}
            className="drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
          >
            <BatLogo />
          </motion.div>
          <span className="font-display text-xl text-batman-yellow tracking-widest hidden sm:block text-glow">
            GOTHAM
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-2">
          {/* Admin badge */}
          {authenticated && user?.isAdmin && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-batman-yellow border border-batman-yellow/40 rounded-full px-3 py-1 bg-batman-yellow/10">
              <Shield size={12} /> Admin
            </span>
          )}

          {/* Nav links */}
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200
                    ${active
                      ? 'text-batman-yellow bg-batman-yellow/10 glow-yellow-sm'
                      : 'text-batman-muted hover:text-batman-yellow hover:bg-batman-yellow/5'
                    }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </motion.span>
              </Link>
            );
          })}

          {/* Logout */}
          {authenticated && (
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-batman-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ml-1"
              aria-label="Logout"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
