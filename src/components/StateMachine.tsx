import { useState } from 'react';

const states = [
  { id: 'Creado', label: 'Creado', color: 'slate', description: 'Contrato desplegado, esperando financiamiento', icon: '📝' },
  { id: 'Financiado', label: 'Financiado', color: 'blue', description: 'Importador depositó 100% USDC en escrow', icon: '💰' },
  { id: 'Inspeccionado', label: 'Inspeccionado', color: 'yellow', description: 'Certificado sanitario emitido, anticipo 30% liberado', icon: '🔬' },
  { id: 'ABordo', label: 'A Bordo', color: 'cyan', description: 'B/L limpio emitido, riesgo transferido al comprador (CFR)', icon: '🚢' },
  { id: 'Arribado', label: 'Arribado', color: 'purple', description: 'Mercancía llegó al puerto de destino', icon: '⚓' },
  { id: 'Cerrado', label: 'Cerrado', color: 'green', description: 'Recepción confirmada o disputa resuelta', icon: '✅' },
  { id: 'Disputado', label: 'Disputado', color: 'red', description: 'Disputa iniciada, esperando laudo arbitral', icon: '⚖️' },
];

const transitions = [
  { from: 'Creado', to: 'Financiado', trigger: 'financiar()', actor: 'Importador' },
  { from: 'Financiado', to: 'Inspeccionado', trigger: 'emitirCertificadoSanitario()', actor: 'Certificador' },
  { from: 'Inspeccionado', to: 'ABordo', trigger: 'registrarEmbarque()', actor: 'Agente de Carga' },
  { from: 'ABordo', to: 'Arribado', trigger: 'registrarArribo()', actor: 'Agente de Carga' },
  { from: 'Arribado', to: 'Cerrado', trigger: 'confirmarRecepcion()', actor: 'Importador' },
  { from: 'Financiado', to: 'Disputado', trigger: 'iniciarDisputa()', actor: 'Exportador/Importador' },
  { from: 'Inspeccionado', to: 'Disputado', trigger: 'iniciarDisputa()', actor: 'Exportador/Importador' },
  { from: 'Disputado', to: 'Cerrado', trigger: 'resolverDisputa()', actor: 'Árbitro' },
];

const colorMap: Record<string, string> = {
  slate: 'bg-slate-700 border-slate-500 text-slate-200',
  blue: 'bg-blue-900/50 border-blue-500 text-blue-200',
  yellow: 'bg-yellow-900/50 border-yellow-500 text-yellow-200',
  cyan: 'bg-cyan-900/50 border-cyan-500 text-cyan-200',
  purple: 'bg-purple-900/50 border-purple-500 text-purple-200',
  green: 'bg-green-900/50 border-green-500 text-green-200',
  red: 'bg-red-900/50 border-red-500 text-red-200',
};

const dotColorMap: Record<string, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-400',
  yellow: 'bg-yellow-400',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  green: 'bg-green-400',
  red: 'bg-red-400',
};

export default function StateMachine() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredTransitions = selectedState
    ? transitions.filter(t => t.from === selectedState || t.to === selectedState)
    : transitions;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔄</span> Máquina de Estados
        </h2>
        <p className="text-slate-400 mt-1">
          Haz clic en un estado para ver sus transiciones. El contrato avanza por hitos verificables on-chain.
        </p>
      </div>

      {/* State Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {states.map((state) => (
          <button
            key={state.id}
            onClick={() => setSelectedState(selectedState === state.id ? null : state.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedState === state.id
                ? `${colorMap[state.color]} shadow-lg scale-[1.02]`
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${dotColorMap[state.color]}`} />
              <span className="text-lg">{state.icon}</span>
              <span className="font-semibold text-sm">{state.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{state.description}</p>
          </button>
        ))}
      </div>

      {/* Transitions Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">
            {selectedState ? `Transiciones de "${selectedState}"` : 'Todas las Transiciones'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="px-5 py-3 text-left font-medium">Desde</th>
                <th className="px-5 py-3 text-left font-medium">→</th>
                <th className="px-5 py-3 text-left font-medium">Hasta</th>
                <th className="px-5 py-3 text-left font-medium">Función</th>
                <th className="px-5 py-3 text-left font-medium">Actor</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransitions.map((t, i) => (
                <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                      {states.find(s => s.id === t.from)?.icon} {t.from}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">→</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                      {states.find(s => s.id === t.to)?.icon} {t.to}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-cyan-400 text-xs bg-slate-900 px-2 py-0.5 rounded">{t.trigger}</code>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{t.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
