'use client';

import { InboxPanel } from '@/components/inbox/InboxPanel';

export default function InboxPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Inbox</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all your notifications, approvals, and mentions in one place
          </p>
        </div>
      </div>

      {/* Inbox Panel */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <InboxPanel />
        </div>
      </div>
    </div>
  );
}