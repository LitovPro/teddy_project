'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Voucher {
  id: string;
  code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  issuedAt: string;
  validUntil: string;
  redeemedAt?: string;
  family: {
    clientCode: string;
    phone?: string;
  };
  redeemedByStaff?: {
    name: string;
  };
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const redeemVoucher = async () => {
    if (!redeemCode.trim()) return;

    setIsRedeeming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: redeemCode,
          staffId: 'current-staff-id', // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Voucher redeemed successfully!');
        setRedeemCode('');
        fetchVouchers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to redeem voucher');
    } finally {
      setIsRedeeming(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.family.clientCode
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50';
      case 'REDEEMED':
        return 'text-blue-600 bg-blue-50';
      case 'EXPIRED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vouchers</h1>
        <p className="text-muted-foreground">Manage and redeem vouchers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Redeem Voucher</CardTitle>
          <CardDescription>Enter voucher code to redeem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter voucher code (e.g., TF-123456)"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && redeemVoucher()}
            />
            <Button
              onClick={redeemVoucher}
              disabled={isRedeeming || !redeemCode.trim()}
            >
              {isRedeeming ? 'Redeeming...' : 'Redeem'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Vouchers</CardTitle>
          <CardDescription>Search and view all vouchers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by voucher code or client code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading vouchers...</div>
          ) : (
            <div className="space-y-4">
              {filteredVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">
                        {voucher.code}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(voucher.status)}`}
                      >
                        {voucher.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Family: {voucher.family.clientCode}
                      {voucher.family.phone && ` • ${voucher.family.phone}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Issued: {new Date(voucher.issuedAt).toLocaleDateString()}
                      {' • '}
                      Valid until:{' '}
                      {new Date(voucher.validUntil).toLocaleDateString()}
                      {voucher.redeemedAt && (
                        <>
                          {' • '}
                          Redeemed:{' '}
                          {new Date(voucher.redeemedAt).toLocaleDateString()}
                          {voucher.redeemedByStaff &&
                            ` by ${voucher.redeemedByStaff.name}`}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {voucher.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRedeemCode(voucher.code);
                          redeemVoucher();
                        }}
                      >
                        Redeem
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {filteredVouchers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No vouchers found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
