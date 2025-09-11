/**
 * PDF Generation Service for Quota Reports
 * Generates professional PDF reports using server-side HTML to PDF conversion
 */

import { NextRequest, NextResponse } from 'next/server';

interface QuotaHistoryRecord {
  timestamp: string;
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  isLimitReached: boolean;
  apiCalls: number;
  service: string;
}

/**
 * Generate a professional PDF report as HTML (can be converted to PDF by browsers)
 */
export function generatePDFReport(records: QuotaHistoryRecord[], days: number): string {
  const currentDate = new Date().toLocaleDateString();
  const totalCalls = records.reduce((sum, r) => sum + r.apiCalls, 0);
  const avgDailyUsage = Math.round(totalCalls / records.length);
  const maxUsage = Math.max(...records.map(r => r.quotaUsed));
  const limitReachedDays = records.filter(r => r.isLimitReached).length;
  const avgUsagePercent = records.reduce((sum, r) => sum + (r.quotaUsed / r.quotaLimit), 0) / records.length * 100;

  // Calculate trends
  const recentRecords = records.slice(-7); // Last 7 days
  const olderRecords = records.slice(0, 7); // First 7 days
  const recentAvg = recentRecords.reduce((sum, r) => sum + r.quotaUsed, 0) / recentRecords.length;
  const olderAvg = olderRecords.reduce((sum, r) => sum + r.quotaUsed, 0) / olderRecords.length;
  const trendDirection = recentAvg > olderAvg ? '↗️ Increasing' : recentAvg < olderAvg ? '↘️ Decreasing' : '→ Stable';
  const trendPercent = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>API Quota Usage Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #1a202c; 
            background: #fff;
        }
        
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        
        .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5; 
            padding-bottom: 30px; 
            margin-bottom: 40px; 
        }
        
        .header h1 { 
            font-size: 32px; 
            font-weight: 700; 
            color: #4f46e5; 
            margin-bottom: 10px; 
        }
        
        .header .subtitle { 
            font-size: 16px; 
            color: #64748b; 
            font-weight: 500; 
        }
        
        .summary-section { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 40px; 
            border: 1px solid #e2e8f0; 
        }
        
        .summary-title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 25px; 
            color: #1e293b; 
        }
        
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 20px; 
            margin-bottom: 25px; 
        }
        
        .metric-card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            border: 1px solid #e2e8f0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        
        .metric-value { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 5px; 
        }
        
        .metric-value.primary { color: #4f46e5; }
        .metric-value.success { color: #059669; }
        .metric-value.warning { color: #d97706; }
        .metric-value.danger { color: #dc2626; }
        
        .metric-label { 
            font-size: 14px; 
            color: #64748b; 
            font-weight: 500; 
        }
        
        .insights { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 15px 20px; 
            border-radius: 6px; 
        }
        
        .insights h4 { 
            color: #92400e; 
            font-weight: 600; 
            margin-bottom: 8px; 
        }
        
        .insights p { 
            color: #78350f; 
            font-size: 14px; 
        }
        
        .table-section { 
            margin: 40px 0; 
        }
        
        .table-title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            color: #1e293b; 
        }
        
        .table-container { 
            overflow-x: auto; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0; 
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 14px; 
        }
        
        th { 
            background: #f8fafc; 
            padding: 15px 12px; 
            text-align: left; 
            font-weight: 600; 
            color: #374151; 
            border-bottom: 2px solid #e5e7eb; 
        }
        
        td { 
            padding: 12px; 
            border-bottom: 1px solid #f3f4f6; 
        }
        
        tr:hover { background: #fafbfc; }
        
        .status-normal { color: #059669; font-weight: 500; }
        .status-warning { color: #d97706; font-weight: 500; }
        .status-danger { color: #dc2626; font-weight: 500; }
        
        .usage-bar { 
            width: 60px; 
            height: 8px; 
            background: #f3f4f6; 
            border-radius: 4px; 
            overflow: hidden; 
            position: relative; 
        }
        
        .usage-fill { 
            height: 100%; 
            border-radius: 4px; 
            transition: width 0.3s ease; 
        }
        
        .usage-normal { background: #059669; }
        .usage-warning { background: #d97706; }
        .usage-danger { background: #dc2626; }
        
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #64748b; 
            font-size: 12px; 
        }
        
        .footer p { margin-bottom: 5px; }
        
        @media print { 
            body { margin: 0; }
            .container { max-width: none; padding: 20px; }
            .summary-section, .table-container { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>API Quota Usage Report</h1>
            <div class="subtitle">
                Generated on ${currentDate} • Analysis Period: ${days} days
            </div>
        </div>
        
        <div class="summary-section">
            <h2 class="summary-title">Executive Summary</h2>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value primary">${totalCalls.toLocaleString()}</div>
                    <div class="metric-label">Total API Calls</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value primary">${avgDailyUsage.toLocaleString()}</div>
                    <div class="metric-label">Avg Daily Usage</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${maxUsage > records[0]?.quotaLimit * 0.9 ? 'warning' : 'success'}">${maxUsage.toLocaleString()}</div>
                    <div class="metric-label">Peak Daily Usage</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${limitReachedDays > 0 ? 'danger' : 'success'}">${limitReachedDays}</div>
                    <div class="metric-label">Days Limit Reached</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${avgUsagePercent > 80 ? 'warning' : 'success'}">${avgUsagePercent.toFixed(1)}%</div>
                    <div class="metric-label">Avg Usage Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${trendDirection.includes('↗️') ? 'warning' : 'success'}">${trendDirection}</div>
                    <div class="metric-label">Usage Trend</div>
                </div>
            </div>
            
            <div class="insights">
                <h4>💡 Key Insights</h4>
                <p>
                    ${limitReachedDays > 0 
                        ? `⚠️ Quota limits were reached on ${limitReachedDays} day(s). Consider upgrading your plan or optimizing API usage.`
                        : '✅ No quota limits were reached during this period. Usage is within acceptable limits.'
                    }
                    ${Math.abs(parseFloat(trendPercent)) > 10 
                        ? ` Usage trend shows a ${Math.abs(parseFloat(trendPercent))}% ${parseFloat(trendPercent) > 0 ? 'increase' : 'decrease'} compared to the beginning of the period.`
                        : ' Usage has remained relatively stable throughout the period.'
                    }
                </p>
            </div>
        </div>
        
        <div class="table-section">
            <h2 class="table-title">Daily Usage Breakdown</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Service</th>
                            <th>Usage</th>
                            <th>Limit</th>
                            <th>Usage %</th>
                            <th>Visual</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => {
                            const date = new Date(record.timestamp).toLocaleDateString();
                            const usagePercent = (record.quotaUsed / record.quotaLimit) * 100;
                            const statusClass = record.isLimitReached ? 'status-danger' : usagePercent > 80 ? 'status-warning' : 'status-normal';
                            const status = record.isLimitReached ? '🚨 Limit Reached' : usagePercent > 90 ? '⚠️ High Usage' : usagePercent > 80 ? '📊 Moderate' : '✅ Normal';
                            const barClass = record.isLimitReached ? 'usage-danger' : usagePercent > 80 ? 'usage-warning' : 'usage-normal';
                            
                            return `
                            <tr>
                                <td style="font-weight: 500;">${date}</td>
                                <td>${record.service}</td>
                                <td style="font-weight: 500;">${record.quotaUsed.toLocaleString()}</td>
                                <td>${record.quotaLimit.toLocaleString()}</td>
                                <td style="font-weight: 500;">${usagePercent.toFixed(1)}%</td>
                                <td>
                                    <div class="usage-bar">
                                        <div class="usage-fill ${barClass}" style="width: ${Math.min(usagePercent, 100)}%"></div>
                                    </div>
                                </td>
                                <td class="${statusClass}">${status}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Equity Insight AI</strong> • API Quota Management System</p>
            <p>This report contains confidential information. For support or questions, contact your system administrator.</p>
            <p>Report generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `;
}
