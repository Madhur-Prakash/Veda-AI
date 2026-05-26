import { Shell } from '@/components/shell';

export default function SettingsPage() {
  return (
    <Shell activePath="/settings">
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
        <div className="max-w-xl rounded-[32px] bg-white p-10 text-center shadow-soft">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-4 text-lg leading-8 text-neutral-500">Workspace settings can be extended here without changing the visual system.</p>
        </div>
      </div>
    </Shell>
  );
}