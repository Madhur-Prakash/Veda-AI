'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const SEED_USERS = [
  { name: 'Sarah Johnson', email: 'sarah@vedaai.dev', password: 'password123', school: 'Delhi Public School' },
  { name: 'Raj Sharma', email: 'raj@vedaai.dev', password: 'password123', school: 'Kendriya Vidyalaya' }
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      router.replace('/');
    } catch { /* error set in store */ }
  }

  function fillSeedUser(user: typeof SEED_USERS[number]) {
    clearError();
    setEmail(user.email);
    setPassword(user.password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f7f6_0%,#efefef_100%)] px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[linear-gradient(160deg,#ffb24f_0%,#ff6a2b_38%,#3a1c13_100%)] text-white shadow-[0_14px_30px_rgba(255,106,43,0.3)] text-2xl font-black">
            V
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1f1f1f]">Welcome back</h1>
          <p className="text-[15px] text-neutral-500">Sign in to your VedaAI account</p>
        </div>

        {/* Seed accounts quick-fill */}
        <div className="mb-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Demo accounts — click to fill
          </p>
          <div className="flex flex-col gap-2">
            {SEED_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillSeedUser(u)}
                className="flex items-center justify-between rounded-[12px] bg-white px-3.5 py-2.5 text-left shadow-sm ring-1 ring-amber-100 transition hover:ring-amber-300 active:scale-[0.98]"
              >
                <div>
                  <p className="text-[13px] font-semibold text-[#1f1f1f]">{u.name}</p>
                  <p className="text-[11px] text-neutral-500">{u.school}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[12px] text-neutral-600">{u.email}</p>
                  <p className="font-mono text-[11px] text-neutral-400">{u.password}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          {error && (
            <div className="mb-5 rounded-[14px] bg-red-50 px-4 py-3 text-[14px] text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="h-12 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-5 text-[15px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-5 pr-12 text-[15px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1f1f1f] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition hover:bg-black disabled:opacity-60"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[14px] text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-[#ff6a2b] hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
