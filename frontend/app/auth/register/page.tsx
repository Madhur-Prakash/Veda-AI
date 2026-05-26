'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', school: '' });
  const [show, setShow] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await signUp(form.name, form.email, form.password, form.school);
      router.replace('/');
    } catch { /* error set in store */ }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f7f6_0%,#efefef_100%)] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[linear-gradient(160deg,#ffb24f_0%,#ff6a2b_38%,#3a1c13_100%)] text-white shadow-[0_14px_30px_rgba(255,106,43,0.3)] text-2xl font-black">
            V
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1f1f1f]">Create your account</h1>
          <p className="text-[15px] text-neutral-500">Start creating AI-powered assessments</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          {error && (
            <div className="mb-5 rounded-[14px] bg-red-50 px-4 py-3 text-[14px] text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">Full name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="John Smith"
                className="h-12 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-5 text-[15px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">School / Institution</label>
              <input
                type="text"
                value={form.school}
                onChange={update('school')}
                placeholder="Delhi Public School"
                className="h-12 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-5 text-[15px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
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
                  minLength={8}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min 8 characters"
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
                <UserPlus className="h-4 w-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[14px] text-neutral-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-[#ff6a2b] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
