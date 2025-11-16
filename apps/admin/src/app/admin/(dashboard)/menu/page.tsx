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

interface MenuItem {
  id: string;
  sku: string;
  nameEn: string;
  namePt: string;
  descEn?: string;
  descPt?: string;
  priceCents: number;
  category: 'FOOD' | 'DRINKS';
  isActive: boolean;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    sku: '',
    nameEn: '',
    namePt: '',
    descEn: '',
    descPt: '',
    priceCents: 0,
    category: 'FOOD' as 'FOOD' | 'DRINKS',
    isActive: true,
  });

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu?lang=EN');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMenuItem = async (item: Partial<MenuItem>) => {
    try {
      const token = localStorage.getItem('token');
      const url = item.id ? `/api/menu/${item.id}` : '/api/menu';
      const method = item.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const data = await response.json();
      if (data.success) {
        fetchMenuItems();
        setEditingItem(null);
        setNewItem({
          sku: '',
          nameEn: '',
          namePt: '',
          descEn: '',
          descPt: '',
          priceCents: 0,
          category: 'FOOD',
          isActive: true,
        });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save menu item');
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchMenuItems();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete menu item');
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <p className="text-muted-foreground">Manage menu items and pricing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Menu Item</CardTitle>
          <CardDescription>Create a new menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">SKU</label>
              <Input
                placeholder="e.g., tosta-mista"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full p-2 border rounded"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    category: e.target.value as 'FOOD' | 'DRINKS',
                  })
                }
              >
                <option value="FOOD">Food</option>
                <option value="DRINKS">Drinks</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Name (English)</label>
              <Input
                placeholder="e.g., Mixed Toast"
                value={newItem.nameEn}
                onChange={(e) =>
                  setNewItem({ ...newItem, nameEn: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name (Portuguese)</label>
              <Input
                placeholder="e.g., Tosta Mista"
                value={newItem.namePt}
                onChange={(e) =>
                  setNewItem({ ...newItem, namePt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Description (English)
              </label>
              <Input
                placeholder="e.g., Grilled cheese and ham sandwich"
                value={newItem.descEn}
                onChange={(e) =>
                  setNewItem({ ...newItem, descEn: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Description (Portuguese)
              </label>
              <Input
                placeholder="e.g., Sandes de queijo e fiambre grelhada"
                value={newItem.descPt}
                onChange={(e) =>
                  setNewItem({ ...newItem, descPt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price (cents)</label>
              <Input
                type="number"
                placeholder="750 (for €7.50)"
                value={newItem.priceCents}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    priceCents: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newItem.isActive}
                onChange={(e) =>
                  setNewItem({ ...newItem, isActive: e.target.checked })
                }
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => saveMenuItem(newItem)}>Add Menu Item</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>All menu items</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading menu items...</div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{item.sku}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.category === 'FOOD'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.category}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="font-medium">
                      {item.nameEn} / {item.namePt}
                    </div>
                    {(item.descEn || item.descPt) && (
                      <div className="text-sm text-muted-foreground">
                        {item.descEn} / {item.descPt}
                      </div>
                    )}
                    <div className="text-sm font-medium text-green-600">
                      {formatPrice(item.priceCents)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMenuItem(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {menuItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Menu Item</CardTitle>
            <CardDescription>Update menu item details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={editingItem.sku}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, sku: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      category: e.target.value as 'FOOD' | 'DRINKS',
                    })
                  }
                >
                  <option value="FOOD">Food</option>
                  <option value="DRINKS">Drinks</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Name (English)</label>
                <Input
                  value={editingItem.nameEn}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nameEn: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name (Portuguese)</label>
                <Input
                  value={editingItem.namePt}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, namePt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Description (English)
                </label>
                <Input
                  value={editingItem.descEn || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, descEn: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Description (Portuguese)
                </label>
                <Input
                  value={editingItem.descPt || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, descPt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (cents)</label>
                <Input
                  type="number"
                  value={editingItem.priceCents}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      priceCents: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingItem.isActive}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      isActive: e.target.checked,
                    })
                  }
                />
                <label htmlFor="editIsActive" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => saveMenuItem(editingItem)}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
