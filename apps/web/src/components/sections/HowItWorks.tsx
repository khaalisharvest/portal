'use client';

import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  TruckIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const steps = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Browse & Search',
    description: 'Find fresh organic products from our curated collection managed by our admin team.',
  },
  {
    icon: ShoppingCartIcon,
    title: 'Add to Basket',
    description: 'Select your favorite organic products, choose quantities and weights, and add them to your basket.',
  },
  {
    icon: TruckIcon,
    title: 'Fast Delivery',
    description: 'Get your fresh organic products delivered to your doorstep within hours.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Enjoy Fresh Products',
    description: 'Enjoy the freshest, highest quality organic products direct from farm to your table.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Getting fresh organic products has never been easier. Follow these simple steps 
            to order from our Khaalis Harvest platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-green-100 rounded-full flex items-center justify-center mx-auto">
                  <step.icon className="h-8 w-8 text-orange-600" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                    <div className="w-1/2 h-full bg-gradient-to-r from-orange-200 to-green-200"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
