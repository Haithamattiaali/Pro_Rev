'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Bell, User, Shield, Palette, Globe, 
  Database, Mail, Key, CreditCard, Activity, Settings 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const settingsCategories = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'Manage your personal information',
          href: '/settings/profile',
          available: true,
        },
        {
          icon: Key,
          label: 'Security',
          description: 'Password and authentication settings',
          href: '/settings/security',
          available: true,
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Email and in-app notification preferences',
          href: '/settings/notifications',
          available: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Palette,
          label: 'Appearance',
          description: 'Theme and display settings',
          href: '/settings/appearance',
          available: false,
        },
        {
          icon: Globe,
          label: 'Language & Region',
          description: 'Language, timezone, and date format',
          href: '/settings/language',
          available: false,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: Database,
          label: 'Data Export',
          description: 'Export your data and projects',
          href: '/settings/export',
          available: false,
        },
        {
          icon: Shield,
          label: 'Privacy',
          description: 'Privacy settings and data usage',
          href: '/settings/privacy',
          available: false,
        },
      ],
    },
    {
      title: 'Billing',
      items: [
        {
          icon: CreditCard,
          label: 'Subscription',
          description: 'Manage your subscription and billing',
          href: '/settings/billing',
          available: false,
        },
      ],
    },
  ];

  // Add admin-only settings if user is admin
  if (user?.role.name === 'Admin') {
    settingsCategories.push({
      title: 'Administration',
      items: [
        {
          icon: Shield,
          label: 'System Settings',
          description: 'Configure system-wide settings',
          href: '/admin/settings',
          available: true,
        },
        {
          icon: Activity,
          label: 'System Monitoring',
          description: 'View system health and logs',
          href: '/admin/monitoring',
          available: false,
        },
      ],
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {settingsCategories.map((category) => (
            <div key={category.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {category.title}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.available ? item.href : '#'}
                    className={`
                      block p-6 bg-white rounded-lg border transition-all
                      ${item.available 
                        ? 'border-gray-200 hover:border-primary hover:shadow-sm cursor-pointer' 
                        : 'border-gray-100 opacity-60 cursor-not-allowed'
                      }
                    `}
                    onClick={(e) => {
                      if (!item.available) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-2 rounded-lg
                        ${item.available ? 'bg-primary-50' : 'bg-gray-100'}
                      `}>
                        <item.icon className={`
                          w-5 h-5
                          ${item.available ? 'text-primary' : 'text-gray-400'}
                        `} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                        {!item.available && (
                          <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Need help?</h3>
          <p className="text-sm text-blue-700">
            Check out our documentation or contact support if you need assistance with any settings.
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/docs"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Documentation
            </Link>
            <Link
              href="/support"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}