'use client';

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentAdminMonitoring } from '@/hooks/use-payment-monitoring';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

const _log = createModuleLogger('paymentDashboard');

interface PaymentDashboardProps {
  className?: string;
}

export function PaymentDashboard({ className }: PaymentDashboardProps) {
  const {
    metrics,
    health,
    alerts,
    performance,
    hasRecentErrors,
    successRate,
    overallStatus,
  } = usePaymentAdminMonitoring();

  const handleRefresh = () => {
    window.location.reload();
  };

  const renderHealthCard = () => {
    const statusConfig = {
      healthy: {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle,
        label: 'Healthy',
        description: 'All systems operational',
      },
      warning: {
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: AlertCircle,
        label: 'Warning',
        description: 'Some issues detected',
      },
      critical: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
        label: 'Critical',
        description: 'Immediate attention required',
      },
      loading: {
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: Clock,
        label: 'Loading',
        description: 'Fetching system status',
      },
    };

    const config =
      statusConfig[overallStatus as keyof typeof statusConfig] ||
      statusConfig.loading;
    const StatusIcon = config.icon;

    return (
      <Card className={cn('border-2', config.color)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-6 w-6" />
              <div>
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </div>
            <Badge
              variant={overallStatus === 'healthy' ? 'default' : 'destructive'}
            >
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-2xl">
                {successRate.toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-xs">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">
                {health?.metrics.last24h.totalEvents || 0}
              </div>
              <div className="text-muted-foreground text-xs">24h Events</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">
                {health?.metrics.last24h.criticalErrors || 0}
              </div>
              <div className="text-muted-foreground text-xs">
                Critical Errors
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">
                {health?.metrics.lastHour.avgProcessingTime || 0}ms
              </div>
              <div className="text-muted-foreground text-xs">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMetricsCards = () => {
    if (!metrics) {
      return null;
    }

    const metricsData = [
      {
        title: 'Total Payments',
        value:
          metrics.metrics.successfulPayments + metrics.metrics.failedPayments,
        icon: DollarSign,
        description: '24 hour total',
        color: 'text-blue-600',
      },
      {
        title: 'Successful',
        value: metrics.metrics.successfulPayments,
        icon: CheckCircle,
        description: `${metrics.metrics.successRate}% success rate`,
        color: 'text-green-600',
      },
      {
        title: 'Failed',
        value: metrics.metrics.failedPayments,
        icon: XCircle,
        description: 'Requires investigation',
        color: 'text-red-600',
      },
      {
        title: 'Processing Time',
        value: `${metrics.metrics.avgProcessingTime}ms`,
        icon: Clock,
        description: 'Average response time',
        color: 'text-purple-600',
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsData.map((metric, metricIndex) => {
          const Icon = metric.icon;
          return (
            <Card key={`${metric.title}-${metricIndex}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {metric.title}
                </CardTitle>
                <Icon className={cn('h-4 w-4', metric.color)} />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{metric.value}</div>
                <p className="text-muted-foreground text-xs">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderAlertsPanel = () => {
    if (!alerts || alerts.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Recent Alerts</span>
            </CardTitle>
            <CardDescription>No recent errors or warnings</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Recent Alerts</span>
            <Badge variant="destructive">{alerts.length}</Badge>
          </CardTitle>
          <CardDescription>
            Errors and warnings from the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map(
              (
                alert: {
                  eventType: string;
                  severity: string;
                  timestamp: number;
                  message: string;
                },
                alertIndex: number
              ) => {
                const severityConfig = {
                  critical: 'bg-red-100 text-red-800 border-red-200',
                  error: 'bg-red-50 text-red-700 border-red-100',
                  warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                };

                return (
                  <Alert
                    className={
                      severityConfig[
                        alert.severity as keyof typeof severityConfig
                      ]
                    }
                    key={`${alert.timestamp}-${alertIndex}`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {alert.eventType.replace('_', ' ')}
                          </div>
                          <div className="text-xs opacity-90">
                            {alert.message}
                          </div>
                          <div className="mt-1 text-xs opacity-75">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceChart = () => {
    if (!performance?.hourlyData) {
      return null;
    }

    const data = performance.hourlyData.slice(-12); // Last 12 hours

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Performance Trends</span>
          </CardTitle>
          <CardDescription>
            Hourly payment success rates and processing times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map(
              (
                hour: {
                  hour: string;
                  successful: number;
                  failed: number;
                  successRate: number;
                  avgProcessingTime: number;
                },
                hourIndex: number
              ) => {
                const hourlySuccessRate = hour.successRate;
                const total = hour.successful + hour.failed;
                const time = new Date(`${hour.hour}:00`).toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                // Helper function to get success rate color
                const getSuccessRateColor = (rate: number): string => {
                  if (rate >= 95) {
                    return 'text-green-600';
                  }
                  if (rate >= 80) {
                    return 'text-yellow-600';
                  }
                  return 'text-red-600';
                };

                return (
                  <div className="space-y-2" key={`${hour.hour}-${hourIndex}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{time}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground">
                          {total} payments
                        </span>
                        <span
                          className={cn(
                            'font-medium',
                            getSuccessRateColor(hourlySuccessRate)
                          )}
                        >
                          {hourlySuccessRate.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {hour.avgProcessingTime}ms
                        </span>
                      </div>
                    </div>
                    <Progress className="h-2" value={hourlySuccessRate} />
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderErrorDistribution = () => {
    if (!metrics?.metrics.errorDistribution) {
      return null;
    }

    const errorTypes = Object.entries(metrics.metrics.errorDistribution);
    const totalErrors = errorTypes.reduce(
      (sum: number, [_, count]: [string, unknown]) => sum + (count as number),
      0
    );

    if (totalErrors === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Error Distribution</span>
            </CardTitle>
            <CardDescription>
              No errors in the selected timeframe
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Error Distribution</span>
          </CardTitle>
          <CardDescription>
            Breakdown of error types in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorTypes.map(([errorCode, count]: [string, unknown]) => {
              const percentage = (
                ((count as number) / totalErrors) *
                100
              ).toFixed(1);

              return (
                <div className="space-y-2" key={errorCode}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {errorCode.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">
                        {count as number} errors
                      </span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  </div>
                  <Progress
                    className="h-2"
                    value={Number.parseFloat(percentage)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span>Quick Actions</span>
        </CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Button className="w-full" onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>

          <Button
            className="w-full"
            onClick={() => window.open('https://status.solana.com/', '_blank')}
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Solana Network Status
          </Button>

          <Button
            className="w-full"
            onClick={() =>
              window.open('https://explorer.solana.com/', '_blank')
            }
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Solana Explorer
          </Button>

          {/* Support email removed per policy */}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Payment System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor Solana payment processing and system health
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {renderHealthCard()}

      {/* Key Metrics */}
      {renderMetricsCards()}

      {/* Detailed Analysis Tabs */}
      <Tabs className="space-y-4" defaultValue="performance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="performance">
          {renderPerformanceChart()}
        </TabsContent>

        <TabsContent className="space-y-4" value="errors">
          {renderErrorDistribution()}
        </TabsContent>

        <TabsContent className="space-y-4" value="alerts">
          {renderAlertsPanel()}
        </TabsContent>

        <TabsContent className="space-y-4" value="actions">
          {renderQuickActions()}
        </TabsContent>
      </Tabs>

      {/* Critical Alerts Section */}
      {hasRecentErrors && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Attention Required:</strong> Recent payment processing
                errors detected. Review the alerts tab for details.
              </div>
              <Button
                onClick={() => {
                  const alertsTab = document.querySelector(
                    '[value="alerts"]'
                  ) as HTMLElement;
                  alertsTab?.click();
                }}
                size="sm"
                variant="outline"
              >
                View Alerts
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Footer with last updated timestamp */}
      <div className="text-center text-muted-foreground text-xs">
        Last updated: {new Date().toLocaleString()} • Data refreshes
        automatically every 30 seconds
      </div>
    </div>
  );
}

export default PaymentDashboard;
