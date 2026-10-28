import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { PortailClientApp } from './components/portail/PortailClientApp';
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  ShoppingCart,
  GitBranch,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Sliders,
  DollarSign,
  TrendingUp,
  FileText,
  Truck,
  Database,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Client, Produit, BonVente, CommandePortail, PricingTier } from './types';
import { resoudrePrix } from './services/pricing';

export const App: React.FC = () => {
  const {
    data,
    validerCommandePortail,
    refuserCommandePortail,
    ajusterStock,
    updateClient,
    createClient,
    updateProduit,
    createProduit,
    savePrixSpecial,
    resetData,
  } = useApp();

  // App mode: 'portail' (Portail Client Mobile/Web) or 'backoffice' (Gestion de Stock Bureautique)
  const [appMode, setAppMode] = useState<'portail' | 'backoffice'>('portail');
  const [backofficeTab, setBackofficeTab] = useState<
    'commandes' | 'produits' | 'clients' | 'bons' | 'gitsync'
  >('commandes');

  // Search filters
  const [prodSearch, setProdSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientForTarif, setSelectedClientForTarif] = useState<Client | null>(null);

  // New product / adjustment state
  const [ajustModalProd, setAjustModalProd] = useState<Produit | null>(null);
  const [ajustNewQty, setAjustNewQty] = useState<number>(0);
  const [ajustMotif, setAjustMotif] = useState<string>('Inventaire périodique');

  // Special price modal state
  const [specialPriceModal, setSpecialPriceModal] = useState<{
    open: boolean;
    client?: Client;
    produit?: Produit;
    price: number;
  }>({ open: false, price: 0 });

  // If in 'portail' mode, render the Portail Client App (portail_client_googleia)
  if (appMode === 'portail') {
    return <PortailClientApp onSwitchToBackoffice={() => setAppMode('backoffice')} />;
  }

  // Back-office Calculations
  const totalStockValeur = data.produits.reduce(
    (sum, p) => sum + p.stock_actuel * (p.prix_moyen_pondere || p.prix_achat),
    0
  );
  const totalCreancesClients = data.clients.reduce((sum, c) => sum + Math.max(0, c.solde), 0);
  const alertesStock = data.produits.filter((p) => p.stock_actuel <= p.stock_min);
  const pendingOrders = data.commandesPortail.filter((c) => c.statut === 'En attente');

  return (
    <div className="min-h-screen bg-[#131b26] text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-[#1e2736] border-b border-slate-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow">
            <Monitor size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-sm tracking-wide text-white uppercase">
                Back-Office ERP • Gestion de Stock
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Connecté Base Unique
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Société : {data.profils[0]?.nom || 'SARL GHILASS'} | Synchronisé avec Portail Client Mobile
            </p>
          </div>
        </div>

        {/* Switcher back to Portail Client */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAppMode('portail')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 shadow-lg"
          >
            <Smartphone size={15} />
            <span>Basculer vers Portail Client Mobile</span>
          </button>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="bg-[#182232] border-b border-slate-700/60 px-4 flex space-x-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setBackofficeTab('commandes')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
            backofficeTab === 'commandes'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart size={15} />
          <span>Commandes Portail</span>
          {pendingOrders.length > 0 && (
            <span className="bg-amber-500 text-slate-900 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setBackofficeTab('produits')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
            backofficeTab === 'produits'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package size={15} />
          <span>Articles & Stock ({data.produits.length})</span>
          {alertesStock.length > 0 && (
            <span className="bg-red-500/80 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {alertesStock.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setBackofficeTab('clients')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
            backofficeTab === 'clients'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          <span>Clients & Niveaux Prix</span>
        </button>

        <button
          onClick={() => setBackofficeTab('bons')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
            backofficeTab === 'bons'
              ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck size={15} />
          <span>Bons de Livraison & Vente ({data.bonsVente.length})</span>
        </button>

        <button
          onClick={() => setBackofficeTab('gitsync')}
          className={`px-4 py-3 border-b-2 flex items-center space-x-2 transition ${
            backofficeTab === 'gitsync'
              ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch size={15} />
          <span>Guide Synchronisation Git</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px]">Commandes en attente</p>
              <p className="text-xl font-black text-amber-400">{pendingOrders.length}</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <ShoppingCart size={18} />
            </div>
          </div>

          <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px]">Valeur Stock (PMP)</p>
              <p className="text-xl font-black text-emerald-400">
                {Math.round(totalStockValeur).toLocaleString()} DZD
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px]">Créances Clients</p>
              <p className="text-xl font-black text-rose-400">
                {Math.round(totalCreancesClients).toLocaleString()} DZD
              </p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <Receipt size={18} />
            </div>
          </div>

          <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px]">Articles en Rupture / Alerte</p>
              <p className="text-xl font-black text-red-400">{alertesStock.length}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <AlertTriangle size={18} />
            </div>
          </div>
        </div>

        {/* TAB 1: COMMANDES PORTAIL CLIENT */}
        {backofficeTab === 'commandes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Commandes envoyées depuis le Portail Client Mobile</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Validez les commandes reçues pour déduire le stock et générer automatiquement le Bon de Vente (BL).
                </p>
              </div>
            </div>

            {data.commandesPortail.length === 0 ? (
              <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                Aucune commande portail enregistrée.
              </div>
            ) : (
              <div className="space-y-3">
                {data.commandesPortail.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-blue-400 text-sm">
                          {cmd.numero}
                        </span>
                        <span className="font-bold text-white text-xs">{cmd.client_nom}</span>
                        <span className="text-[11px] text-slate-400">{cmd.date_commande}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            cmd.statut === 'Validée'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : cmd.statut === 'Refusée'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {cmd.statut}
                        </span>

                        {cmd.statut === 'En attente' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const bv = validerCommandePortail(cmd.id);
                                if (bv) {
                                  alert(
                                    `Commande validée avec succès ! Le Bon de Vente ${bv.numero} a été créé et le stock a été déduit.`
                                  );
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1 shadow transition"
                            >
                              <Check size={14} />
                              <span>Valider & Générer BL</span>
                            </button>
                            <button
                              onClick={() => refuserCommandePortail(cmd.id)}
                              className="bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded text-xs font-semibold transition"
                            >
                              <X size={14} />
                              <span>Refuser</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {cmd.observations && (
                      <p className="text-xs text-amber-300/90 italic bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        Note client : {cmd.observations}
                      </p>
                    )}

                    {/* Order lines */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700/60 pb-1">
                            <th className="py-1">Article</th>
                            <th className="py-1 text-center">Quantité</th>
                            <th className="py-1 text-right">Prix Unitaire Estimé</th>
                            <th className="py-1 text-right">Sous-Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                          {cmd.lignes.map((l, i) => (
                            <tr key={i} className="text-slate-200">
                              <td className="py-1.5 font-medium">{l.produit_nom}</td>
                              <td className="py-1.5 text-center font-bold">{l.quantite}</td>
                              <td className="py-1.5 text-right font-mono text-slate-300">
                                {l.prix_unitaire_estime.toLocaleString()} DZD
                              </td>
                              <td className="py-1.5 text-right font-mono font-bold text-white">
                                {l.total_estime.toLocaleString()} DZD
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-700 font-bold text-xs">
                            <td colSpan={3} className="pt-2 text-right text-slate-300">
                              Total Estimé TTC :
                            </td>
                            <td className="pt-2 text-right font-mono text-emerald-400 text-sm">
                              {cmd.total_estime.toLocaleString()} DZD
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GESTION PRODUITS & STOCK */}
        {backofficeTab === 'produits' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Articles, Tarifs Niveaux & Stock</h2>
                <p className="text-xs text-slate-400">
                  Prix d'achat, PMP, prix de vente par niveau (Détail, Gros, Super Gros) et ajustement d'inventaire.
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    placeholder="Rechercher code, désignation..."
                    className="w-full bg-[#182232] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#182232] text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Désignation</th>
                      <th className="p-3 text-right">PMP / Coût</th>
                      <th className="p-3 text-right text-amber-300">Détail</th>
                      <th className="p-3 text-right text-blue-300">Gros</th>
                      <th className="p-3 text-right text-purple-300">Super Gros</th>
                      <th className="p-3 text-center">Stock Actuel</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {data.produits
                      .filter(
                        (p) =>
                          p.designation.toLowerCase().includes(prodSearch.toLowerCase()) ||
                          p.code.toLowerCase().includes(prodSearch.toLowerCase())
                      )
                      .map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-700/30 transition">
                          <td className="p-3 font-mono font-bold text-blue-400">{prod.code}</td>
                          <td className="p-3">
                            <div className="font-bold text-white">{prod.designation}</div>
                            <div className="text-[10px] text-slate-400">
                              Unité : {prod.unite} (Carton: {prod.facteur_conversion})
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-300">
                            {prod.prix_moyen_pondere.toLocaleString()} DZD
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-amber-300">
                            {prod.prix_detail.toLocaleString()} DZD
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-blue-300">
                            {prod.prix_gros.toLocaleString()} DZD
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-purple-300">
                            {prod.prix_super_gros.toLocaleString()} DZD
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                prod.stock_actuel <= prod.stock_min
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {prod.stock_actuel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setAjustModalProd(prod);
                                setAjustNewQty(prod.stock_actuel);
                              }}
                              className="bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white px-2 py-1 rounded text-[11px] font-semibold transition"
                            >
                              Ajuster Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLIENTS & TARIFS NÉGOCIÉS */}
        {backofficeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Gestion des Clients & Niveaux Tarifaires</h2>
                <p className="text-xs text-slate-400">
                  Définissez la catégorie de prix globale du client ou des Prix Spéciaux sur mesure par article.
                </p>
              </div>

              <div className="relative w-64">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher client..."
                  className="w-full bg-[#182232] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.clients
                .filter(
                  (c) =>
                    c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.code.toLowerCase().includes(clientSearch.toLowerCase())
                )
                .map((client) => {
                  const specialPrices = data.prixSpeciaux.filter(
                    (ps) => ps.client_id === client.id && ps.actif === 1
                  );
                  return (
                    <div
                      key={client.id}
                      className="bg-[#1e2736] border border-slate-700/80 rounded-xl p-4 space-y-3 shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-white">{client.nom}</div>
                          <div className="text-[11px] font-mono text-blue-400">{client.code}</div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            client.niveau_prix === 'super_gros'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : client.niveau_prix === 'gros'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {client.niveau_prix}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Solde :</span>
                          <span
                            className={`font-mono font-bold ${
                              client.solde > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {client.solde.toLocaleString()} DZD
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Téléphone :</span>
                          <span>{client.tel || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Accès Portail Mobile :</span>
                          <span className={client.portail_actif ? 'text-emerald-400' : 'text-slate-500'}>
                            {client.portail_actif ? 'Activé' : 'Désactivé'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/70">
                        <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                          <span>Prix Spéciaux Accordés ({specialPrices.length}) :</span>
                          <button
                            onClick={() => {
                              setSelectedClientForTarif(client);
                              setSpecialPriceModal({
                                open: true,
                                client,
                                produit: data.produits[0],
                                price: data.produits[0]?.prix_vente || 0,
                              });
                            }}
                            className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center space-x-1"
                          >
                            <Plus size={12} />
                            <span>Ajouter</span>
                          </button>
                        </div>
                        {specialPrices.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic">
                            Aucun prix négocié spécifique (utilise la grille {client.niveau_prix}).
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {specialPrices.map((sp) => {
                              const prod = data.produits.find((p) => p.id === sp.produit_id);
                              return (
                                <div
                                  key={sp.id}
                                  className="flex items-center justify-between bg-[#131b26] px-2 py-1 rounded text-[11px]"
                                >
                                  <span className="text-slate-300 truncate max-w-[150px]">
                                    {prod?.designation || `Produit #${sp.produit_id}`}
                                  </span>
                                  <span className="font-mono font-bold text-amber-400">
                                    {sp.prix_special.toLocaleString()} DZD
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: BONS DE VENTE / LIVRAISON */}
        {backofficeTab === 'bons' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Bons de Vente & de Livraison (BL)</h2>
              <p className="text-xs text-slate-400">
                Historique des livraisons émises, montants versés et restes à payer.
              </p>
            </div>

            <div className="bg-[#1e2736] border border-slate-700/80 rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#182232] text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Numéro BL</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Client</th>
                      <th className="p-3 text-right">Total TTC</th>
                      <th className="p-3 text-right">Versé</th>
                      <th className="p-3 text-right">Reste</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {data.bonsVente.map((bon) => (
                      <tr key={bon.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-3 font-mono font-bold text-blue-400">{bon.numero}</td>
                        <td className="p-3 text-slate-300">{bon.date_bon}</td>
                        <td className="p-3 font-bold text-white">{bon.client_nom}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {bon.total_ttc.toLocaleString()} DZD
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          {bon.montant_verse.toLocaleString()} DZD
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">
                          {bon.reste_payer.toLocaleString()} DZD
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bon.statut === 'Validé'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {bon.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GIT SYNC & RESOLUTION EXPLANATION */}
        {backofficeTab === 'gitsync' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
                  <GitBranch size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Explication de l'Erreur Git & Procédure de Synchronisation
                  </h2>
                  <p className="text-xs text-blue-200">
                    Pourquoi votre commande <code className="text-amber-300">git push -u origin main</code> a été rejetée et comment séparer vos deux dépôts.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 rounded-xl p-4 font-mono text-xs space-y-1 text-slate-300 border border-slate-800">
                <div className="text-red-400 font-bold">! [rejected] main -&gt; main (fetch first)</div>
                <div className="text-slate-400">error: failed to push some refs to 'https://github.com/AggounNAdir/APP_GESTION_STOCK_OFFIC.git'</div>
                <div className="text-amber-400">hint: Updates were rejected because the remote contains work that you do not have locally.</div>
              </div>

              <div className="space-y-3 text-xs text-slate-200 leading-relaxed">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>1. Diagnostic : Deux Dépôts GitHub Distincts</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="font-bold text-blue-400 block mb-1">Dépôt 1 : APP_GESTION_STOCK_OFFIC</span>
                    <p className="text-slate-300 text-[11px]">
                      C'est le logiciel de gestion de stock Back-Office (avec base de données, PMP, clients, stock, factures).
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="font-bold text-purple-400 block mb-1">Dépôt 2 : portail_client_googleia</span>
                    <p className="text-slate-300 text-[11px]">
                      C'est l'application mobile / web cliente où vos clients passent leurs commandes en ligne.
                    </p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white pt-2">
                  2. Pourquoi le push a été rejeté ?
                </h3>
                <p>
                  Le serveur distant GitHub contenait des commits (créés lors de la mise à jour précédente) que votre machine locale Windows n'avait pas encore téléchargés. Git empêche d'écraser l'historique par sécurité.
                </p>

                <h3 className="text-sm font-bold text-white pt-2">
                  3. Commandes pour Synchroniser depuis votre terminal Windows
                </h3>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1"># Option A : Récupérer les modifications distantes avant de pusher (Recommandé) :</span>
                    <div className="text-emerald-400 select-all">git pull --rebase origin main</div>
                    <div className="text-emerald-400 select-all">git push -u origin main</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1"># Option B : Si vous souhaitez cibler le dépôt du Portail Client (portail_client_googleia) :</span>
                    <div className="text-blue-400 select-all">git remote set-url origin https://github.com/AggounNAdir/portail_client_googleia.git</div>
                    <div className="text-blue-400 select-all">git push -u origin main --force</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Ajustement Stock */}
      {ajustModalProd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2736] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Ajustement d'Inventaire : {ajustModalProd.designation}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Stock Enregistré Actuel</label>
                <div className="font-mono font-bold text-lg text-white">
                  {ajustModalProd.stock_actuel} {ajustModalProd.unite}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nouveau Stock Réel Compté :
                </label>
                <input
                  type="number"
                  value={ajustNewQty}
                  onChange={(e) => setAjustNewQty(Number(e.target.value))}
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Motif de l'ajustement :</label>
                <input
                  type="text"
                  value={ajustMotif}
                  onChange={(e) => setAjustMotif(e.target.value)}
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAjustModalProd(null)}
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  ajusterStock(ajustModalProd.id, ajustNewQty, ajustMotif);
                  setAjustModalProd(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow"
              >
                Enregistrer l'ajustement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Prix Spécial Client */}
      {specialPriceModal.open && specialPriceModal.client && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2736] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Prix Spécial Négocié pour {specialPriceModal.client.nom}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Sélectionner le Produit :</label>
                <select
                  value={specialPriceModal.produit?.id || data.produits[0]?.id}
                  onChange={(e) => {
                    const p = data.produits.find((item) => item.id === Number(e.target.value));
                    if (p) {
                      setSpecialPriceModal((prev) => ({
                        ...prev,
                        produit: p,
                        price: p.prix_vente,
                      }));
                    }
                  }}
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  {data.produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.designation} (Défaut: {p.prix_vente} DZD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Prix Spécial Accordé (DZD TTC) :
                </label>
                <input
                  type="number"
                  value={specialPriceModal.price}
                  onChange={(e) =>
                    setSpecialPriceModal((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                  className="w-full bg-[#131b26] border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSpecialPriceModal({ open: false, price: 0 })}
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (specialPriceModal.client && specialPriceModal.produit) {
                    savePrixSpecial({
                      client_id: specialPriceModal.client.id,
                      produit_id: specialPriceModal.produit.id,
                      prix_special: specialPriceModal.price,
                      actif: 1,
                    });
                    setSpecialPriceModal({ open: false, price: 0 });
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow"
              >
                Enregistrer le Prix Spécial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
