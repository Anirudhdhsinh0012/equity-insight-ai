/**
 * API Routes for Quota Usage Export
 * /api/finnhub/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';
import { generatePDFReport } from '@/services/pdfReportService';

// Mock historical data for demonstration - in production this would come from a database
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
 * Generate mock historical quota data
 */
function generateMockHistoricalData(days: number): QuotaHistoryRecord[] {
  const records: QuotaHistoryRecord[] = [];
  const now = new Date();
  const currentStatus = finnhubService.getApiStatus();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Simulate realistic usage patterns
    const baseUsage = Math.floor(Math.random() * 800) + 100; // 100-900 calls per day
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendMultiplier = isWeekend ? 0.3 : 1; // Lower usage on weekends
    
    const dailyUsage = Math.floor(baseUsage * weekendMultiplier);
    const quotaLimit = currentStatus.quotaLimit;
    
    records.push({
      timestamp: date.toISOString(),
      quotaUsed: dailyUsage,
      quotaLimit: quotaLimit,
      quotaRemaining: quotaLimit - dailyUsage,
      isLimitReached: dailyUsage >= quotaLimit,
      apiCalls: dailyUsage,
      service: 'Finnhub'
    });
  }
  
  return records.reverse(); // Most recent first
}

/**
 * Generate CSV content from quota history
 */
function generateCSV(records: QuotaHistoryRecord[]): string {
  const headers = [
    'Date',
    'Time',
    'Service',
    'Quota Used',
    'Quota Limit', 
    'Quota Remaining',
    'Usage %',
    'Limit Reached',
    'API Calls'
  ];
  
  const csvRows = [headers.join(',')];
  
  records.forEach(record => {
    const date = new Date(record.timestamp);
    const usagePercent = ((record.quotaUsed / record.quotaLimit) * 100).toFixed(2);
    
    const row = [
      date.toISOString().split('T')[0], // Date
      date.toISOString().split('T')[1].split('.')[0], // Time
      record.service,
      record.quotaUsed.toString(),
      record.quotaLimit.toString(),
      record.quotaRemaining.toString(),
      `${usagePercent}%`,
      record.isLimitReached ? 'Yes' : 'No',
      record.apiCalls.toString()
    ];
    
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Generate simple PDF content (HTML that can be printed as PDF)
 */
function generatePDFHTML(records: QuotaHistoryRecord[], days: number): string {
  const currentDate = new Date().toLocaleDateString();
  const totalCalls = records.reduce((sum, r) => sum + r.apiCalls, 0);
  const avgDailyUsage = Math.round(totalCalls / records.length);
  const maxUsage = Math.max(...records.map(r => r.quotaUsed));
  const limitReachedDays = records.filter(r => r.isLimitReached).length;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>API Quota Usage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .metric-label { font-size: 14px; color: #64748B; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; }
        th { background: #F1F5F9; font-weight: 600; }
        .warning { color: #DC2626; font-weight: 600; }
        .success { color: #059669; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748B; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>API Quota Usage Report</h1>
        <p>Generated on ${currentDate} | Period: Last ${days} days</p>
    </div>
    
    <div class="summary">
        <h2>Summary Statistics</h2>
        <div class="summary-grid">
            <div class="metric">
                <div class="metric-value">${totalCalls.toLocaleString()}</div>
                <div class="metric-label">Total API Calls</div>
            </div>
            <div class="metric">
                <div class="metric-value">${avgDailyUsage.toLocaleString()}</div>
                <div class="metric-label">Avg Daily Usage</div>
            </div>
            <div class="metric">
                <div class="metric-value">${maxUsage.toLocaleString()}</div>
                <div class="metric-label">Peak Daily Usage</div>
            </div>
            <div class="metric">
                <div class="metric-value ${limitReachedDays > 0 ? 'warning' : 'success'}">${limitReachedDays}</div>
                <div class="metric-label">Days Limit Reached</div>
            </div>
        </div>
    </div>
    
    <h2>Daily Usage Details</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Usage</th>
                <th>Limit</th>
                <th>Usage %</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${records.map(record => {
                const date = new Date(record.timestamp).toLocaleDateString();
                const usagePercent = ((record.quotaUsed / record.quotaLimit) * 100).toFixed(1);
                const statusClass = record.isLimitReached ? 'warning' : '';
                const status = record.isLimitReached ? '⚠️ Limit Reached' : '✅ Normal';
                
                return `
                <tr>
                    <td>${date}</td>
                    <td>${record.service}</td>
                    <td>${record.quotaUsed.toLocaleString()}</td>
                    <td>${record.quotaLimit.toLocaleString()}</td>
                    <td>${usagePercent}%</td>
                    <td class="${statusClass}">${status}</td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>This report was generated automatically by the Equity Insight AI system.</p>
        <p>For questions or support, please contact your system administrator.</p>
    </div>
</body>
</html>
  `;
}

/**
 * GET /api/finnhub/export
 * Export quota usage data as CSV or PDF
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const days = parseInt(searchParams.get('days') || '30');
    
    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or pdf.' },
        { status: 400 }
      );
    }
    
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365.' },
        { status: 400 }
      );
    }
    
    // Generate historical data (in production, fetch from database)
    const historicalData = generateMockHistoricalData(days);
    
    if (format === 'csv') {
      const csvContent = generateCSV(historicalData);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="quota-usage-${days}days-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === 'pdf') {
      const htmlContent = generatePDFReport(historicalData, days);
      
      // Return HTML that can be printed as PDF by the browser
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="quota-usage-report-${days}days-${new Date().toISOString().split('T')[0]}.html"`
        }
      });
    }
  
    // Fallback: ensure a Response is always returned
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Error exporting quota data:', error);
    return NextResponse.json(
      { error: 'Internal server error during export' },
      { status: 500 }
    );
  }
}
