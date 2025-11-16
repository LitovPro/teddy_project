'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Family {
  id: string
  clientCode: string
  phone?: string
  waId?: string
  lang: string
  kidsCount?: number
  createdAt: string
  loyaltyCounter?: {
    currentCycleCount: number
    totalVisits: number
  }
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)

  const searchFamilies = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/families/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setFamilies(data.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const recordVisit = async (familyId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/loyalty/visit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: familyId, // Temporary hack - using familyId as code
          source: 'DESK',
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh family data
        searchFamilies()
        alert('Visit recorded successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to record visit')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Families</h1>
        <p className="text-muted-foreground">
          Search and manage family accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Families</CardTitle>
          <CardDescription>
            Search by client code, phone number, or WhatsApp ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter client code, phone, or WhatsApp ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchFamilies()}
            />
            <Button onClick={searchFamilies} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {families.length > 0 && (
        <div className="grid gap-4">
          {families.map((family) => (
            <Card key={family.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{family.clientCode}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {family.lang === 'PT' ? '🇵🇹' : '🇬🇧'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {family.phone && `📱 ${family.phone}`}
                  {family.waId && ` • WhatsApp: ${family.waId}`}
                  {family.kidsCount && ` • ${family.kidsCount} kids`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <strong>Loyalty Progress:</strong>{' '}
                      {family.loyaltyCounter?.currentCycleCount || 0}/5 visits
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total visits: {family.loyaltyCounter?.totalVisits || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(family.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedFamily(family)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recordVisit(family.id)}
                    >
                      +1 Visit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedFamily && (
        <Card>
          <CardHeader>
            <CardTitle>Family Details - {selectedFamily.clientCode}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <p className="text-sm">Phone: {selectedFamily.phone || 'Not provided'}</p>
                <p className="text-sm">WhatsApp: {selectedFamily.waId || 'Not provided'}</p>
                <p className="text-sm">Language: {selectedFamily.lang}</p>
                <p className="text-sm">Kids: {selectedFamily.kidsCount || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Loyalty Status</h4>
                <p className="text-sm">
                  Current cycle: {selectedFamily.loyaltyCounter?.currentCycleCount || 0}/5
                </p>
                <p className="text-sm">
                  Total visits: {selectedFamily.loyaltyCounter?.totalVisits || 0}
                </p>
                <p className="text-sm">
                  Member since: {new Date(selectedFamily.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedFamily(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
