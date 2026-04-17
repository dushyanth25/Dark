import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import Input from '../components/Input';
import Particles from '../components/Particles';
import { registerUser } from '../utils/api';

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
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
      await registerUser(form.email.trim(), form.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]"
      >
        <GlassCard glowing className="w-full max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <CheckCircle size={56} className="text-batman-yellow" />
          </motion.div>
          <h2 className="font-display text-3xl text-batman-yellow text-glow tracking-widest mb-2">
            WELCOME, ALLY
          </h2>
          <p className="text-batman-muted text-sm">
            Account created. Redirecting you to Gotham…
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative flex-1 flex items-center justify-center px-4 py-16 min-h-[calc(100vh-4rem)]"
    >
      <Particles count={16} />

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
              <UserPlus size={28} className="text-batman-yellow" />
            </div>
          </div>
          <h1 className="font-display text-4xl text-batman-yellow text-glow tracking-widest mb-2">
            JOIN GOTHAM
          </h1>
          <p className="text-batman-muted text-sm">
            Create your identity on the Dark Knight's network
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
              id="register-email"
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
              id="register-password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Input
              id="register-confirm"
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={handleChange('confirm')}
              placeholder="••••••••"
              icon={Lock}
              error={errors.confirm}
              required
              autoComplete="new-password"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Become an Ally'}
            </Button>
          </form>

          <p className="text-center text-sm text-batman-muted mt-6">
            Already have access?{' '}
            <Link
              to="/login"
              className="text-batman-yellow hover:text-batman-yellowDim font-semibold transition-colors underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default Register;
