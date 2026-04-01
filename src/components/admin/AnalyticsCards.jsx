import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AnalyticsCards = ({ stats }) => {
  if (!stats) return null;

  // User distribution chart
  const userDistributionData = {
    labels: ['Clients', 'Garages', 'Admins'],
    datasets: [
      {
        label: 'Users',
        data: [stats.users?.clients || 0, stats.users?.garages || 0, stats.users?.admins || 0],
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  // Job status chart
  const jobStatusData = {
    labels: ['Pending', 'Accepted', 'En Route', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Jobs',
        data: [
          stats.jobs?.pending || 0,
          stats.jobs?.accepted || 0,
          stats.jobs?.en_route || 0,
          stats.jobs?.in_progress || 0,
          stats.jobs?.completed || 0,
          stats.jobs?.cancelled || 0,
        ],
        backgroundColor: ['#f59e0b', '#ef4444', '#f97316', '#3b82f6', '#10b981', '#6b7280'],
        borderWidth: 0,
      },
    ],
  };

  // Monthly job trends (mock data - would come from real data)
  const monthlyTrendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Jobs Completed',
        data: [12, 19, 15, 25, 22, 30, 35, 42, 48, 55, 62, 70],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Jobs Total',
        data: [15, 25, 22, 35, 32, 42, 48, 58, 65, 75, 85, 95],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="h-64">
            <Pie data={userDistributionData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Total Users: {stats.users?.total || 0}
          </div>
        </div>

        {/* Job Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
          <div className="h-64">
            <Bar data={jobStatusData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Job Trends</h3>
        <div className="h-80">
          <Line data={monthlyTrendsData} options={chartOptions} />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Completion Rate</p>
          <p className="text-2xl font-bold">{stats.jobs?.completionRate || 0}%</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Active Garages</p>
          <p className="text-2xl font-bold">{stats.garages?.active || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Verified Garages</p>
          <p className="text-2xl font-bold">{stats.garages?.verified || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Avg Rating</p>
          <p className="text-2xl font-bold">{stats.averageRating || 0} ★</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;