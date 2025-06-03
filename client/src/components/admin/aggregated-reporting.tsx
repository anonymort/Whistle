import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, AlertTriangle, Building2, Calendar } from "lucide-react";

interface AggregatedData {
  totalSubmissions: number;
  submissionsByTrust: Array<{ trust: string; count: number; percentage: number }>;
  submissionsByCategory: Array<{ category: string; count: number; percentage: number }>;
  submissionsByRiskLevel: Array<{ riskLevel: string; count: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; submissions: number; criticalCount: number }>;
  averageResolutionTime: number;
  escalationRate: number;
}

interface AggregatedReportingProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

export default function AggregatedReporting({ timeRange, onTimeRangeChange }: AggregatedReportingProps) {
  const [reportType, setReportType] = useState<'summary' | 'trends' | 'patterns'>('summary');

  const { data: aggregatedData, isLoading } = useQuery<AggregatedData>({
    queryKey: ['/api/admin/aggregated-report', timeRange],
    enabled: true,
  });

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/admin/export-aggregated-report?timeRange=${timeRange}&type=${reportType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `DAUK_Aggregated_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!aggregatedData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No aggregated data available for the selected time range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aggregated Reporting</h2>
          <p className="text-gray-600">Anonymous data patterns for regulatory reporting</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary Report</SelectItem>
              <SelectItem value="trends">Trend Analysis</SelectItem>
              <SelectItem value="patterns">Pattern Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExportReport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export for CQC/HSSIB</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{aggregatedData.totalSubmissions}</p>
                <p className="text-sm text-gray-600">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{aggregatedData.averageResolutionTime}</p>
                <p className="text-sm text-gray-600">Avg Resolution (Days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{(aggregatedData.escalationRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Escalation Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{aggregatedData.submissionsByTrust.length}</p>
                <p className="text-sm text-gray-600">Trusts Reporting</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions by Trust */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by NHS Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aggregatedData.submissionsByTrust.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="trust" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aggregatedData.submissionsByRiskLevel}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ riskLevel, percentage }) => `${riskLevel}: ${percentage.toFixed(1)}%`}
                >
                  {aggregatedData.submissionsByRiskLevel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Submission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aggregatedData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#3B82F6" name="Total Submissions" />
                <Bar dataKey="criticalCount" fill="#EF4444" name="Critical Cases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-right p-2 font-medium">Count</th>
                  <th className="text-right p-2 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.submissionsByCategory.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.category}</td>
                    <td className="p-2 text-right">{item.count}</td>
                    <td className="p-2 text-right">{item.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Regulatory Reporting</h4>
              <p className="text-sm text-blue-700">
                This aggregated data contains no personal identifiers and complies with GDPR requirements. 
                Reports are prepared for quarterly submission to HSSIB and CQC as part of DAUK's patient safety advocacy.
                All individual submission details remain encrypted and accessible only to authorized DAUK reviewers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}