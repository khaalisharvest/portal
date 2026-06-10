'use client';

import { useState, useMemo } from 'react';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { toast } from 'react-hot-toast';
import { ADMIN_EMAIL, ADMIN_WHATSAPP } from '@/config/env';
import OrganicPattern from '@/components/ui/OrganicPattern';

const subjectOptions: DropdownOption[] = [
  { value: 'general',  label: 'General Inquiry'    },
  { value: 'delivery', label: 'Delivery Issue'      },
  { value: 'product',  label: 'Product Question'    },
  { value: 'support',  label: 'Technical Support'   },
  { value: 'feedback', label: 'Feedback'            },
  { value: 'other',    label: 'Other'               },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [phoneError, setPhoneError]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhone = (phone: string) => {
    const v = validatePakistaniPhone(phone);
    if (!v.isValid) { setPhoneError(v.error || 'Invalid phone number'); return null; }
    setPhoneError('');
    return v.normalizedNumber;
  };

  const isFormValid = useMemo(() => {
    const hasName    = formData.name.trim().length >= 2;
    const hasEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const hasSubject = formData.subject.length > 0;
    const hasMessage = formData.message.trim().length >= 10;
    const phoneOk    = !formData.phone || !phoneError;
    return hasName && hasEmail && hasSubject && hasMessage && phoneOk;
  }, [formData, phoneError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) { toast.error('Please fill all required fields correctly'); return; }
    if (formData.phone && !validatePhone(formData.phone)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    formData.name.trim(),
          email:   formData.email.trim(),
          phone:   formData.phone ? validatePhone(formData.phone) : undefined,
          subject: formData.subject,
          message: formData.message.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setPhoneError('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubjectChange = (value: string | string[]) =>
    setFormData({ ...formData, subject: Array.isArray(value) ? value[0] : value });

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      <OrganicPattern />
      <div className="relative container-custom py-12">
        <div className="grid lg:grid-cols-5 gap-10 items-start">

          {/* Left — title + contact methods */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm">
              <h1 className="text-3xl font-bold text-neutral-900">Get in Touch</h1>
              <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
                Have a question or need help with an order? Reach out and we'll respond within 24 hours.
              </p>
            </div>

            <div className="space-y-4">
              {ADMIN_WHATSAPP && (
                <a
                  href={`https://wa.me/${ADMIN_WHATSAPP.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">WhatsApp</p>
                    <p className="text-sm font-semibold text-neutral-800">{ADMIN_WHATSAPP}</p>
                  </div>
                </a>
              )}

              {ADMIN_EMAIL && (
                <a
                  href={`mailto:${ADMIN_EMAIL}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-neutral-800">{ADMIN_EMAIL}</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-8 shadow-sm border border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Send a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name *</label>
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleChange} required
                    className="input-field" placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">Email *</label>
                  <input
                    type="email" id="email" name="email"
                    value={formData.email} onChange={handleChange} required
                    className="input-field" placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1.5">Phone</label>
                  <input
                    type="tel" id="phone" name="phone"
                    value={formData.phone}
                    onChange={(e) => { handleChange(e); validatePhone(e.target.value); }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    className={`input-field ${phoneError ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder={getPhonePlaceholder()}
                  />
                  {phoneError && <p className="mt-1 text-xs text-error-600">{phoneError}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1.5">Subject *</label>
                  <Dropdown
                    options={subjectOptions}
                    value={formData.subject}
                    onChange={handleSubjectChange}
                    placeholder="Select a subject"
                    size="md"
                    variant="default"
                    className="w-full"
                    showCheckmark={false}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1.5">Message *</label>
                <textarea
                  id="message" name="message"
                  value={formData.message} onChange={handleChange} required
                  rows={5} className="textarea-field"
                  placeholder="Tell us how we can help you…"
                />
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
