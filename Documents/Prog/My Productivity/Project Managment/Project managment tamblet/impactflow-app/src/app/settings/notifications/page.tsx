'use client';

import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotificationSettingsPage() {
  return (
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Customize how and when you receive notifications
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <NotificationSettings />
      </div>
  );
}