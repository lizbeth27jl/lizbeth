import { useState } from 'react';
import ContractParams from './components/ContractParams';
import ActorsSection from './components/ActorsSection';
import PaymentMilestones from './components/PaymentMilestones';
import StateMachine from './components/StateMachine';
import DocumentFlow from './components/DocumentFlow';
import InteractiveSimulator from './components/InteractiveSimulator';
import MiddlewareERP from './components/MiddlewareERP';
import CodeViewer from './components/CodeViewer';
import DAPPortCatalog from './components/DAPPortCatalog';
import DAPSimulator from './components/DAPSimulator';
import DAPMiddleware from './components/DAPMiddleware';
import DAPCodeViewer from './components/DAPCodeViewer';

export type ContractType = 'CFR' | 'DAP';

export default function App() {
  const [contract, setContract] = useState<ContractType>('DAP');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const tabsCFR = [
    { id: 'overview', label: 'Vista General', icon: '📋' },
    { id: 'flow', label: 'Flujo del Contrato', icon: '🔄' },
    { id: 'simulator', label: 'Simulador', icon: '🧪' },
    { id: 'middleware', label: 'Middleware ERP', icon: '🔗' },
    { id: 'code', label: 'Código Fuente', icon: '💻' },
  ];

  const tabsDAP = [
    { id: 'overview', label: 'Vista General', icon: '📋' },
    { id: 'ports', label: 'Catálogo Puertos', icon: '🌍' },
    { id: 'flow', label: 'Flujo del Contrato', icon: '🔄' },
    { id: 'simulator', label: 'Simulador', icon: '🧪' },
    { id: 'middleware', label: 'Middleware ERP', icon: '🔗' },
    { id: 'code', label: 'Código Fuente', icon: '💻' },
  ];

  const tabs = contract === 'CFR' ? tabsCFR : tabsDAP;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950 to-cyan-900/30" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(148,163,184,0.15)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            {/* Contract Selector */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/50 mb-6">
              <button
                onClick={() => { setContract('CFR'); setActiveTab('overview'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  contract === 'CFR'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🚢 CFR Shanghai
              </button>
              <button
                onClick={() => { setContract('DAP'); setActiveTab('overview'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  contract === 'DAP'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌍 DAP Multi-Destino
              </button>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Solidity ^0.8.20 • OpenZeppelin • {contract === 'CFR' ? 'Escrow USDC' : 'Banco Oráculo + Carta de Crédito'} • Middleware ERP
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className={`bg-clip-text text-transparent ${
                contract === 'CFR'
                  ? 'bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400'
                  : 'bg-gradient-to-r from-purple-400 via-pink-300 to-rose-400'
              }`}>
                {contract === 'CFR' ? 'ExportaciónPotaCFR' : 'ExportaciónPotaDAP'}
              </span>
            </h1>
            
            <p className="mt-3 text-xl sm:text-2xl text-slate-300 font-light">
              {contract === 'CFR' 
                ? 'Pota Congelada CFR Shanghai'
                : 'Pota Congelada DAP — 3 Continentes, 5 Países, 8 Puertos'}
            </p>
            
            <p className="mt-2 text-base text-slate-400 max-w-3xl mx-auto">
              {contract === 'CFR'
                ? 'Contrato inteligente de escrow en USDC con liberación de pagos por hitos (30%/70%) para exportación de pota congelada bajo Incoterms® 2020 CFR.'
                : 'Contrato DAP con catálogo de destinos, precio dinámico (FOB + flete + seguro), pago mixto (30% SWIFT + 70% carta de crédito confirmada) y banco como oráculo.'}
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {contract === 'CFR' ? (
                <>
                  <StatCard value="20,000 kg" label="Pedido Mín." sub="FCL" />
                  <StatCard value="30%" label="Anticipo" sub="Cert. Sanitario" />
                  <StatCard value="70%" label="Saldo" sub="B/L a Bordo" />
                  <StatCard value="-18°C" label="Temp. Máx" sub="Cadena Frío" />
                </>
              ) : (
                <>
                  <StatCard value="8" label="Puertos" sub="3 Continentes" />
                  <StatCard value="30%+70%" label="Pago Mixto" sub="SWIFT + LC" />
                  <StatCard value="DAP" label="Incoterm" sub="Entrega en destino" />
                  <StatCard value="-18°C" label="Temp. Máx" sub="Cadena Frío" />
                </>
              )}
            </div>

            {/* Route */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="text-lg">🇵🇪</span>
                <span className="text-amber-300 font-medium">Pesquera del Sur S.A.C.</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>→</span>
                <span className={`text-xs px-2 py-0.5 rounded ${contract === 'CFR' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-purple-900/50 text-purple-300'}`}>
                  {contract}
                </span>
                <span>→</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className="text-lg">🌎🌍🌏</span>
                <span className="text-red-300 font-medium">
                  {contract === 'CFR' ? 'Importador Shanghai' : '8 Puertos en 5 Países'}
                </span>
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
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? contract === 'CFR'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
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
        {contract === 'CFR' ? (
          <>
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
          </>
        ) : (
          <>
            {activeTab === 'overview' && <DAPOverview />}
            {activeTab === 'ports' && <DAPPortCatalog />}
            {activeTab === 'flow' && <DAPFlow />}
            {activeTab === 'simulator' && <DAPSimulator />}
            {activeTab === 'middleware' && <DAPMiddleware />}
            {activeTab === 'code' && <DAPCodeViewer />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>Smart Contracts: Exportación de Pota Congelada — CFR Shanghai & DAP Multi-Destino (Incoterms 2020)</p>
          <p className="mt-1">Pesquera del Sur S.A.C. | Escrow USDC / Banco Oráculo | Middleware ERP</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}

function DAPOverview() {
  return (
    <div className="space-y-8">
      {/* Key Differences from CFR */}
      <div className="bg-gradient-to-r from-purple-900/20 to-slate-800/50 rounded-xl border border-purple-500/20 p-6">
        <h3 className="font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <span>⚡</span> DAP vs CFR — Diferencias Clave
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-cyan-300 mb-2">🚢 CFR (Cost and Freight)</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex gap-2"><span className="text-slate-600">•</span>Riesgo se transmite al B/L "a bordo"</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Un solo destino (Shanghai)</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Escrow en USDC (on-chain)</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Pago: 30% + 70% desde escrow</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Seguro a cargo del comprador</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-300 mb-2">🌍 DAP (Delivered at Place)</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex gap-2"><span className="text-slate-600">•</span>Riesgo se transmite en la entrega en destino</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>8 puertos en 5 países (3 continentes)</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Banco como oráculo (off-chain)</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Pago: 30% SWIFT + 70% carta de crédito</li>
              <li className="flex gap-2"><span className="text-slate-600">•</span>Seguro a cargo del vendedor</li>
            </ul>
          </div>
        </div>
      </div>

      {/* DAP Actors */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">👥 Actores del Contrato DAP</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🏭', name: 'Exportador', entity: 'Pesquera del Sur S.A.C.', color: 'amber', desc: 'Vendedor. Responsable de cadena de frío hasta entrega DAP.' },
            { icon: '🏢', name: 'Importador', entity: 'Comprador internacional', color: 'red', desc: 'Selecciona país y puerto de destino. Recibe la mercancía.' },
            { icon: '🏦', name: 'Banco', entity: 'Banco confirmante', color: 'blue', desc: 'Oráculo bancario: registra anticipo SWIFT, confirma LC, autoriza pago del saldo.' },
            { icon: '🔬', name: 'Certificador', entity: 'SANIPES', color: 'yellow', desc: 'Emite certificado sanitario para productos hidrobiológicos.' },
            { icon: '🚢', name: 'Naviera', entity: 'Agente naviero', color: 'cyan', desc: 'Registra embarque (B/L) y entrega en puerto de destino.' },
            { icon: '🌡️', name: 'Oráculo IoT', entity: 'Sensor reefer', color: 'blue', desc: 'Reporta temperatura del contenedor refrigerado.' },
            { icon: '⚖️', name: 'Árbitro', entity: 'Centro de arbitraje', color: 'purple', desc: 'Resuelve disputas: autoriza o deniega pago del saldo.' },
          ].map((a, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <h4 className="font-semibold text-white text-sm">{a.name}</h4>
                  <p className="text-[10px] text-slate-500">{a.entity}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DAP State Machine */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🔄 Máquina de Estados DAP (9 estados)</h3>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { name: 'Creado', icon: '📝', color: 'slate' },
              { name: 'AnticipoRecibido', icon: '💸', color: 'green' },
              { name: 'CartaCreditoConfirmada', icon: '🏦', color: 'blue' },
              { name: 'Certificado', icon: '🔬', color: 'yellow' },
              { name: 'Embarcado', icon: '🚢', color: 'cyan' },
              { name: 'EntregadoEnDestino', icon: '📍', color: 'purple' },
              { name: 'Liquidado', icon: '✅', color: 'green' },
            ].map((s, i) => (
              <div key={s.name} className="flex items-center">
                <div className={`px-3 py-2 rounded-lg text-xs font-medium bg-${s.color}-900/30 border border-${s.color}-500/30 text-${s.color}-200`}>
                  <span className="mr-1">{s.icon}</span>{s.name}
                </div>
                {i < 6 && <span className="text-slate-600 mx-1">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span>↕ <code className="text-red-400">Disputado</code> — desde Certificado hasta EntregadoEnDestino</span>
            <span>↕ <code className="text-orange-400">Cancelado</code> — por vencimiento o laudo</span>
          </div>
        </div>
      </div>

      {/* Payment Flow */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">💰 Flujo de Pago DAP</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 rounded-xl border border-green-500/20 p-4">
            <div className="text-2xl mb-2">💸</div>
            <h4 className="font-semibold text-green-300 text-sm">30% Adelanto SWIFT</h4>
            <p className="text-xs text-slate-400 mt-1">Transferencia internacional. El banco registra la referencia SWIFT.</p>
            <div className="mt-2 text-xs text-slate-500">
              <code className="text-cyan-400">registrarAnticipo(refSWIFT, monto)</code>
            </div>
          </div>
          <div className="bg-blue-900/20 rounded-xl border border-blue-500/20 p-4">
            <div className="text-2xl mb-2">🏦</div>
            <h4 className="font-semibold text-blue-300 text-sm">70% Carta de Crédito</h4>
            <p className="text-xs text-slate-400 mt-1">Carta de crédito confirmada. El banco confirma cobertura del saldo.</p>
            <div className="mt-2 text-xs text-slate-500">
              <code className="text-cyan-400">confirmarCartaCredito(refLC, monto)</code>
            </div>
          </div>
          <div className="bg-purple-900/20 rounded-xl border border-purple-500/20 p-4">
            <div className="text-2xl mb-2">✅</div>
            <h4 className="font-semibold text-purple-300 text-sm">Pago del Saldo</h4>
            <p className="text-xs text-slate-400 mt-1">Solo tras entrega en destino. El banco ejecuta el pago contra documentos.</p>
            <div className="mt-2 text-xs text-slate-500">
              <code className="text-cyan-400">registrarPagoSaldo(refPago, monto)</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DAPFlow() {
  const states = [
    { id: 'Creado', icon: '📝', desc: 'Contrato creado. Importador selecciona destino.' },
    { id: 'AnticipoRecibido', icon: '💸', desc: 'Banco registra anticipo 30% vía SWIFT.' },
    { id: 'CartaCreditoConfirmada', icon: '🏦', desc: 'Banco confirma carta de crédito 70%.' },
    { id: 'Certificado', icon: '🔬', desc: 'SANIPES emite certificado sanitario.' },
    { id: 'Embarcado', icon: '🚢', desc: 'Naviera registra B/L. Mercancía en tránsito.' },
    { id: 'EntregadoEnDestino', icon: '📍', desc: 'Entrega en puerto DAP. Riesgo transferido. Saldo autorizado.' },
    { id: 'Liquidado', icon: '✅', desc: 'Banco registra pago del saldo. Contrato completado.' },
    { id: 'Disputado', icon: '⚖️', desc: 'Disputa iniciada. Árbitro decide.' },
    { id: 'Cancelado', icon: '❌', desc: 'Contrato cancelado (vencimiento o laudo).' },
  ];

  const transitions = [
    { from: 'Creado', to: 'AnticipoRecibido', fn: 'registrarAnticipo()', actor: 'Banco' },
    { from: 'AnticipoRecibido', to: 'CartaCreditoConfirmada', fn: 'confirmarCartaCredito()', actor: 'Banco' },
    { from: 'CartaCreditoConfirmada', to: 'Certificado', fn: 'emitirCertificadoSanitario()', actor: 'Certificador' },
    { from: 'Certificado', to: 'Embarcado', fn: 'registrarEmbarque()', actor: 'Naviera' },
    { from: 'Embarcado', to: 'EntregadoEnDestino', fn: 'registrarEntregaEnDestino()', actor: 'Naviera' },
    { from: 'EntregadoEnDestino', to: 'Liquidado', fn: 'registrarPagoSaldo()', actor: 'Banco' },
    { from: 'Certificado/Embarcado/Entregado', to: 'Disputado', fn: 'iniciarDisputa()', actor: 'Exp/Imp' },
    { from: 'Disputado', to: 'EntregadoEnDestino', fn: 'resolverDisputa(true)', actor: 'Árbitro' },
    { from: 'Disputado', to: 'Cancelado', fn: 'resolverDisputa(false)', actor: 'Árbitro' },
    { from: 'Creado/Anticipo/LC', to: 'Cancelado', fn: 'cancelarPorVencimiento()', actor: 'Importador' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔄</span> Flujo del Contrato DAP
        </h2>
        <p className="text-slate-400 mt-1">
          9 estados. El banco actúa como oráculo: registra pagos y solo autoriza el saldo tras la entrega en destino.
        </p>
      </div>

      {/* States */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {states.map(s => (
          <div key={s.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{s.icon}</span>
              <span className="font-semibold text-white text-sm">{s.id}</span>
            </div>
            <p className="text-xs text-slate-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Transitions */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm">Transiciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="px-4 py-2 text-left text-xs font-medium">Desde</th>
                <th className="px-4 py-2 text-left text-xs font-medium">→</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Hasta</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Función</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Actor</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t, i) => (
                <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="px-4 py-2 text-xs text-slate-300">{t.from}</td>
                  <td className="px-4 py-2 text-slate-500">→</td>
                  <td className="px-4 py-2 text-xs text-slate-300">{t.to}</td>
                  <td className="px-4 py-2"><code className="text-cyan-400 text-xs">{t.fn}</code></td>
                  <td className="px-4 py-2 text-xs text-slate-400">{t.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents DAP */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="font-semibold text-white mb-3 text-sm">📄 Documentos DAP (7 documentos)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'FACTURA', name: 'Factura Comercial', icon: '🧾' },
            { key: 'PACKING_LIST', name: 'Packing List', icon: '📦' },
            { key: 'CERT_ORIGEN', name: 'Cert. Origen', icon: '📜' },
            { key: 'POLIZA_SEGURO', name: 'Póliza de Seguro', icon: '🛡️', note: 'DAP: a cargo del vendedor' },
            { key: 'CERT_SANITARIO', name: 'Cert. Sanitario', icon: '🔬', milestone: true },
            { key: 'DAM', name: 'DAM (SUNAT)', icon: '🏛️' },
            { key: 'BL', name: 'Bill of Lading', icon: '🚢', milestone: true },
            { key: 'AVISO_LLEGADA', name: 'Aviso de Llegada', icon: '📍', milestone: true },
          ].map(d => (
            <div key={d.key} className={`rounded-lg border p-3 ${d.milestone ? 'bg-purple-900/10 border-purple-500/20' : 'bg-slate-900/30 border-slate-700/30'}`}>
              <div className="flex items-center gap-2">
                <span>{d.icon}</span>
                <div>
                  <span className="text-xs font-medium text-white">{d.name}</span>
                  {d.milestone && <span className="ml-1 text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded">HITO</span>}
                </div>
              </div>
              <code className="text-[10px] text-cyan-400 mt-1 block">{d.key}</code>
              {d.note && <p className="text-[10px] text-slate-500 mt-0.5">{d.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
