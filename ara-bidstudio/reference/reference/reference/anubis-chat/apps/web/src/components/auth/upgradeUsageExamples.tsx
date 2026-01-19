'use client';

import { Code, Crown, FileUp, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFeatureGate } from '@/hooks/use-upgrade-modal';
import { FeatureGate, useUpgrade } from './upgradeWrapper';

/**
 * Example component showing how to use the upgrade system throughout the app
 * This demonstrates various patterns for feature gating and upgrade prompts
 */
export function UpgradeUsageExamples() {
  const { openUpgradeModal } = useUpgrade();
  const { requireFeature, checkFeature } = useFeatureGate();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-2 font-semibold text-xl">Upgrade System Examples</h2>
        <p className="text-muted-foreground">
          Various patterns for using the upgrade system throughout the app
        </p>
      </div>

      {/* Manual upgrade triggers */}
      <Card className="p-6">
        <h3 className="mb-4 font-medium">Manual Upgrade Triggers</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => openUpgradeModal({ tier: 'pro', trigger: 'manual' })}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>

          <Button
            onClick={() =>
              openUpgradeModal({ tier: 'pro_plus', trigger: 'manual' })
            }
            variant="outline"
          >
            <Shield className="mr-2 h-4 w-4" />
            Upgrade to Pro+
          </Button>

          <Button
            onClick={() =>
              openUpgradeModal({ tier: 'pro', trigger: 'feature_request' })
            }
            variant="outline"
          >
            <Crown className="mr-2 h-4 w-4" />
            Request Premium Features
          </Button>
        </div>
      </Card>

      {/* Feature gate examples */}
      <Card className="p-6">
        <h3 className="mb-4 font-medium">Feature Gates</h3>

        {/* API Access - Requires Pro+ */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium text-muted-foreground text-sm">
            API Access (Pro+ Required)
          </h4>
          <FeatureGate feature="api_access">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">API Access Enabled</span>
                <Badge variant="secondary">Pro+</Badge>
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                You can now use our REST API to integrate anubis.chat into your
                applications.
              </p>
            </div>
          </FeatureGate>
        </div>

        {/* Large File Upload - Requires Pro+ */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium text-muted-foreground text-sm">
            Large File Upload (Pro+ Required)
          </h4>
          <FeatureGate feature="large_files">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center space-x-2">
                <FileUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Large File Upload Available</span>
                <Badge variant="secondary">Pro+</Badge>
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Upload files up to 50MB for processing with AI models.
              </p>
            </div>
          </FeatureGate>
        </div>

        {/* Premium Models - Requires Pro */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium text-muted-foreground text-sm">
            Premium Models (Pro Required)
          </h4>
          <FeatureGate feature="premium_models">
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">
                  GPT-4o & Claude 3.5 Available
                </span>
                <Badge variant="secondary">Pro</Badge>
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Access to premium AI models for better responses.
              </p>
            </div>
          </FeatureGate>
        </div>
      </Card>

      {/* Programmatic feature checks */}
      <Card className="p-6">
        <h3 className="mb-4 font-medium">Programmatic Feature Checks</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800">
            <span className="text-sm">API Access:</span>
            <Badge
              variant={checkFeature('api_access') ? 'default' : 'secondary'}
            >
              {checkFeature('api_access') ? 'Available' : 'Requires Pro+'}
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800">
            <span className="text-sm">Premium Models:</span>
            <Badge
              variant={checkFeature('premium_models') ? 'default' : 'secondary'}
            >
              {checkFeature('premium_models') ? 'Available' : 'Requires Pro'}
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800">
            <span className="text-sm">Large File Upload:</span>
            <Badge
              variant={checkFeature('large_files') ? 'default' : 'secondary'}
            >
              {checkFeature('large_files') ? 'Available' : 'Requires Pro+'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Usage with require pattern */}
      <Card className="p-6">
        <h3 className="mb-4 font-medium">Require Feature Pattern</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          This demonstrates how to programmatically check and prompt for
          upgrades.
        </p>
        <div className="space-y-2">
          <Button
            onClick={() => {
              if (requireFeature('api_access')) {
                alert('API access is available! 🎉');
              }
            }}
            size="sm"
            variant="outline"
          >
            Try API Access Feature
          </Button>

          <Button
            onClick={() => {
              if (requireFeature('large_files')) {
                alert('Large file upload is available! 📁');
              }
            }}
            size="sm"
            variant="outline"
          >
            Try Large File Upload
          </Button>

          <Button
            onClick={() => {
              if (requireFeature('premium_models')) {
                alert('Premium models are available! ⚡');
              }
            }}
            size="sm"
            variant="outline"
          >
            Try Premium Models
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default UpgradeUsageExamples;
