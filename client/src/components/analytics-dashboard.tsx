import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  FileText,
  Users,
  Calendar,
  Download,
  Filter
} from "lucide-react";

interface AnalyticsDashboardProps {
  submissions: any[];
  investigators: any[];
}

export default function AnalyticsDashboard({ submissions, investigators }: AnalyticsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");
  const [selectedTrust, setSelectedTrust] = useState("all");

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const now = new Date();
    const timeframeDays = parseInt(selectedTimeframe);
    const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    // Filter submissions by timeframe
    const filteredSubmissions = submissions.filter(submission => {
      const submissionDate = new Date(submission.submittedAt);
      return submissionDate >= cutoffDate;
    });

    // Further filter by trust if selected
    const finalSubmissions = selectedTrust === "all" 
      ? filteredSubmissions 
      : filteredSubmissions.filter(s => s.hospitalTrust === selectedTrust);

    // Status distribution
    const statusCounts = finalSubmissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});

    // Priority distribution
    const priorityCounts = finalSubmissions.reduce((acc, sub) => {
      acc[sub.priority] = (acc[sub.priority] || 0) + 1;
      return acc;
    }, {});

    // Category distribution
    const categoryCounts = finalSubmissions.reduce((acc, sub) => {
      if (sub.category) {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
      }
      return acc;
    }, {});

    // Trust distribution
    const trustCounts = finalSubmissions.reduce((acc, sub) => {
      if (sub.hospitalTrust) {
        acc[sub.hospitalTrust] = (acc[sub.hospitalTrust] || 0) + 1;
      }
      return acc;
    }, {});

    // Timeline data (last 30 days)
    const timelineData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const daySubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.submittedAt);
        return subDate.toDateString() === date.toDateString();
      });
      
      timelineData.push({
        date: date.toLocaleDateString(),
        submissions: daySubmissions.length,
        critical: daySubmissions.filter(s => s.priority === 'critical').length,
        resolved: daySubmissions.filter(s => s.status === 'resolved').length
      });
    }

    // Calculate completion rates
    const totalCases = finalSubmissions.length;
    const resolvedCases = finalSubmissions.filter(s => s.status === 'resolved').length;
    const completionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

    // Calculate average resolution time
    const resolvedWithTimes = finalSubmissions.filter(s => s.status === 'resolved');
    const avgResolutionDays = resolvedWithTimes.length > 0 
      ? resolvedWithTimes.reduce((sum, sub) => {
          const submitted = new Date(sub.submittedAt);
          const updated = new Date(sub.lastUpdated);
          const days = Math.ceil((updated.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / resolvedWithTimes.length
      : 0;

    return {
      totalSubmissions: finalSubmissions.length,
      statusCounts,
      priorityCounts,
      categoryCounts,
      trustCounts,
      timelineData,
      completionRate,
      avgResolutionDays,
      criticalCases: finalSubmissions.filter(s => s.priority === 'critical').length,
      overdueCase: finalSubmissions.filter(s => {
        const daysSince = Math.ceil((now.getTime() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince > 28 && s.status !== 'resolved';
      }).length
    };
  }, [submissions, selectedTimeframe, selectedTrust]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Get unique trusts for filter
  const uniqueTrusts = Array.from(new Set(submissions.map(s => s.hospitalTrust).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive oversight and reporting analytics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTrust} onValueChange={setSelectedTrust}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Trusts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NHS Trusts</SelectItem>
              {uniqueTrusts.map(trust => (
                <SelectItem key={trust} value={trust}>{trust}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {selectedTimeframe} day period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analyticsData.criticalCases}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate.toFixed(1)}%</div>
            <Progress value={analyticsData.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgResolutionDays.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trusts">By Trust</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Case Status Distribution</CardTitle>
                <CardDescription>Current status of all reports</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analyticsData.statusCounts).map(([status, count]) => ({
                        name: status.charAt(0).toUpperCase() + status.slice(1),
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analyticsData.statusCounts).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Levels</CardTitle>
                <CardDescription>Distribution by urgency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analyticsData.priorityCounts).map(([priority, count]) => ({
                    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trusts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports by NHS Trust</CardTitle>
              <CardDescription>Geographic distribution of whistleblowing reports</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={Object.entries(analyticsData.trustCounts)
                    .map(([trust, count]) => ({ trust: trust.length > 20 ? trust.substring(0, 20) + '...' : trust, count }))
                    .sort((a, b) => (b.count as number) - (a.count as number))
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trust" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Categories</CardTitle>
              <CardDescription>Types of issues being reported</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={Object.entries(analyticsData.categoryCounts).map(([category, count]) => ({
                  category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Timeline</CardTitle>
              <CardDescription>Daily report submissions over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="submissions" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Total Submissions"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="critical" 
                    stackId="2"
                    stroke="#ff7300" 
                    fill="#ff7300" 
                    name="Critical Cases"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Capabilities
          </CardTitle>
          <CardDescription>
            Future versions will support comprehensive report generation and data export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Executive Summary</h4>
              <p className="text-sm text-gray-600 mt-1">High-level overview for NHS leadership</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Trust-Specific Reports</h4>
              <p className="text-sm text-gray-600 mt-1">Detailed analysis per NHS Trust</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Trend Analysis</h4>
              <p className="text-sm text-gray-600 mt-1">Longitudinal patterns and insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}