'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { toast } from 'react-hot-toast';
import { ADMIN_EMAIL, ADMIN_WHATSAPP } from '@/config/env';

const subjectOptions: DropdownOption[] = [
  { value: 'general', label: 'General Inquiry', icon: 'chat-bubble-left-right' },
  { value: 'delivery', label: 'Delivery Issue', icon: 'truck' },
  { value: 'product', label: 'Product Question', icon: 'cube' },
  { value: 'support', label: 'Technical Support', icon: 'wrench-screwdriver' },
  { value: 'feedback', label: 'Feedback', icon: 'star' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePhone = (phone: string) => {
    const validation = validatePakistaniPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return null;
    }
    setPhoneError('');
    return validation.normalizedNumber;
  };

  // Validate form to enable/disable submit button
  const isFormValid = useMemo(() => {
    const hasName = formData.name.trim().length >= 2;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const hasSubject = formData.subject.length > 0;
    const hasMessage = formData.message.trim().length >= 10;
    const phoneValid = !formData.phone || !phoneError;
    
    return hasName && hasEmail && hasSubject && hasMessage && phoneValid;
  }, [formData, phoneError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill all required fields correctly');
      return;
    }
    
    // Validate phone number if provided
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone ? validatePhone(formData.phone) : undefined,
          subject: formData.subject,
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast.success('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setPhoneError('');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectChange = (value: string | string[]) => {
    setFormData({
      ...formData,
      subject: Array.isArray(value) ? value[0] : value
    });
  };

  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section with Background */}
      <ResponsiveBackgroundImage
        src="/images/contact.png"
        alt="Contact us background"
        overlayType="contact"
        priority={true}
        quality={80}
        objectPosition="center"
        fitContent={false}
        minHeight="min-h-screen"
        className="relative"
      >
        <div className="min-h-screen flex items-center">
          <div className="container-custom w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen py-20">
              {/* Left Side - Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                    Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-300">Us</span>
                  </h1>
                  <p className="text-xl text-white/90 leading-relaxed drop-shadow-md mb-8">
                    We'd love to hear from you! Get in touch with us for any questions, 
                    feedback, or support needs.
                  </p>
                </div>

                {/* Contact Cards */}
                <div className="space-y-6">
                  {ADMIN_WHATSAPP && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">WhatsApp</h3>
                          <a 
                            href={`https://wa.me/${ADMIN_WHATSAPP.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/80 hover:text-white transition-colors"
                          >
                            {ADMIN_WHATSAPP}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {ADMIN_EMAIL && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Email</h3>
                          <a 
                            href={`mailto:${ADMIN_EMAIL}`}
                            className="text-white/80 hover:text-white transition-colors"
                          >
                            {ADMIN_EMAIL}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Right Side - Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-neutral-900 mb-4">Send us a Message</h2>
                  <p className="text-neutral-600">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </div>
              
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          handleChange(e);
                          validatePhone(e.target.value);
                        }}
                        onBlur={(e) => validatePhone(e.target.value)}
                        className={`input-field ${
                          phoneError ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''
                        }`}
                        placeholder={getPhonePlaceholder()}
                      />
                      {phoneError && (
                        <p className="mt-1 text-sm text-error-600">{phoneError}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
                        Subject *
                      </label>
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
                    <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="textarea-field"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`btn-primary w-full ${
                      !isFormValid || isSubmitting
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </ResponsiveBackgroundImage>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quick answers to common questions about our services.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-organic p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">How do I place an order?</h3>
              <p className="text-neutral-600">
                Simply browse our organic products, add them to your cart, and proceed to checkout. 
                We'll deliver them fresh to your doorstep.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-organic p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">What are your delivery areas?</h3>
              <p className="text-neutral-600">
                We currently deliver to major cities in Pakistan including Karachi, Lahore, Islamabad, 
                and Rawalpindi. More cities coming soon!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card-organic p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">How fresh are your products?</h3>
              <p className="text-neutral-600">
                All our organic products are sourced directly from local farms and delivered within 24-48 hours 
                of harvest to ensure maximum freshness and purity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="card-organic p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">What if I'm not satisfied with my order?</h3>
              <p className="text-neutral-600">
                We offer a 100% satisfaction guarantee. If you're not happy with your organic products, 
                contact us within 24 hours for a full refund or replacement.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
