import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Input from '../components/Input';
import Particles from '../components/Particles';
import { loginUser } from '../utils/api';
import { setToken, setUser } from '../utils/auth';

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const BatSignal = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
    <div
      className="w-[600px] h-[600px] rounded-full opacity-5"
      style={{
        background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}
    />
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await loginUser(form.email.trim(), form.password);
      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative flex-1 flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]"
    >
      <Particles count={16} />
      <BatSignal />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-batman-yellow/10 border border-batman-yellow/30 flex items-center justify-center glow-yellow-sm">
              <LogIn size={28} className="text-batman-yellow" />
            </div>
          </div>
          <h1 className="font-display text-4xl text-batman-yellow text-glow tracking-widest mb-2">
            ENTER GOTHAM
          </h1>
          <p className="text-batman-muted text-sm">
            Authenticate to access the Dark Knight's network
          </p>
        </motion.div>

        {/* Card */}
        <GlassCard className="w-full">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-950/60 border border-red-500/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2"
              >
                <span>⚠</span> {serverError}
              </motion.div>
            )}

            <Input
              id="login-email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="dark.knight@gotham.com"
              icon={Mail}
              error={errors.email}
              required
              autoComplete="email"
              disabled={loading}
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password}
              required
              autoComplete="current-password"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Enter the Cave'}
            </Button>
          </form>

          <p className="text-center text-sm text-batman-muted mt-6">
            New to Gotham?{' '}
            <Link
              to="/register"
              className="text-batman-yellow hover:text-batman-yellowDim font-semibold transition-colors underline underline-offset-2"
            >
              Create account
            </Link>
          </p>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default Login;
