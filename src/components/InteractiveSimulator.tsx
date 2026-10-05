import { useState, useCallback } from 'react';

type Estado = 'Creado' | 'Financiado' | 'Inspeccionado' | 'ABordo' | 'Arribado' | 'Cerrado' | 'Disputado';

interface LogEntry {
  id: number;
  timestamp: string;
  event: string;
  actor: string;
  details: string;
  type: 'info' | 'payment' | 'warning' | 'success' | 'error';
}

interface SimState {
  estado: Estado;
  documentos: Record<string, string>;
  lecturasPreEmbarque: number;
  tempConformePreEmbarque: boolean;
  balanceEscrow: number;
  pagadoExportador: number;
  pagadoImportador: number;
  logs: LogEntry[];
  fechaABordo: string | null;
  precioCFR: number;
}

const INITIAL_STATE: SimState = {
  estado: 'Creado',
  documentos: {},
  lecturasPreEmbarque: 0,
  tempConformePreEmbarque: true,
  balanceEscrow: 0,
  pagadoExportador: 0,
  pagadoImportador: 0,
  logs: [],
  fechaABordo: null,
  precioCFR: 150000, // 150,000 USDC
};

const estadoColors: Record<Estado, string> = {
  Creado: 'bg-slate-600',
  Financiado: 'bg-blue-600',
  Inspeccionado: 'bg-yellow-600',
  ABordo: 'bg-cyan-600',
  Arribado: 'bg-purple-600',
  Cerrado: 'bg-green-600',
  Disputado: 'bg-red-600',
};

const estadoIcons: Record<Estado, string> = {
  Creado: '📝',
  Financiado: '💰',
  Inspeccionado: '🔬',
  ABordo: '🚢',
  Arribado: '⚓',
  Cerrado: '✅',
  Disputado: '⚖️',
};

const estados: Estado[] = ['Creado', 'Financiado', 'Inspeccionado', 'ABordo', 'Arribado', 'Cerrado', 'Disputado'];

export default function InteractiveSimulator() {
  const [state, setState] = useState<SimState>(INITIAL_STATE);
  const [precioInput, setPrecioInput] = useState('150000');
  const [tempInput, setTempInput] = useState('-1850');
  const [disputaPorc, setDisputaPorc] = useState('50');

  const addLog = useCallback((s: SimState, event: string, actor: string, details: string, type: LogEntry['type']): SimState => {
    const entry: LogEntry = {
      id: s.logs.length + 1,
      timestamp: new Date().toLocaleTimeString(),
      event,
      actor,
      details,
      type,
    };
    return { ...s, logs: [entry, ...s.logs].slice(0, 50) };
  }, []);

  const actions = {
    setPrecio: () => {
      const p = parseInt(precioInput);
      if (p > 0) setState(s => ({ ...s, precioCFR: p }));
    },

    financiar: () => {
      if (state.estado !== 'Creado') return;
      setState(s => {
        let ns = { ...s, estado: 'Financiado' as Estado, balanceEscrow: s.precioCFR };
        ns = addLog(ns, 'PedidoFinanciado', 'Importador', `Depositó ${s.precioCFR.toLocaleString()} USDC en escrow`, 'success');
        return ns;
      });
    },

    registrarDocumentos: () => {
      if (state.estado !== 'Financiado') return;
      setState(s => {
        const newDocs: Record<string, string> = { ...s.documentos, FACTURA: '0xabc...', PACKING_LIST: '0xdef...', CERT_ORIGEN: '0x123...' };
        let ns: SimState = { ...s, documentos: newDocs };
        ns = addLog(ns, 'DocumentoRegistrado', 'Exportador', 'Factura + Packing List + Cert. Origen (TLC)', 'info');
        return ns;
      });
    },

    reportarTemperatura: () => {
      const temp = parseInt(tempInput);
      if (isNaN(temp)) return;
      setState(s => {
        const conforme = temp <= -1800;
        const riesgoComprador = s.estado === 'ABordo' || s.estado === 'Arribado';
        let ns = { ...s };
        if (!riesgoComprador) {
          ns.lecturasPreEmbarque = s.lecturasPreEmbarque + 1;
          if (!conforme) ns.tempConformePreEmbarque = false;
        }
        ns = addLog(ns, 'TemperaturaReportada', 'Oráculo IoT',
          `${(temp / 100).toFixed(2)}°C | Conforme: ${conforme ? '✓' : '✗'} | Riesgo comprador: ${riesgoComprador ? 'Sí' : 'No'}`,
          conforme ? 'success' : 'warning');
        return ns;
      });
    },

    emitirCertificado: () => {
      if (state.estado !== 'Financiado') return;
      if (!state.documentos['FACTURA']) return;
      if (state.lecturasPreEmbarque === 0 || !state.tempConformePreEmbarque) return;
      setState(s => {
        const anticipo = Math.floor(s.precioCFR * 30 / 100);
        const newDocs: Record<string, string> = { ...s.documentos, CERT_SANITARIO: '0xsan...' };
        let ns: SimState = {
          ...s,
          estado: 'Inspeccionado',
          balanceEscrow: s.balanceEscrow - anticipo,
          pagadoExportador: s.pagadoExportador + anticipo,
          documentos: newDocs,
        };
        ns = addLog(ns, 'MercanciaInspeccionada', 'Certificador (SANIPES)',
          `Certificado sanitario emitido → Anticipo ${anticipo.toLocaleString()} USDC al exportador`, 'payment');
        return ns;
      });
    },

    registrarDAM: () => {
      if (state.estado !== 'Inspeccionado') return;
      setState(s => {
        const newDocs: Record<string, string> = { ...s.documentos, DAM: '0xdam...' };
        let ns: SimState = { ...s, documentos: newDocs };
        ns = addLog(ns, 'DocumentoRegistrado', 'Exportador', 'DAM registrada ante SUNAT', 'info');
        return ns;
      });
    },

    registrarEmbarque: () => {
      if (state.estado !== 'Inspeccionado') return;
      if (!state.documentos['DAM']) return;
      if (!state.tempConformePreEmbarque) return;
      setState(s => {
        const saldo = s.balanceEscrow;
        const newDocs: Record<string, string> = { ...s.documentos, BL: '0xbl...' };
        let ns: SimState = {
          ...s,
          estado: 'ABordo',
          balanceEscrow: 0,
          pagadoExportador: s.pagadoExportador + saldo,
          fechaABordo: new Date().toLocaleString(),
          documentos: newDocs,
        };
        ns = addLog(ns, 'RiesgoTransferido', 'Agente de Carga',
          `B/L "a bordo" → Riesgo CFR transmitido → Saldo ${saldo.toLocaleString()} USDC al exportador`, 'payment');
        return ns;
      });
    },

    registrarArribo: () => {
      if (state.estado !== 'ABordo') return;
      setState(s => {
        let ns = { ...s, estado: 'Arribado' as Estado };
        ns = addLog(ns, 'MercanciaArribada', 'Agente de Carga', 'Mercancía arribó a puerto Shanghai', 'info');
        return ns;
      });
    },

    confirmarRecepcion: () => {
      if (state.estado !== 'Arribado') return;
      setState(s => {
        let ns = { ...s, estado: 'Cerrado' as Estado };
        ns = addLog(ns, 'RecepcionConfirmada', 'Importador', 'Recepción confirmada — Contrato cerrado', 'success');
        return ns;
      });
    },

    iniciarDisputa: () => {
      if (state.estado !== 'Financiado' && state.estado !== 'Inspeccionado') return;
      setState(s => {
        let ns = { ...s, estado: 'Disputado' as Estado };
        ns = addLog(ns, 'DisputaIniciada', 'Exportador/Importador', 'Disputa iniciada — Esperando laudo arbitral', 'error');
        return ns;
      });
    },

    resolverDisputa: () => {
      if (state.estado !== 'Disputado') return;
      const porc = parseInt(disputaPorc);
      if (isNaN(porc) || porc < 0 || porc > 100) return;
      setState(s => {
        const saldo = s.balanceEscrow;
        const aExp = Math.floor(saldo * porc / 100);
        const aImp = saldo - aExp;
        let ns = {
          ...s,
          estado: 'Cerrado' as Estado,
          balanceEscrow: 0,
          pagadoExportador: s.pagadoExportador + aExp,
          pagadoImportador: s.pagadoImportador + aImp,
        };
        ns = addLog(ns, 'DisputaResuelta', 'Árbitro',
          `Laudo: ${porc}% exportador (${aExp.toLocaleString()} USDC) / ${100 - porc}% importador (${aImp.toLocaleString()} USDC)`, 'payment');
        return ns;
      });
    },

    cancelarVencimiento: () => {
      if (state.estado !== 'Financiado' && state.estado !== 'Inspeccionado') return;
      setState(s => {
        const saldo = s.balanceEscrow;
        let ns = {
          ...s,
          estado: 'Cerrado' as Estado,
          balanceEscrow: 0,
          pagadoImportador: s.pagadoImportador + saldo,
        };
        ns = addLog(ns, 'ContratoCancelado', 'Importador',
          `Cancelación por vencimiento → ${saldo.toLocaleString()} USDC devueltos al importador`, 'warning');
        return ns;
      });
    },

    reset: () => setState(INITIAL_STATE),
  };

  const logTypeColors: Record<string, string> = {
    info: 'border-blue-500/30 bg-blue-500/5',
    payment: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🧪</span> Simulador Interactivo
        </h2>
        <p className="text-slate-400 mt-1">
          Simula el flujo completo del contrato. Usa USDC simulado (6 decimales). Configura el precio y avanza por los hitos.
        </p>
      </div>

      {/* Config Bar */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Precio CFR (USDC)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={precioInput}
                onChange={e => setPrecioInput(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-32 focus:border-blue-500 focus:outline-none"
              />
              <button onClick={actions.setPrecio} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300">
                Set
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Temp. Sensor (centésimas °C)</label>
            <input
              type="number"
              value={tempInput}
              onChange={e => setTempInput(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-32 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">% Árbitro (disputa)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={disputaPorc}
              onChange={e => setDisputaPorc(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button onClick={actions.reset} className="px-4 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-xs text-red-300 ml-auto">
            🔄 Reset
          </button>
        </div>
      </div>

      {/* State Progress */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {estados.map((est, i) => (
            <div key={est} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                state.estado === est
                  ? `${estadoColors[est]} text-white ring-2 ring-white/20`
                  : estados.indexOf(state.estado) > i
                    ? 'bg-slate-700/50 text-slate-400'
                    : 'bg-slate-800/50 text-slate-600'
              }`}>
                <span>{estadoIcons[est]}</span>
                <span className="hidden sm:inline">{est}</span>
              </div>
              {i < estados.length - 1 && (
                <span className="text-slate-600 mx-0.5">›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">Acciones Disponibles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Financiar */}
              <button
                onClick={actions.financiar}
                disabled={state.estado !== 'Creado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/40 disabled:hover:bg-blue-900/20"
              >
                <div className="text-sm font-medium text-blue-300">💰 financiar()</div>
                <div className="text-xs text-slate-400 mt-1">Importador deposita 100% USDC</div>
              </button>

              {/* Documentos */}
              <button
                onClick={actions.registrarDocumentos}
                disabled={state.estado !== 'Financiado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50 disabled:hover:bg-slate-700/30"
              >
                <div className="text-sm font-medium text-slate-300">📄 registrarDocumentosComerciales()</div>
                <div className="text-xs text-slate-400 mt-1">Factura + Packing + Cert. Origen</div>
              </button>

              {/* Temperatura */}
              <button
                onClick={actions.reportarTemperatura}
                disabled={state.estado === 'Creado' || state.estado === 'Cerrado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/40 disabled:hover:bg-blue-900/20"
              >
                <div className="text-sm font-medium text-blue-300">🌡️ reportarTemperatura()</div>
                <div className="text-xs text-slate-400 mt-1">Oráculo IoT: {tempInput} → {(parseInt(tempInput) / 100).toFixed(2)}°C</div>
              </button>

              {/* Certificado */}
              <button
                onClick={actions.emitirCertificado}
                disabled={state.estado !== 'Financiado' || !state.documentos['FACTURA'] || state.lecturasPreEmbarque === 0 || !state.tempConformePreEmbarque}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/40 disabled:hover:bg-yellow-900/20"
              >
                <div className="text-sm font-medium text-yellow-300">🔬 emitirCertificadoSanitario()</div>
                <div className="text-xs text-slate-400 mt-1">Libera anticipo 30%</div>
              </button>

              {/* DAM */}
              <button
                onClick={actions.registrarDAM}
                disabled={state.estado !== 'Inspeccionado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50 disabled:hover:bg-slate-700/30"
              >
                <div className="text-sm font-medium text-slate-300">🏛️ registrarDAM()</div>
                <div className="text-xs text-slate-400 mt-1">Declaración aduanera SUNAT</div>
              </button>

              {/* Embarque */}
              <button
                onClick={actions.registrarEmbarque}
                disabled={state.estado !== 'Inspeccionado' || !state.documentos['DAM'] || !state.tempConformePreEmbarque}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-cyan-900/20 border-cyan-500/30 hover:bg-cyan-900/40 disabled:hover:bg-cyan-900/20"
              >
                <div className="text-sm font-medium text-cyan-300">🚢 registrarEmbarque()</div>
                <div className="text-xs text-slate-400 mt-1">B/L a bordo → Riesgo CFR + saldo 70%</div>
              </button>

              {/* Arribo */}
              <button
                onClick={actions.registrarArribo}
                disabled={state.estado !== 'ABordo'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/40 disabled:hover:bg-purple-900/20"
              >
                <div className="text-sm font-medium text-purple-300">⚓ registrarArribo()</div>
                <div className="text-xs text-slate-400 mt-1">Mercancía llega a Shanghai</div>
              </button>

              {/* Recepción */}
              <button
                onClick={actions.confirmarRecepcion}
                disabled={state.estado !== 'Arribado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-green-900/20 border-green-500/30 hover:bg-green-900/40 disabled:hover:bg-green-900/20"
              >
                <div className="text-sm font-medium text-green-300">✅ confirmarRecepcion()</div>
                <div className="text-xs text-slate-400 mt-1">Importador confirma — Contrato cerrado</div>
              </button>

              {/* Disputa */}
              <button
                onClick={actions.iniciarDisputa}
                disabled={state.estado !== 'Financiado' && state.estado !== 'Inspeccionado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-red-900/20 border-red-500/30 hover:bg-red-900/40 disabled:hover:bg-red-900/20"
              >
                <div className="text-sm font-medium text-red-300">⚖️ iniciarDisputa()</div>
                <div className="text-xs text-slate-400 mt-1">Solo antes del embarque</div>
              </button>

              {/* Resolver */}
              <button
                onClick={actions.resolverDisputa}
                disabled={state.estado !== 'Disputado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-red-900/20 border-red-500/30 hover:bg-red-900/40 disabled:hover:bg-red-900/20"
              >
                <div className="text-sm font-medium text-red-300">⚖️ resolverDisputa({disputaPorc}%)</div>
                <div className="text-xs text-slate-400 mt-1">Árbitro reparte saldo</div>
              </button>

              {/* Cancelar */}
              <button
                onClick={actions.cancelarVencimiento}
                disabled={state.estado !== 'Financiado' && state.estado !== 'Inspeccionado'}
                className="p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed
                  bg-orange-900/20 border-orange-500/30 hover:bg-orange-900/40 disabled:hover:bg-orange-900/20"
              >
                <div className="text-sm font-medium text-orange-300">⏰ cancelarPorVencimiento()</div>
                <div className="text-xs text-slate-400 mt-1">Importador recupera saldo</div>
              </button>
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">📡 Log de Eventos (Middleware ERP)</h3>
              <span className="text-xs text-slate-500">{state.logs.length} eventos</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/30">
              {state.logs.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  Sin eventos aún. Inicia el flujo con <code className="text-cyan-400">financiar()</code>
                </div>
              ) : (
                state.logs.map(log => (
                  <div key={log.id} className={`px-5 py-2.5 border-l-2 ${logTypeColors[log.type]}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      <code className="text-xs text-cyan-400">{log.event}</code>
                      <span className="text-xs text-slate-500">por {log.actor}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* State Panel */}
        <div className="space-y-4">
          {/* Current State */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="font-semibold text-white mb-3 text-sm">Estado Actual</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${estadoColors[state.estado]} text-white`}>
              <span>{estadoIcons[state.estado]}</span>
              <span className="font-bold">{state.estado}</span>
            </div>
          </div>

          {/* Balances */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">💵 Balances USDC</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Escrow</span>
                <span className="text-sm font-mono font-bold text-white">{state.balanceEscrow.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">🏭 Exportador</span>
                <span className="text-sm font-mono font-bold text-amber-300">{state.pagadoExportador.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">🏢 Importador</span>
                <span className="text-sm font-mono font-bold text-red-300">{state.pagadoImportador.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-400">Precio CFR</span>
                <span className="text-sm font-mono text-slate-300">{state.precioCFR.toLocaleString()}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${state.precioCFR > 0 ? (state.pagadoExportador / state.precioCFR) * 100 : 0}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${state.precioCFR > 0 ? (state.pagadoImportador / state.precioCFR) * 100 : 0}%` }}
                />
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${state.precioCFR > 0 ? (state.balanceEscrow / state.precioCFR) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                <span>🟡 Export.</span>
                <span>🔴 Imp.</span>
                <span>🔵 Escrow</span>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">🌡️ Cadena de Frío</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Lecturas pre-embarque</span>
                <span className="text-sm font-mono text-white">{state.lecturasPreEmbarque}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Conforme</span>
                <span className={`text-sm font-mono ${state.tempConformePreEmbarque ? 'text-green-400' : 'text-red-400'}`}>
                  {state.tempConformePreEmbarque ? '✓ Sí' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Temp. máxima</span>
                <span className="text-sm font-mono text-cyan-300">-18.00°C</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm">📄 Documentos</h3>
            <div className="space-y-1.5">
              {['FACTURA', 'PACKING_LIST', 'CERT_ORIGEN', 'CERT_SANITARIO', 'DAM', 'BL'].map(doc => (
                <div key={doc} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${state.documentos[doc] ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span className={`text-xs ${state.documentos[doc] ? 'text-slate-300' : 'text-slate-600'}`}>{doc}</span>
                  {state.documentos[doc] && (
                    <code className="text-[10px] text-slate-500 ml-auto">{state.documentos[doc]}</code>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
