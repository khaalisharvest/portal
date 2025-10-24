'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Full Screen Hero Section with Background */}
      <ResponsiveBackgroundImage
        src="/images/about-us.png"
        alt="About us background"
        overlayType="about"
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
              {/* Left Side - Mission & Vision */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                    About <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-300">Khaalis Harvest</span>
                  </h1>
                  <p className="text-xl text-white/90 leading-relaxed drop-shadow-md mb-8">
                    Pakistan's premier organic marketplace, bringing you the purest, unadulterated products 
                    directly from local farms to your doorstep.
                  </p>
                </div>

                {/* Mission Statement */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                  <p className="text-white/90 leading-relaxed">
                    We believe that everyone deserves access to fresh, high-quality organic products. 
                    Our mission is to bridge the gap between local Pakistani farmers and consumers, 
                    ensuring that the freshest organic products reach your table every day.
                  </p>
                </motion.div>

                {/* Vision Statement */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                  <p className="text-white/90 leading-relaxed">
                    To create a healthier Pakistan by making organic products accessible to everyone, 
                    supporting local agriculture, and building a sustainable future for our communities.
                  </p>
                </motion.div>
              </motion.div>

              {/* Right Side - Stats & Values */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
                  >
                    <div className="text-4xl font-bold text-white mb-2">500+</div>
                    <div className="text-white/80">Happy Customers</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
                  >
                    <div className="text-4xl font-bold text-white mb-2">50+</div>
                    <div className="text-white/80">Local Farms</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
                  >
                    <div className="text-4xl font-bold text-white mb-2">1000+</div>
                    <div className="text-white/80">Orders Delivered</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
                  >
                    <div className="text-4xl font-bold text-white mb-2">24/7</div>
                    <div className="text-white/80">Customer Support</div>
                  </motion.div>
                </div>

                {/* Values */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-2xl font-bold text-white mb-4">Our Values</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white/90">Quality & Freshness</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white/90">Supporting Local Farmers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white/90">Environmental Sustainability</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 relative">
                        <Image
                          src="/images/logo.png"
                          alt="Khaalis Harvest Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-white/90">Customer Satisfaction</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </ResponsiveBackgroundImage>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We believe that everyone deserves access to fresh, high-quality organic products. 
                Our mission is to bridge the gap between local Pakistani farmers and 
                consumers, ensuring that the freshest organic products reach your table every day.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                By supporting local agriculture and providing convenient delivery services, 
                we're building a healthier Pakistan, one organic product at a time.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-br from-orange-100 to-green-100 rounded-2xl p-8"
            >
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
                  <div className="text-gray-600">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
                  <div className="text-gray-600">Local Farms</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">1000+</div>
                  <div className="text-gray-600">Orders Delivered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                  <div className="text-gray-600">Customer Support</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We are committed to excellence in everything we do, from sourcing to delivery.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Freshness First</h3>
              <p className="text-gray-600">
                We source only the freshest organic products directly from local farms, 
                ensuring maximum nutritional value and taste.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Supporting Farmers</h3>
              <p className="text-gray-600">
                We work directly with local farmers, providing them with fair prices 
                and sustainable business opportunities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 relative mx-auto mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Khaalis Harvest Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Convenient Delivery</h3>
              <p className="text-gray-600">
                Fast, reliable delivery right to your doorstep, making healthy eating 
                convenient for busy lifestyles.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Khaalis Harvest was born from a simple idea: to make fresh, high-quality organic products 
                accessible to every Pakistani family. Founded in 2024, we started as a small 
                initiative to connect local farmers with urban consumers.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Today, we're proud to serve hundreds of families across Pakistan, delivering 
                not just organic products, but a commitment to health, sustainability, and community support. 
                Every order supports local agriculture and brings you closer to nature's finest offerings.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
