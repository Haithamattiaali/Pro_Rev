'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, BarChart3, FileSpreadsheet, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: 'Excel Import Magic',
      description: 'Upload any Excel file and watch it transform into a powerful project dashboard',
    },
    {
      icon: BarChart3,
      title: 'Impact-Based Tracking',
      description: 'Go beyond simple task counting with our intelligent impact scoring system',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Real-time updates, approvals, and communication in one unified platform',
    },
    {
      icon: Zap,
      title: 'Predictive Insights',
      description: 'AI-powered recommendations to keep your projects on track',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">ImpactFlow Pro</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-secondary px-4 py-2 text-sm">
                Login
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl font-bold text-neutral-900 mb-6"
            >
              Transform Excel Chaos into
              <span className="text-gradient"> Project Clarity</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto"
            >
              Beyond task counting - True project intelligence with impact-based tracking,
              real-time collaboration, and predictive insights.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-4 justify-center"
            >
              <Link
                href="/register"
                className="btn-primary px-8 py-3 text-lg flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/demo"
                className="btn-secondary px-8 py-3 text-lg"
              >
                Watch Demo
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-neutral-900 mb-4">
              Everything You Need for Project Success
            </h3>
            <p className="text-lg text-neutral-600">
              Powerful features designed for modern project management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover-lift"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Project Management?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of teams already using ImpactFlow Pro
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}