'use client';

import React from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { UserMenu } from '@/components/auth/UserMenu';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <p className="text-gray-600">
              Manage user accounts, roles, and permissions across your organization.
            </p>
          </div>
          
          <UserManagement />
        </main>
      </div>
  );
}