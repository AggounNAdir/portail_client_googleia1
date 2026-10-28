import React, { useState } from 'react';
import {
  Store,
  ShoppingCart,
  Receipt,
  FileText,
  Scale,
  User,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Star,
  ArrowRight,
  TrendingUp,
  Package,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, Produit } from '../../types';
import { resoudrePrix } from '../../services/pricing';

export const PortailClientApp: React.FC<{ onSwitchToBackoffice?: () => void }> = ({
  onSwitchToBackoffice,
}) => {
  const { data, createBonVente, logAudit } = useApp();

  // Active logged-in client
  const defaultClient =
    data.clients.find((c) => c.portail_actif && !c.nom.includes('COMPTOIR')) || data.clients[1] || data.clients[0];
  const [currentClient, setCurrentClient] = useState<Client>(defaultClient);

  // Active sub-page in portail client
  const [navTab, setNavTab] = useState<
    'accueil' | 'catalogue' | 'commandes' | 'factures' | 'bons' | 'situation' | 'profil'
  >('accueil');

  // Search in catalogue
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ produit: Produit; quantite: number; prix: number; libelle: string }[]>(
    []
  );
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [observations, setObservations] = useState('');

  // Client's specific records
  const clientBons = data.bonsVente.filter((b) => b.client_id === currentClient.id);
  const clientFactures = data.factures.filter((f) => f.client_id === currentClient.id);
  const clientCommandes = data.commandesPortail.filter((c) => c.client_id === currentClient.id);
  const clientVersements = data.versements.filter(
    (v) => v.tiers_type === 'client' && v.tiers_id === currentClient.id
  );

  // Cart helper functions
  const addToCart = (produit: Produit) => {
    const existingIndex = cart.findIndex((item) => item.produit.id === produit.id);
    const resolved = resoudrePrix({
      produit,
      client: currentClient,
      quantite: existingIndex >= 0 ? cart[existingIndex].quantite + 1 : 1,
      prixSpeciaux: data.prixSpeciaux,
      paliers: data.paliers,
    });

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantite += 1;
      updated[existingIndex].prix = resolved.prix;
      updated[existingIndex].libelle = resolved.libelle;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          produit,
          quantite: 1,
          prix: resolved.prix,
          libelle: resolved.libelle,
        },
      ]);
    }
  };

  const updateCartQty = (prodId: number, delta: number) => {
    const existingIndex = cart.findIndex((item) => item.produit.id === prodId);
    if (existingIndex < 0) return;

    const newQty = cart[existingIndex].quantite + delta;
    if (newQty <= 0) {
      setCart(cart.filter((item) => item.produit.id !== prodId));
    } else {
      const updated = [...cart];
      const resolved = resoudrePrix({
        produit: updated[existingIndex].produit,
        client: currentClient,
        quantite: newQty,
        prixSpeciaux: data.prixSpeciaux,
        paliers: data.paliers,
      });
      updated[existingIndex].quantite = newQty;
      updated[existingIndex].prix = resolved.prix;
      updated[existingIndex].libelle = resolved.libelle;
      setCart(updated);
    }
  };

  const cartTotalTTC = cart.reduce((sum, item) => sum + item.quantite * item.prix, 0);

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    const nextId =
      data.commandesPortail.length > 0
        ? Math.max(...data.commandesPortail.map((c) => c.id)) + 1
        : 1;
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const num = `CMD-PORT-2026-${nextId.toString().padStart(2, '0')}`;

    const orderLines = cart.map((item) => ({
      produit_id: item.produit.id,
      produit_nom: item.produit.designation,
      quantite: item.quantite,
      prix_unitaire_estime: item.prix,
      total_estime: item.quantite * item.prix,
    }));

    const newCmd = {
      id: nextId,
      numero: num,
      client_id: currentClient.id,
      client_nom: currentClient.nom,
      date_commande: dateStr,
      statut: 'En attente' as const,
      total_estime: cartTotalTTC,
      observations: observations.trim() || undefined,
      lignes: orderLines,
    };

    data.commandesPortail.unshift(newCmd);
    logAudit(
      'COMMANDE_PORTAIL_RECUE',
      'commande_client',
      nextId,
      `Commande ${num} passée par ${currentClient.nom} pour ${cartTotalTTC} DZD`
    );

    setCart([]);
    setObservations('');
    setOrderSuccessMsg(
      `Votre commande ${num} de ${cartTotalTTC.toLocaleString()} DZD a été transmise avec succès ! Elle est en cours de validation par notre équipe commerciale.`
    );
    setNavTab('commandes');
    setTimeout(() => setOrderSuccessMsg(''), 7000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner: Switcher between Portail Client & Back-office */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wide">
            PORTAIL CLIENT GOOGLE IA (AggounNAdir/portail_client_googleia)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Client Switcher Selector for live testing */}
          <span className="text-blue-200 hidden sm:inline">Connecté en tant que :</span>
          <select
            value={currentClient.id}
            onChange={(e) => {
              const c = data.clients.find((item) => item.id === Number(e.target.value));
              if (c) {
                setCurrentClient(c);
                setCart([]); // reset cart on client change to recalculate prices
              }
            }}
            className="bg-blue-900/80 border border-blue-400/40 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.niveau_prix.toUpperCase()})
              </option>
            ))}
          </select>

          {onSwitchToBackoffice && (
            <button
              onClick={onSwitchToBackoffice}
              className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded text-white font-bold transition flex items-center space-x-1"
            >
              <span>🖥️ Vue Back-Office</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Desktop Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30 px-4 py-3 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
              GH
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">GHILASS GLACE</div>
              <div className="text-[11px] text-blue-400 font-medium">Espace Client B2B</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNavTab('catalogue')}
              className="relative p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition flex items-center space-x-1"
            >
              <ShoppingCart size={18} className="text-emerald-400" />
              <span className="text-xs font-bold hidden sm:inline">Panier</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {cart.reduce((s, i) => s + i.quantite, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Success alert message */}
      {orderSuccessMsg && (
        <div className="bg-emerald-600 text-white p-3 text-center text-xs font-bold shadow-md flex items-center justify-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{orderSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-20">
        {/* Navigation Tabs (Horizontal on desktop & mobile) */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-slate-800">
          {[
            { id: 'accueil', label: 'Accueil', icon: <Store size={15} /> },
            { id: 'catalogue', label: 'Commander', icon: <ShoppingCart size={15} /> },
            { id: 'commandes', label: `Mes Commandes (${clientCommandes.length})`, icon: <Clock size={15} /> },
            { id: 'bons', label: `Bons de Livraison (${clientBons.length})`, icon: <Package size={15} /> },
            { id: 'factures', label: `Factures (${clientFactures.length})`, icon: <Receipt size={15} /> },
            { id: 'situation', label: 'Mon Relevé', icon: <Scale size={15} /> },
            { id: 'profil', label: 'Mon Profil', icon: <User size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setNavTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                navTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: ACCUEIL / TABLEAU DE BORD CLIENT */}
        {navTab === 'accueil' && (
          <div className="space-y-5">
            {/* Customer Welcome Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-0.5">
                    Bienvenue dans votre espace client
                  </span>
                  <h2 className="text-xl font-black text-white">{currentClient.nom}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                    <span>Code : <b className="font-mono text-slate-200">{currentClient.code}</b></span>
                    <span>•</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      Tarif {currentClient.niveau_prix}
                    </span>
                  </p>
                </div>

                {/* Balance display */}
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-right min-w-[180px]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Solde en Compte :
                  </span>
                  <div
                    className={`text-2xl font-black mt-0.5 ${
                      currentClient.solde > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {currentClient.solde.toLocaleString()} <span className="text-xs text-slate-400 font-normal">DZD</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {currentClient.solde > 0 ? 'À régler à l’échéance' : 'Compte régularisé'}
                  </span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-700/80">
                <button
                  onClick={() => setNavTab('catalogue')}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl text-left transition shadow flex flex-col justify-between"
                >
                  <ShoppingCart size={20} className="mb-2" />
                  <div>
                    <div className="text-xs font-bold">Passer Commande</div>
                    <div className="text-[10px] text-blue-200">Voir les produits & tarifs</div>
                  </div>
                </button>

                <button
                  onClick={() => setNavTab('commandes')}
                  className="bg-slate-700/80 hover:bg-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between"
                >
                  <Clock size={20} className="text-amber-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold">Mes Commandes</div>
                    <div className="text-[10px] text-slate-400">{clientCommandes.length} commandes en cours</div>
                  </div>
                </button>

                <button
                  onClick={() => setNavTab('factures')}
                  className="bg-slate-700/80 hover:bg-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between"
                >
                  <Receipt size={20} className="text-purple-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold">Mes Factures</div>
                    <div className="text-[10px] text-slate-400">{clientFactures.length} factures officielles</div>
                  </div>
                </button>

                <button
                  onClick={() => setNavTab('situation')}
                  className="bg-slate-700/80 hover:bg-slate-700 text-white p-3 rounded-xl text-left transition flex flex-col justify-between"
                >
                  <Scale size={20} className="text-emerald-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold">Mon Relevé</div>
                    <div className="text-[10px] text-slate-400">Historique des débits/crédits</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Delivery Slips */}
            <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Package size={16} className="text-blue-400" />
                  <span>Dernières Livraisons Reçues (BL)</span>
                </h3>
                <button
                  onClick={() => setNavTab('bons')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Tout voir →
                </button>
              </div>

              {clientBons.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">Aucune livraison enregistrée.</div>
              ) : (
                <div className="space-y-2">
                  {clientBons.slice(0, 3).map((bon) => (
                    <div
                      key={bon.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{bon.numero}</div>
                        <div className="text-[11px] text-slate-400">Date : {bon.date_bon}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">{bon.total.toLocaleString()} DZD</div>
                        <span className="text-[10px] text-slate-400">{bon.lignes.length} articles</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CATALOGUE & NOUVELLE COMMANDE */}
        {navTab === 'catalogue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Products Listing (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center space-x-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom d'article, référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2.5">
                {data.produits
                  .filter(
                    (p) =>
                      p.actif &&
                      (p.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((p) => {
                    const inCart = cart.find((item) => item.produit.id === p.id);
                    const currentQty = inCart ? inCart.quantite : 1;

                    // Pricing resolution
                    const resolved = resoudrePrix({
                      produit: p,
                      client: currentClient,
                      quantite: currentQty,
                      prixSpeciaux: data.prixSpeciaux,
                      paliers: data.paliers,
                    });

                    const isSpecial = resolved.source === 'special_client';

                    return (
                      <div
                        key={p.id}
                        className="bg-slate-800 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-600 transition shadow-sm"
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{p.designation}</span>
                            {isSpecial && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center space-x-0.5">
                                <Star size={10} fill="currentColor" />
                                <span>Votre Prix Négocié</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Réf: <span className="font-mono text-slate-300">{p.code}</span> • Unité:{' '}
                            {p.unite} {p.facteur_conversion > 1 ? `(×${p.facteur_conversion} pcs)` : ''}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                            {resolved.libelle}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end space-y-1.5">
                          <div className="text-sm font-black text-emerald-400">
                            {resolved.prix.toLocaleString()} DZD
                          </div>

                          {inCart ? (
                            <div className="flex items-center space-x-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                              <button
                                onClick={() => updateCartQty(p.id, -1)}
                                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center font-bold text-xs text-white">
                                {inCart.quantite}
                              </span>
                              <button
                                onClick={() => updateCartQty(p.id, 1)}
                                className="w-6 h-6 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold text-xs"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1 transition shadow"
                            >
                              <Plus size={13} />
                              <span>Ajouter</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Shopping Cart Drawer (5 cols) */}
            <div className="lg:col-span-5 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg h-fit sticky top-20">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <ShoppingCart size={15} className="text-emerald-400" />
                    <span>Votre Bon de Commande</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    {cart.length} {cart.length <= 1 ? 'article' : 'articles'}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Votre panier est vide. Sélectionnez des articles dans le catalogue.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 pr-2">
                          <div className="font-bold text-white">{item.produit.designation}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.prix.toLocaleString()} DZD / {item.produit.unite}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => updateCartQty(item.produit.id, -1)}
                            className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center font-bold"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center font-bold text-white">
                            {item.quantite}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.produit.id, 1)}
                            className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="w-20 text-right font-bold text-emerald-400 text-xs">
                          {(item.quantite * item.prix).toLocaleString()} DZD
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order total & confirmation */}
              <div className="border-t border-slate-700 pt-3 mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-300 uppercase">Total Estimé TTC :</span>
                  <span className="text-xl font-black text-emerald-400">
                    {cartTotalTTC.toLocaleString()} <span className="text-xs font-normal">DZD</span>
                  </span>
                </div>

                <div>
                  <textarea
                    placeholder="Remarques éventuelles (ex: livraison jeudi matin, contact chauffeur)..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSendOrder}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-2 shadow-lg transition ${
                    cart.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirmer & Envoyer la Commande</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUIVI DES COMMANDES DU PORTAIL */}
        {navTab === 'commandes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock size={16} className="text-amber-400" />
              <span>Historique de vos commandes en ligne</span>
            </h3>

            {clientCommandes.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-xs text-slate-400">
                Vous n'avez pas encore passé de commande en ligne.
              </div>
            ) : (
              <div className="space-y-3">
                {clientCommandes.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
                      <div>
                        <span className="font-mono font-bold text-blue-400 text-sm">{cmd.numero}</span>
                        <span className="text-xs text-slate-400 ml-2">Date : {cmd.date_commande}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cmd.statut === 'Validée'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : cmd.statut === 'En attente'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {cmd.statut === 'Validée'
                          ? 'Validée en Bon de Vente'
                          : cmd.statut === 'En attente'
                          ? 'En attente de confirmation'
                          : 'Refusée'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      {cmd.lignes.map((l, i) => (
                        <div key={i} className="flex justify-between text-slate-300">
                          <span>
                            {l.quantite} × {l.produit_nom}
                          </span>
                          <span className="font-mono text-slate-200">
                            {l.total_estime.toLocaleString()} DZD
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/80 text-xs">
                      <span className="text-slate-400">
                        {cmd.observations ? `Remarque : ${cmd.observations}` : ''}
                      </span>
                      <span className="font-black text-emerald-400 text-sm">
                        Total : {cmd.total_estime.toLocaleString()} DZD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MES BONS DE LIVRAISON (BL) */}
        {navTab === 'bons' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Package size={16} className="text-blue-400" />
              <span>Bons de Livraison & Vente (BL)</span>
            </h3>

            {clientBons.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-xs text-slate-400">
                Aucun bon de livraison enregistré à ce jour.
              </div>
            ) : (
              <div className="space-y-3">
                {clientBons.map((bon) => (
                  <div
                    key={bon.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                      <div>
                        <span className="font-mono font-bold text-blue-400 text-sm">{bon.numero}</span>
                        <span className="text-xs text-slate-400 ml-2">Date : {bon.date_bon}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{bon.total.toLocaleString()} DZD</span>
                    </div>

                    <div className="text-xs space-y-1">
                      {bon.lignes.map((l, i) => (
                        <div key={i} className="flex justify-between text-slate-300">
                          <span>
                            {l.quantite} × {l.designation}
                          </span>
                          <span className="font-mono">{l.total.toLocaleString()} DZD</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/80 text-[11px] text-slate-400">
                      <span>Reste à payer : <b className="text-amber-400 font-bold">{bon.reste_payer.toLocaleString()} DZD</b></span>
                      <span>Statut : <b className="text-white">{bon.statut}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MES FACTURES */}
        {navTab === 'factures' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Receipt size={16} className="text-purple-400" />
              <span>Factures Officielles</span>
            </h3>

            {clientFactures.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-xs text-slate-400">
                Aucune facture enregistrée pour votre compte.
              </div>
            ) : (
              <div className="space-y-3">
                {clientFactures.map((fac) => (
                  <div
                    key={fac.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="font-mono font-bold text-blue-400 text-sm">{fac.numero}</div>
                      <div className="text-xs text-slate-400">Date : {fac.date_facture} • Bon Réf: {fac.bon_vente_numero}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        HT: {fac.total_ht.toLocaleString()} DZD • TVA (19%): {(fac.total_ttc - fac.total_ht).toLocaleString()} DZD
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-white">{fac.total_ttc.toLocaleString()} DZD</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fac.statut === 'Payée' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {fac.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MON RELEVÉ DE COMPTE (SITUATION) */}
        {navTab === 'situation' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Relevé de Compte Chronologique</h3>
                <p className="text-xs text-slate-400">Historique complet des livraisons et versements effectués</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase">Solde Débiteur Dû</span>
                <span className="text-lg font-black text-amber-400">{currentClient.solde.toLocaleString()} DZD</span>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">N° Pièce</th>
                      <th className="py-2.5 px-3">Nature Opération</th>
                      <th className="py-2.5 px-3 text-right">Débit (+)</th>
                      <th className="py-2.5 px-3 text-right">Crédit (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {clientBons.map((b) => (
                      <tr key={`b-${b.id}`} className="hover:bg-slate-700/40">
                        <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">{b.date_bon}</td>
                        <td className="py-2 px-3 font-bold text-blue-400 font-mono">{b.numero}</td>
                        <td className="py-2 px-3 text-white">Livraison Marchandise (BL)</td>
                        <td className="py-2 px-3 text-right font-bold text-white">{b.total.toLocaleString()} DZD</td>
                        <td className="py-2 px-3 text-right text-slate-500">—</td>
                      </tr>
                    ))}
                    {clientVersements.map((v) => (
                      <tr key={`v-${v.id}`} className="hover:bg-slate-700/40">
                        <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">{v.date_vers}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400 font-mono">{v.numero}</td>
                        <td className="py-2 px-3 text-emerald-300">Règlement reçu ({v.mode})</td>
                        <td className="py-2 px-3 text-right text-slate-500">—</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">{v.montant.toLocaleString()} DZD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MON PROFIL */}
        {navTab === 'profil' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4 max-w-lg">
            <h3 className="text-base font-bold text-white">Informations de votre Entreprise</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-700">
                <span className="text-slate-400">Raison Sociale :</span>
                <span className="font-bold text-white">{currentClient.nom}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700">
                <span className="text-slate-400">Code Client :</span>
                <span className="font-mono font-bold text-blue-400">{currentClient.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700">
                <span className="text-slate-400">Catégorie Tarifaire :</span>
                <span className="font-bold uppercase text-blue-300">{currentClient.niveau_prix}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700">
                <span className="text-slate-400">Téléphone :</span>
                <span className="text-white">{currentClient.tel || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700">
                <span className="text-slate-400">Adresse de livraison :</span>
                <span className="text-white">{currentClient.adresse || 'Non renseignée'}</span>
              </div>
              {currentClient.nif && (
                <div className="flex justify-between py-1.5 border-b border-slate-700 font-mono">
                  <span className="text-slate-400">NIF :</span>
                  <span className="text-slate-200">{currentClient.nif}</span>
                </div>
              )}
              {currentClient.nrc && (
                <div className="flex justify-between py-1.5 border-b border-slate-700 font-mono">
                  <span className="text-slate-400">NRC :</span>
                  <span className="text-slate-200">{currentClient.nrc}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-2 py-2 flex justify-around items-center z-40">
        {[
          { id: 'accueil', label: 'Accueil', icon: <Store size={18} /> },
          { id: 'catalogue', label: 'Commander', icon: <ShoppingCart size={18} /> },
          { id: 'commandes', label: 'Commandes', icon: <Clock size={18} /> },
          { id: 'factures', label: 'Factures', icon: <Receipt size={18} /> },
          { id: 'situation', label: 'Relevé', icon: <Scale size={18} /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setNavTab(item.id as any)}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
              navTab === item.id ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
