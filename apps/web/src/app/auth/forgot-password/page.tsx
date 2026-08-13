'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [adminState, setAdminState] = useState<{ adminWhatsapp: string; identifier: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (res.status >= 500) {
        setFormError('Server error. Please try again later.');
        return;
      }

      if (res.status === 429) {
        setFormError('Too many attempts. Please wait 15 minutes before trying again.');
        return;
      }

      if (!res.ok) {
        setFormError(data.message || 'No account found with this email or phone number.');
        return;
      }

      if (data.action === 'contact_admin') {
        setAdminState({ adminWhatsapp: data.adminWhatsapp, identifier: identifier.trim() });
        return;
      }

      // Email or WhatsApp OTP sent — go to reset page
      const params = new URLSearchParams();
      if (data.channel)       params.set('channel', data.channel);
      if (data.maskedContact) params.set('contact', data.maskedContact);
      if (data.identifier)    params.set('id', data.identifier);
      router.push(`/auth/reset-password?${params.toString()}`);
    } catch {
      toast.error('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (adminState) {
    const waLink = `https://wa.me/${adminState.adminWhatsapp.replace(/^\+/, '')}?text=${encodeURIComponent(`Please reset my password. My registered number is: ${adminState.identifier}`)}`;
    return (
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-1.5">
              <div className="w-14 h-14 relative flex-shrink-0">
                <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">Contact Admin</h1>
            </div>
          </div>
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-secondary-800 mb-1">WhatsApp reset not available yet</p>
            <p className="text-sm text-secondary-700 leading-relaxed">
              Your account uses phone-only login. Please message our admin on WhatsApp to reset your password — mention your registered phone number.
            </p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Message Admin on WhatsApp
          </a>
          <button
            onClick={() => setAdminState(null)}
            className="w-full text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Try a different account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
        <div className="mb-7">
          <div className="flex items-center gap-4 mb-1.5">
            <div className="w-14 h-14 relative flex-shrink-0">
              <Image src="/images/logo.png" alt="Khaalis Harvest" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Forgot Password</h1>
          </div>
          <p className="text-neutral-500 text-sm">Enter your phone number or email — we'll send you a reset code</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone or Email</label>
            <input
              type="text"
              placeholder="03001234567 or your@email.com"
              value={identifier}
              onChange={e => { setIdentifier(e.target.value); setFormError(''); }}
              required
              className={`input-field ${formError ? 'input-error' : ''}`}
            />
            {formError && (
              <p className="mt-1.5 text-sm text-error-600">{formError}</p>
            )}
          </div>
          <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending code…
              </span>
            ) : 'Send Reset Code'}
          </button>
        </form>
        <p className="text-center mt-5 text-sm text-neutral-400">
          Remembered it?{' '}
          <Link href="/auth/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
