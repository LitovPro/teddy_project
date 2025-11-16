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

interface Broadcast {
  id: string;
  templateName: string;
  language: 'EN' | 'PT';
  audience: 'ALL' | 'SUBSCRIBERS_EVENTS' | 'SUBSCRIBERS_PROMOS';
  variables?: Record<string, string>;
  status: 'DRAFT' | 'SENT' | 'FAILED';
  sentAt?: string;
  recipientCount?: number;
  createdAt: string;
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    templateName: '',
    language: 'EN' as 'EN' | 'PT',
    audience: 'ALL' as 'ALL' | 'SUBSCRIBERS_EVENTS' | 'SUBSCRIBERS_PROMOS',
    variables: {} as Record<string, string>,
  });
  const [isSending, setIsSending] = useState(false);

  const fetchBroadcasts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/broadcasts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBroadcasts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!newBroadcast.templateName.trim()) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBroadcast),
      });

      const data = await response.json();
      if (data.success) {
        alert('Broadcast sent successfully!');
        setNewBroadcast({
          templateName: '',
          language: 'EN',
          audience: 'ALL',
          variables: {},
        });
        fetchBroadcasts();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const addVariable = () => {
    setNewBroadcast({
      ...newBroadcast,
      variables: {
        ...newBroadcast.variables,
        '': '',
      },
    });
  };

  const updateVariable = (key: string, value: string) => {
    const newVariables = { ...newBroadcast.variables };
    if (value === '') {
      delete newVariables[key];
    } else {
      newVariables[key] = value;
    }
    setNewBroadcast({
      ...newBroadcast,
      variables: newVariables,
    });
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'DRAFT':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'ALL':
        return 'All Families';
      case 'SUBSCRIBERS_EVENTS':
        return 'Event Subscribers';
      case 'SUBSCRIBERS_PROMOS':
        return 'Promo Subscribers';
      default:
        return audience;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Broadcasts</h1>
        <p className="text-muted-foreground">Send messages to families</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Broadcast</CardTitle>
          <CardDescription>Send a message to selected families</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="e.g., welcome, event_reminder, promo_offer"
                value={newBroadcast.templateName}
                onChange={(e) =>
                  setNewBroadcast({
                    ...newBroadcast,
                    templateName: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newBroadcast.language}
                  onChange={(e) =>
                    setNewBroadcast({
                      ...newBroadcast,
                      language: e.target.value as 'EN' | 'PT',
                    })
                  }
                >
                  <option value="EN">English</option>
                  <option value="PT">Portuguese</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Audience</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newBroadcast.audience}
                  onChange={(e) =>
                    setNewBroadcast({
                      ...newBroadcast,
                      audience: e.target.value as any,
                    })
                  }
                >
                  <option value="ALL">All Families</option>
                  <option value="SUBSCRIBERS_EVENTS">Event Subscribers</option>
                  <option value="SUBSCRIBERS_PROMOS">Promo Subscribers</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Template Variables
                </label>
                <Button size="sm" variant="outline" onClick={addVariable}>
                  Add Variable
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(newBroadcast.variables).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input
                      placeholder="Variable name (e.g., offer)"
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        const newVariables = { ...newBroadcast.variables };
                        delete newVariables[key];
                        if (newKey) {
                          newVariables[newKey] = value;
                        }
                        setNewBroadcast({
                          ...newBroadcast,
                          variables: newVariables,
                        });
                      }}
                    />
                    <Input
                      placeholder="Variable value (e.g., 20% off)"
                      value={value}
                      onChange={(e) => updateVariable(key, e.target.value)}
                    />
                  </div>
                ))}
                {Object.keys(newBroadcast.variables).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No variables added. Add variables to customize your message.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendBroadcast}
                disabled={isSending || !newBroadcast.templateName.trim()}
              >
                {isSending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
          <CardDescription>Previous broadcasts sent</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading broadcasts...</div>
          ) : (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {broadcast.templateName}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(broadcast.status)}`}
                      >
                        {broadcast.status}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {broadcast.language === 'PT' ? '🇵🇹' : '🇬🇧'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Audience: {getAudienceLabel(broadcast.audience)}
                      {broadcast.recipientCount &&
                        ` • ${broadcast.recipientCount} recipients`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created:{' '}
                      {new Date(broadcast.createdAt).toLocaleDateString()}
                      {broadcast.sentAt && (
                        <>
                          {' • '}
                          Sent:{' '}
                          {new Date(broadcast.sentAt).toLocaleDateString()}
                        </>
                      )}
                    </p>
                    {Object.keys(broadcast.variables || {}).length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Variables:{' '}
                        {Object.entries(broadcast.variables || {})
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {broadcasts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No broadcasts found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
