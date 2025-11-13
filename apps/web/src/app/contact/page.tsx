'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { validatePakistaniPhone, getPhonePlaceholder } from '@/utils/phoneValidation';
import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';
import Dropdown, { DropdownOption } from '@/components/ui/Dropdown';
import { toast } from 'react-hot-toast';

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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Phone</h3>
                        <p className="text-white/80">+92 300 123 4567</p>
                      </div>
                    </div>
                  </motion.div>

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
                        <p className="text-white/80">info@khaalisharvest.pk</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Address</h3>
                        <p className="text-white/80">Karachi, Pakistan</p>
                      </div>
                    </div>
                  </motion.div>
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
