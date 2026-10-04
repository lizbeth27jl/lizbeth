import { useState } from 'react';
import HeroSection from './components/HeroSection';
import StateMachine from './components/StateMachine';
import ActorsSection from './components/ActorsSection';
import PaymentMilestones from './components/PaymentMilestones';
import DocumentFlow from './components/DocumentFlow';
import ContractParams from './components/ContractParams';
import CodeViewer from './components/CodeViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'flow' | 'code'>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <HeroSection />
      
      {/* Navigation Tabs */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-3">
            {[
              { id: 'overview', label: 'Vista General', icon: '📋' },
              { id: 'flow', label: 'Flujo del Contrato', icon: '🔄' },
              { id: 'code', label: 'Código Fuente', icon: '💻' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
        {activeTab === 'code' && <CodeViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>Smart Contract: Exportación de Pota Congelada CFR Shanghai (Incoterms 2020)</p>
          <p className="mt-1">Pesquera del Sur S.A.C. → Importador en Shanghai | Escrow USDC con liberación por hitos</p>
        </div>
      </footer>
    </div>
  );
}
