import React, { useState } from 'react';
import {
  Bird,
  DollarSign,
  Plus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { supabase } from './lib/supabase';
import type { Rooster, Supply } from './types/database';

export default function App() {
  const { roosters, supplies, sales, loading, toggleRoosterSold, updateSupplyQuantity } = useRealtimeSync();
  const [activeTab, setActiveTab] = useState<'inventory' | 'supplies' | 'sales'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  // Form States for Adding New Rooster
  const [isAddingRooster, setIsAddingRooster] = useState(false);
  const [wingBand, setWingBand] = useState('');
  const [legBand, setLegBand] = useState('');
  const [breed, setBreed] = useState('');
  const [bloodline, setBloodline] = useState('');
  const [category, setCategory] = useState<Rooster['category']>('Stag');
  const [dob, setDob] = useState('');
  const [price, setPrice] = useState('');
  const [markingNotes, setMarkingNotes] = useState('');

  // Form States for Adding New Supply
  const [isAddingSupply, setIsAddingSupply] = useState(false);
  const [itemName, setItemName] = useState('');
  const [supplyCategory, setSupplyCategory] = useState<Supply['category']>('Feed');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');

  // Calculations
  const totalRoosters = roosters.length;
  const activeRoosters = roosters.filter(r => r.status === 'Available').length;
  const soldRoosters = roosters.filter(r => r.status === 'Sold').length;
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.sale_price) || 0), 0);
  const lowStockSupplies = supplies.filter(s => s.quantity <= s.min_stock_alert);

  // Filtered Lists
  const filteredRoosters = roosters.filter(r => 
    r.wing_band_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.bloodline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupplies = supplies.filter(s => 
    s.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Submit Handlers
  const handleAddRooster = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('roosters').insert([
      {
        wing_band_no: wingBand,
        leg_band_no: legBand || null,
        breed,
        bloodline,
        category,
        date_of_birth: dob,
        price: parseFloat(price) || 0,
        marking_notes: markingNotes || null,
        status: 'Available'
      }
    ]);

    if (error) alert('Error adding rooster: ' + error.message);
    else {
      setIsAddingRooster(false);
      setWingBand(''); setLegBand(''); setBreed(''); setBloodline(''); setPrice(''); setMarkingNotes('');
    }
  };

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('supplies').insert([
      {
        item_name: itemName,
        category: supplyCategory,
        quantity: parseFloat(quantity) || 0,
        unit,
        min_stock_alert: parseFloat(minStockAlert) || 5,
        cost_per_unit: parseFloat(costPerUnit) || 0
      }
    ]);

    if (error) alert('Error adding supply: ' + error.message);
    else {
      setIsAddingSupply(false);
      setItemName(''); setQuantity(''); setCostPerUnit('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-400 font-medium">Connecting to Gamefowl Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <Bird className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Gamefowl & Farm Management</h1>
              <p className="text-xs text-slate-400">Realtime Inventory & Sales System</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'inventory' ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Gamefowls
            </button>
            <button
              onClick={() => setActiveTab('supplies')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'supplies' ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Supplies {lowStockSupplies.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full">{lowStockSupplies.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'sales' ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Sales
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Stock</span>
              <Bird className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{activeRoosters} <span className="text-sm font-normal text-slate-400">/ {totalRoosters} Total</span></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Roosters Sold</span>
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{soldRoosters}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400">₱{totalRevenue.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alert</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400">{lowStockSupplies.length} <span className="text-sm font-normal text-slate-400">Items</span></div>
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search band no, breed, bloodline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeTab === 'inventory' && (
            <button
              onClick={() => setIsAddingRooster(!isAddingRooster)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-xl flex items-center justify-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rooster</span>
            </button>
          )}

          {activeTab === 'supplies' && (
            <button
              onClick={() => setIsAddingSupply(!isAddingSupply)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-xl flex items-center justify-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supply</span>
            </button>
          )}
        </div>

        {/* Add Rooster Form Modal / Expandable */}
        {isAddingRooster && (
          <form onSubmit={handleAddRooster} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <h3 className="md:col-span-3 text-lg font-bold text-emerald-400 mb-2">Register New Rooster</h3>
            <input required placeholder="Wing Band No. *" value={wingBand} onChange={e => setWingBand(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input placeholder="Leg Band No." value={legBand} onChange={e => setLegBand(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required placeholder="Breed (e.g. Sweater) *" value={breed} onChange={e => setBreed(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required placeholder="Bloodline *" value={bloodline} onChange={e => setBloodline(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <select value={category} onChange={e => setCategory(e.target.value as Rooster['category'])} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white">
              <option value="Stag">Stag</option>
              <option value="Bullstag">Bullstag</option>
              <option value="Cock">Cock</option>
              <option value="Broodcock">Broodcock</option>
              <option value="Broodhen">Broodhen</option>
            </select>
            <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required type="number" placeholder="Price (₱) *" value={price} onChange={e => setPrice(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input placeholder="Marking Notes (Peacomb, Straight, etc)" value={markingNotes} onChange={e => setMarkingNotes(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white md:col-span-2" />
            <div className="md:col-span-3 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setIsAddingRooster(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl">Save Gamefowl</button>
            </div>
          </form>
        )}

        {/* Add Supply Form */}
        {isAddingSupply && (
          <form onSubmit={handleAddSupply} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <h3 className="md:col-span-3 text-lg font-bold text-emerald-400 mb-2">Add Supply Item</h3>
            <input required placeholder="Item Name *" value={itemName} onChange={e => setItemName(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <select value={supplyCategory} onChange={e => setSupplyCategory(e.target.value as Supply['category'])} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white">
              <option value="Feed">Feed</option>
              <option value="Medicine">Medicine</option>
              <option value="Vaccine">Vaccine</option>
              <option value="Equipment">Equipment</option>
            </select>
            <input required type="number" placeholder="Quantity *" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required placeholder="Unit (kg, bottles, pcs) *" value={unit} onChange={e => setUnit(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required type="number" placeholder="Min Stock Alert *" value={minStockAlert} onChange={e => setMinStockAlert(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <input required type="number" placeholder="Cost per Unit (₱) *" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm text-white" />
            <div className="md:col-span-3 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setIsAddingSupply(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl">Save Supply</button>
            </div>
          </form>
        )}

        {/* TAB 1: GAMEFOWLS INVENTORY TABLE */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Wing Band</th>
                    <th className="p-4">Breed & Bloodline</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRoosters.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white">#{r.wing_band_no} {r.leg_band_no && <span className="text-xs text-slate-500 font-normal">({r.leg_band_no})</span>}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{r.breed}</div>
                        <div className="text-xs text-slate-400">{r.bloodline}</div>
                      </td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs">{r.category}</span></td>
                      <td className="p-4 font-semibold text-emerald-400">₱{r.price?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleRoosterSold(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            r.status === 'Available' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {r.status === 'Available' ? 'Mark as Sold' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPLIES TABLE */}
        {activeTab === 'supplies' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Cost/Unit</th>
                    <th className="p-4 text-right">Quick Stock Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSupplies.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white">{s.item_name}</td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs">{s.category}</span></td>
                      <td className="p-4">
                        <span className={`font-bold ${s.quantity <= s.min_stock_alert ? 'text-rose-400' : 'text-slate-200'}`}>
                          {s.quantity} {s.unit}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">₱{s.cost_per_unit}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => updateSupplyQuantity(s.id, Math.max(0, s.quantity - 1))}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => updateSupplyQuantity(s.id, s.quantity + 1)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold"
                        >
                          +1
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SALES HISTORY */}
        {activeTab === 'sales' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Buyer</th>
                    <th className="p-4">Sale Details</th>
                    <th className="p-4 font-bold text-emerald-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 text-xs text-slate-400">{new Date(s.sale_date).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-white">{s.buyer_name}</td>
                      <td className="p-4 text-xs text-slate-300">{s.notes}</td>
                      <td className="p-4 font-bold text-emerald-400">₱{s.sale_price?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}