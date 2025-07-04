'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Database, Mail, Shield, Users, Globe, Activity, Save, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionGate } from '@/components/auth/PermissionGate';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      siteName: 'ImpactFlow Pro',
      siteUrl: 'https://impactflow.com',
      supportEmail: 'support@impactflow.com',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@impactflow.com',
      smtpPassword: '********',
      fromName: 'ImpactFlow',
      fromEmail: 'noreply@impactflow.com',
    },
    security: {
      enforcePasswordPolicy: true,
      minPasswordLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      sessionTimeout: 60, // minutes
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      enforce2FA: false,
    },
    integrations: {
      googleAnalyticsId: '',
      slackWebhook: '',
      microsoftTeamsWebhook: '',
      jiraIntegration: false,
      githubIntegration: false,
    },
    performance: {
      enableCaching: true,
      cacheTimeout: 3600, // seconds
      enableCompression: true,
      maxUploadSize: 10, // MB
      enableCDN: false,
      cdnUrl: '',
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Settings saved successfully');
    setIsSaving(false);
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'performance', label: 'Performance', icon: Activity },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, siteName: e.target.value }
              })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site URL
            </label>
            <input
              type="url"
              value={settings.general.siteUrl}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, siteUrl: e.target.value }
              })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, supportEmail: e.target.value }
              })}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">System Options</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.general.maintenanceMode}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, maintenanceMode: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Maintenance Mode</span>
              <p className="text-sm text-gray-600">Put the site in maintenance mode</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.general.allowRegistration}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, allowRegistration: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Allow Registration</span>
              <p className="text-sm text-gray-600">Allow new users to register</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.general.requireEmailVerification}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, requireEmailVerification: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Require Email Verification</span>
              <p className="text-sm text-gray-600">New users must verify their email</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.email.smtpHost}
                onChange={(e) => setSettings({
                  ...settings,
                  email: { ...settings.email, smtpHost: e.target.value }
                })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => setSettings({
                  ...settings,
                  email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                })}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={settings.email.smtpUser}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpUser: e.target.value }
              })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={settings.email.smtpPassword}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, smtpPassword: e.target.value }
              })}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Email Settings</h4>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={settings.email.fromName}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, fromName: e.target.value }
              })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={settings.email.fromEmail}
              onChange={(e) => setSettings({
                ...settings,
                email: { ...settings.email, fromEmail: e.target.value }
              })}
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-secondary px-4 py-2">
          Send Test Email
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.security.enforcePasswordPolicy}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, enforcePasswordPolicy: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="font-medium text-gray-900">Enforce Password Policy</span>
          </label>
          
          {settings.security.enforcePasswordPolicy && (
            <div className="ml-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={settings.security.minPasswordLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, minPasswordLength: parseInt(e.target.value) }
                  })}
                  className="input w-20"
                  min="6"
                  max="32"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.security.requireUppercase}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, requireUppercase: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Require uppercase letters</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.security.requireNumbers}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, requireNumbers: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Require numbers</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.security.requireSpecialChars}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, requireSpecialChars: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">Require special characters</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Session & Login</h4>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
              })}
              className="input w-32"
              min="5"
              max="1440"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                })}
                className="input w-full"
                min="3"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.security.lockoutDuration}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, lockoutDuration: parseInt(e.target.value) }
                })}
                className="input w-full"
                min="5"
                max="120"
              />
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.security.enforce2FA}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, enforce2FA: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Enforce 2FA for All Users</span>
              <p className="text-sm text-gray-600">Require two-factor authentication for all accounts</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Analytics ID
          </label>
          <input
            type="text"
            value={settings.integrations.googleAnalyticsId}
            onChange={(e) => setSettings({
              ...settings,
              integrations: { ...settings.integrations, googleAnalyticsId: e.target.value }
            })}
            placeholder="UA-XXXXXXXXX-X"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Communication</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slack Webhook URL
            </label>
            <input
              type="url"
              value={settings.integrations.slackWebhook}
              onChange={(e) => setSettings({
                ...settings,
                integrations: { ...settings.integrations, slackWebhook: e.target.value }
              })}
              placeholder="https://hooks.slack.com/services/..."
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Microsoft Teams Webhook URL
            </label>
            <input
              type="url"
              value={settings.integrations.microsoftTeamsWebhook}
              onChange={(e) => setSettings({
                ...settings,
                integrations: { ...settings.integrations, microsoftTeamsWebhook: e.target.value }
              })}
              placeholder="https://outlook.office.com/webhook/..."
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Development Tools</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.integrations.jiraIntegration}
              onChange={(e) => setSettings({
                ...settings,
                integrations: { ...settings.integrations, jiraIntegration: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Jira Integration</span>
              <p className="text-sm text-gray-600">Sync tasks with Jira</p>
            </div>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.integrations.githubIntegration}
              onChange={(e) => setSettings({
                ...settings,
                integrations: { ...settings.integrations, githubIntegration: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">GitHub Integration</span>
              <p className="text-sm text-gray-600">Link commits and PRs to tasks</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Caching</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.performance.enableCaching}
              onChange={(e) => setSettings({
                ...settings,
                performance: { ...settings.performance, enableCaching: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Enable Caching</span>
              <p className="text-sm text-gray-600">Cache static resources for better performance</p>
            </div>
          </label>
          {settings.performance.enableCaching && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cache Timeout (seconds)
              </label>
              <input
                type="number"
                value={settings.performance.cacheTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, cacheTimeout: parseInt(e.target.value) }
                })}
                className="input w-32"
                min="60"
                max="86400"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Optimization</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.performance.enableCompression}
              onChange={(e) => setSettings({
                ...settings,
                performance: { ...settings.performance, enableCompression: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Enable Compression</span>
              <p className="text-sm text-gray-600">Compress responses for faster loading</p>
            </div>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Upload Size (MB)
            </label>
            <input
              type="number"
              value={settings.performance.maxUploadSize}
              onChange={(e) => setSettings({
                ...settings,
                performance: { ...settings.performance, maxUploadSize: parseInt(e.target.value) }
              })}
              className="input w-32"
              min="1"
              max="100"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">CDN</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.performance.enableCDN}
              onChange={(e) => setSettings({
                ...settings,
                performance: { ...settings.performance, enableCDN: e.target.checked }
              })}
              className="w-4 h-4 text-primary rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Enable CDN</span>
              <p className="text-sm text-gray-600">Use Content Delivery Network for static assets</p>
            </div>
          </label>
          {settings.performance.enableCDN && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CDN URL
              </label>
              <input
                type="url"
                value={settings.performance.cdnUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, cdnUrl: e.target.value }
                })}
                placeholder="https://cdn.example.com"
                className="input w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
          <RefreshCw className="w-4 h-4" />
          Clear All Caches
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'email':
        return renderEmailSettings();
      case 'security':
        return renderSecuritySettings();
      case 'integrations':
        return renderIntegrationSettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return null;
    }
  };

  return (
    <PermissionGate
      resource="system_settings"
      action="manage"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access system settings.</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:text-primary-dark">
              Go back to dashboard
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Settings"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  <h1 className="text-xl font-semibold text-gray-900">System Settings</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  title="Go to Dashboard"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Navigation */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="w-4 h-4" />
                    User Settings
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </Link>
                </div>
              </div>
              
              {/* System Info */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">System Info</h4>
                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="text-gray-500">Version</dt>
                    <dd className="text-gray-900 font-mono">1.0.0</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Environment</dt>
                    <dd className="text-gray-900 font-mono">Development</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Database</dt>
                    <dd className="text-gray-900">Connected</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}