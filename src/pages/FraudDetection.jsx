import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle2,
  RefreshCw, Eye, TrendingUp, Zap, Clock, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FraudAlertCard from '../components/fraud/FraudAlertCard';
import FraudScanPanel from '../components/fraud/FraudScanPanel';

export default function FraudDetection() {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (userData.role !== 'admin' && userData.user_type !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['fraudBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 200),
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['fraudPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
    enabled: !!user,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['fraudTechnicians'],
    queryFn: () => base44.entities.Technician.list('-created_date', 100),
    enabled: !!user,
  });

  const runAIScan = async () => {
    setIsScanning(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fraud detection AI for a home services marketplace called Fixie. 
Analyze the following data and identify any suspicious patterns, anomalies, or potential fraud.

BOOKINGS (last 200): ${JSON.stringify(bookings.slice(0, 50).map(b => ({
  id: b.id?.slice(-8),
  category: b.category,
  status: b.status,
  estimated_price: b.estimated_price,
  final_price: b.final_price,
  payment_status: b.payment_status,
  created_date: b.created_date,
  user_id: b.user_id?.slice(-8),
  technician_id: b.technician_id?.slice(-8),
})))}

PAYMENTS (last 50): ${JSON.stringify(payments.slice(0, 50).map(p => ({
  id: p.id?.slice(-8),
  booking_id: p.booking_id?.slice(-8),
  amount: p.amount,
  method: p.method,
  status: p.status,
  created_date: p.created_date,
})))}

TECHNICIANS: ${JSON.stringify(technicians.slice(0, 30).map(t => ({
  id: t.id?.slice(-8),
  name: t.name,
  rating: t.rating,
  total_reviews: t.total_reviews,
  total_jobs: t.total_jobs,
  wallet_balance: t.wallet_balance,
  verification_status: t.verification_status,
})))}

Return a JSON with fraud alerts. Each alert must have:
- id: unique string
- severity: "high" | "medium" | "low"
- type: short category label (e.g. "Price Inflation", "Fake Reviews", "Duplicate Booking", "Unusual Payment Pattern", "Account Takeover Risk", "Identity Fraud")
- title: short alert title
- description: detailed explanation of the suspicious pattern detected
- affected_id: the booking/technician/payment ID involved (use the last 8 chars)
- affected_type: "booking" | "technician" | "payment"
- recommendation: what admin action to take
- confidence: number 0-100

Generate at least 3 realistic alerts based on the actual data patterns, or general risk factors even if data is limited.`,
        response_json_schema: {
          type: 'object',
          properties: {
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  severity: { type: 'string' },
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  affected_id: { type: 'string' },
                  affected_type: { type: 'string' },
                  recommendation: { type: 'string' },
                  confidence: { type: 'number' },
                },
              },
            },
            summary: { type: 'string' },
            risk_score: { type: 'number' },
          },
        },
      });
      setAlerts(result.alerts || []);
      setLastScan({ summary: result.summary, risk_score: result.risk_score, time: new Date() });
    } catch (e) {
      console.error(e);
    }
    setIsScanning(false);
  };

  const highAlerts = alerts.filter(a => a.severity === 'high');
  const medAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  if (!user) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-500" />
                AI Fraud Detection
              </h1>
              <p className="text-gray-500">Real-time AI-powered security monitoring</p>
            </div>
          </div>
          <Button
            onClick={runAIScan}
            disabled={isScanning}
            className="bg-red-600 hover:bg-red-700"
          >
            {isScanning ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Run AI Scan</>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{highAlerts.length}</p>
                  <p className="text-sm text-gray-500">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{medAlerts.length}</p>
                  <p className="text-sm text-gray-500">Medium Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{lowAlerts.length}</p>
                  <p className="text-sm text-gray-500">Low Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {lastScan ? `${lastScan.risk_score}%` : '—'}
                  </p>
                  <p className="text-sm text-gray-500">Platform Risk Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last scan summary */}
        {lastScan && (
          <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                Last Scan: {format(lastScan.time, 'MMM d, yyyy h:mm a')}
              </p>
              <p className="text-sm text-gray-600 mt-1">{lastScan.summary}</p>
            </div>
          </div>
        )}

        {/* Scan Panel or Results */}
        {alerts.length === 0 ? (
          <FraudScanPanel onScan={runAIScan} isScanning={isScanning} />
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="bg-white border">
              <TabsTrigger value="all">All Alerts ({alerts.length})</TabsTrigger>
              <TabsTrigger value="high" className="text-red-600">High ({highAlerts.length})</TabsTrigger>
              <TabsTrigger value="medium" className="text-amber-600">Medium ({medAlerts.length})</TabsTrigger>
              <TabsTrigger value="low">Low ({lowAlerts.length})</TabsTrigger>
            </TabsList>

            {['all', 'high', 'medium', 'low'].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                {(tab === 'all' ? alerts : alerts.filter(a => a.severity === tab)).map(alert => (
                  <FraudAlertCard key={alert.id} alert={alert} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}