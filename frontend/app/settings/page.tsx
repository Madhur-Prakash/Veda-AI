'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  School,
  Mail,
  Shield,
  LogOut,
  Check,
  Loader2,
  Globe,
  BookOpen
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { useAuthStore } from '@/store/authStore';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Arabic', 'Portuguese'];

const DEFAULT_DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 }
];

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:px-8 md:py-7">
      <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#fff3ee]">
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px] text-[#ff6a2b]" />
        </div>
        <h2 className="text-[16px] font-semibold text-[#1f1f1f]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-neutral-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile, logout, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Preferences (localStorage)
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [prefSaved, setPrefSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setSchool(user.school ?? '');
    }
  }, [user]);

  useEffect(() => {
    const lang = localStorage.getItem('vedaai_default_language');
    const dur = localStorage.getItem('vedaai_default_duration');
    if (lang) setDefaultLanguage(lang);
    if (dur) setDefaultDuration(Number(dur));
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSaveState('saving');
    try {
      await updateProfile({ name: name.trim(), school: school.trim() });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  }

  function handleSavePreferences() {
    localStorage.setItem('vedaai_default_language', defaultLanguage);
    localStorage.setItem('vedaai_default_duration', String(defaultDuration));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  }

  async function handleSignOut() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <Shell title="Settings" titleIcon={Settings} activePath="/settings">
      <div className="mx-auto w-full max-w-[720px] space-y-5 px-1 pb-12 md:px-0">

        {/* Page heading */}
        <div className="mb-2">
          <div className="flex items-center gap-3 text-[20px] font-semibold">
            <span className="h-3.5 w-3.5 rounded-full bg-[#41c36f] shadow-[0_0_0_8px_rgba(65,195,111,0.16)]" />
            Settings
          </div>
          <p className="mt-1 text-[15px] text-neutral-400">Manage your profile and workspace preferences</p>
        </div>

        {/* Profile */}
        <SectionCard title="Profile" icon={User}>
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#fde5d8] text-[28px] font-bold text-[#ff6a2b] shadow-[0_4px_16px_rgba(255,106,43,0.16)]">
              {initials}
            </div>
            <div>
              <p className="text-[16px] font-semibold text-[#1f1f1f]">{user?.name ?? '—'}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#fff3ee] px-2.5 py-0.5 text-[12px] font-semibold capitalize text-[#ff6a2b]">
                <Shield className="h-3 w-3" />
                {user?.role ?? 'teacher'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    minLength={2}
                    className="h-11 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] pl-10 pr-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
                  />
                </div>
              </Field>

              <Field label="School / Institution">
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Delhi Public School"
                    className="h-11 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] pl-10 pr-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
                  />
                </div>
              </Field>
            </div>

            <Field label="Email address" hint="Email cannot be changed after registration.">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="h-11 w-full rounded-full border border-[#e5e5e5] bg-neutral-50 pl-10 pr-4 text-[14px] text-neutral-400 outline-none cursor-not-allowed"
                />
              </div>
            </Field>

            {error && (
              <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saveState === 'saving' || isLoading}
                className="flex items-center gap-2 rounded-full bg-[#1f1f1f] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {saveState === 'saving' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : saveState === 'saved' ? (
                  <><Check className="h-4 w-4 text-green-400" /> Saved!</>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="Generation Preferences" icon={Globe}>
          <div className="space-y-5">
            <Field label="Default language for AI generation">
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="h-11 w-full appearance-none rounded-full border border-[#e5e5e5] bg-[#f8f8f8] pl-10 pr-6 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Default exam duration">
              <div className="flex flex-wrap gap-2">
                {DEFAULT_DURATIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDefaultDuration(value)}
                    className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                      defaultDuration === value
                        ? 'bg-[#ff6a2b] text-white shadow-[0_2px_8px_rgba(255,106,43,0.25)]'
                        : 'border border-neutral-200 bg-white text-neutral-600 hover:border-[#ff6a2b] hover:text-[#ff6a2b]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex items-center gap-2 rounded-full bg-[#1f1f1f] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-black"
              >
                {prefSaved ? (
                  <><Check className="h-4 w-4 text-green-400" /> Saved!</>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard title="About" icon={BookOpen}>
          <div className="space-y-3 text-[14px] text-neutral-600">
            <div className="flex items-center justify-between rounded-[16px] bg-[#fafafa] px-4 py-3">
              <span className="font-medium text-neutral-500">Platform</span>
              <span className="font-semibold text-[#1f1f1f]">VedaAI Assessment Creator</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#fafafa] px-4 py-3">
              <span className="font-medium text-neutral-500">AI Provider</span>
              <span className="font-semibold text-[#1f1f1f]">Groq (LLaMA)</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#fafafa] px-4 py-3">
              <span className="font-medium text-neutral-500">Account type</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ee] px-2.5 py-0.5 text-[12px] font-semibold capitalize text-[#ff6a2b]">
                <Shield className="h-3 w-3" />
                {user?.role ?? 'teacher'}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Danger zone */}
        <div className="rounded-[28px] border border-red-100 bg-white px-6 py-6 md:px-8 md:py-7">
          <div className="mb-4 flex items-center gap-3 border-b border-red-50 pb-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-red-50">
              <LogOut className="h-[18px] w-[18px] text-red-500" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#1f1f1f]">Account</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#1f1f1f]">Sign out</p>
              <p className="text-[13px] text-neutral-400">You will be redirected to the login page.</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-[14px] font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

      </div>
    </Shell>
  );
}
