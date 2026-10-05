import { useState } from 'react';
import ContractParams from './components/ContractParams';
import ActorsSection from './components/ActorsSection';
import PaymentMilestones from './components/PaymentMilestones';
import StateMachine from './components/StateMachine';
import DocumentFlow from './components/DocumentFlow';
import InteractiveSimulator from './components/InteractiveSimulator';
import MiddlewareERP from './components/MiddlewareERP';
import CodeViewer from './components/CodeViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'flow' | 'simulator' | 'middleware' | 'code'>('overview');

  const tabs = [
    { id: 'overview', label: 'Vista General', icon: '📋' },
    { id: 'flow', label: 'Flujo del Contrato', icon: '🔄' },
    { id: 'simulator', label: 'Simulador', icon: '🧪' },
    { id: 'middleware', label: 'Middleware ERP', icon: '🔗' },
    { id: 'code', label: 'Código Fuente', icon: '💻' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950 to-cyan-900/30" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(148,163,184,0.15)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Solidity ^0.8.20 • OpenZeppelin • Escrow USDC • Middleware ERP
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
                ExportaciónPotaCFR
              </span>
            </h1>
            
            <p className="mt-4 text-xl sm:text-2xl text-slate-300 font-light">
              Pota Congelada CFR Shanghai
            </p>
            
            <p className="mt-2 text-base text-slate-400 max-w-3xl mx-auto">
              Contrato inteligente de escrow en USDC con liberación de pagos por hitos para exportación 
              de pota congelada bajo Incoterms® 2020 — con integración ERP vía middleware on-chain
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: 'Pedido Mínimo', value: '20,000 kg', sub: 'FCL Contenedor' },
                { label: 'Anticipo', value: '30%', sub: 'Cert. Sanitario' },
                { label: 'Saldo', value: '70%', sub: 'B/L a Bordo' },
                { label: 'Temp. Máx', value: '-18°C', sub: 'Cadena Frío' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                  <div className="text-xs text-slate-500">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="text-lg">🇵🇪</span>
                <span className="text-amber-300 font-medium">Pesquera del Sur S.A.C.</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>→</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 rounded">CFR</span>
                <span>→</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className="text-lg">🇨🇳</span>
                <span className="text-red-300 font-medium">Importador Shanghai</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <ContractParams />
            <ActorsSection />
            <PaymentMilestones />
          </div>
        )}
        {activeTab === 'flow' && (
          <div className="space-y-8">
            <StateMachine />
            <DocumentFlow />
          </div>
        )}
        {activeTab === 'simulator' && <InteractiveSimulator />}
        {activeTab === 'middleware' && <MiddlewareERP />}
        {activeTab === 'code' && <CodeViewer />}
      </main>

      <footer className="border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>Smart Contract: Exportación de Pota Congelada CFR Shanghai (Incoterms 2020)</p>
          <p className="mt-1">Pesquera del Sur S.A.C. → Importador en Shanghai | Escrow USDC con middleware ERP</p>
        </div>
      </footer>
    </div>
  );
}
