import { useState, useCallback } from 'react';

type Estado = 'Creado' | 'AnticipoRecibido' | 'CartaCreditoConfirmada' | 'Certificado' | 'Embarcado' | 'EntregadoEnDestino' | 'Liquidado' | 'Disputado' | 'Cancelado';

interface LogEntry {
  id: number;
  timestamp: string;
  event: string;
  actor: string;
  details: string;
  type: 'info' | 'payment' | 'warning' | 'success' | 'error';
}

interface Puerto {
  id: number;
  nombre: string;
  pais: string;
  locode: string;
  fleteUSD: number;
}

const puertos: Puerto[] = [
  { id: 0, nombre: 'Acajutla', pais: 'El Salvador', locode: 'SVAQJ', fleteUSD: 2800 },
  { id: 1, nombre: 'Miami', pais: 'Estados Unidos', locode: 'USMIA', fleteUSD: 3200 },
  { id: 2, nombre: 'New York', pais: 'Estados Unidos', locode: 'USNYC', fleteUSD: 3600 },
  { id: 3, nombre: 'Barcelona', pais: 'España', locode: 'ESBCN', fleteUSD: 4300 },
  { id: 4, nombre: 'Valencia', pais: 'España', locode: 'ESVLC', fleteUSD: 4200 },
  { id: 5, nombre: 'Rotterdam', pais: 'Países Bajos', locode: 'NLRTM', fleteUSD: 4100 },
  { id: 6, nombre: 'Hong Kong', pais: 'China', locode: 'HKHKG', fleteUSD: 3300 },
  { id: 7, nombre: 'Shanghai', pais: 'China', locode: 'CNSHA', fleteUSD: 3450 },
];

const estadoIcons: Record<Estado, string> = {
  Creado: '📝', AnticipoRecibido: '💸', CartaCreditoConfirmada: '🏦', Certificado: '🔬',
  Embarcado: '🚢', EntregadoEnDestino: '📍', Liquidado: '✅', Disputado: '⚖️', Cancelado: '❌',
};

const estadoColors: Record<Estado, string> = {
  Creado: 'bg-slate-600', AnticipoRecibido: 'bg-green-700', CartaCreditoConfirmada: 'bg-blue-700',
  Certificado: 'bg-yellow-700', Embarcado: 'bg-cyan-700', EntregadoEnDestino: 'bg-purple-700',
  Liquidado: 'bg-emerald-600', Disputado: 'bg-red-700', Cancelado: 'bg-orange-700',
};

interface SimState {
  estado: Estado;
  destinoSeleccionado: boolean;
  puertoDestino: Puerto | null;
  precioFOB: number;
  seguro: number;
  precioDAP: number;
  documentos: Record<string, boolean>;
  lecturas: number;
  cadenaFrioConforme: boolean;
  logs: LogEntry[];
}

const INITIAL: SimState = {
  estado: 'Creado',
  destinoSeleccionado: false,
  puertoDestino: null,
  precioFOB: 12000,
  seguro: 350,
  precioDAP: 0,
  documentos: {},
  lecturas: 0,
  cadenaFrioConforme: true,
  logs: [],
};

export default function DAPSimulator() {
  const [state, setState] = useState<SimState>(INITIAL);
  const [puertoSel, setPuertoSel] = useState(0);
  const [tempInput, setTempInput] = useState('-1850');

  const addLog = useCallback((s: SimState, event: string, actor: string, details: string, type: LogEntry['type']): SimState => ({
    ...s,
    logs: [{ id: s.logs.length + 1, timestamp: new Date().toLocaleTimeString(), event, actor, details, type }, ...s.logs].slice(0, 50),
  }), []);

  const actions = {
    seleccionarDestino: () => {
      if (state.estado !== 'Creado') return;
      const p = puertos[puertoSel];
      setState(s => {
        const dap = s.precioFOB + p.fleteUSD + s.seguro;
        let ns: SimState = { ...s, destinoSeleccionado: true, puertoDestino: p, precioDAP: dap };
        ns = addLog(ns, 'DestinoSeleccionado', 'Importador', `${p.nombre} (${p.locode}) — DAP: $${dap.toLocaleString()}`, 'info');
        return ns;
      });
    },
    registrarAnticipo: () => {
      if (state.estado !== 'Creado' || !state.destinoSeleccionado) return;
      setState(s => {
        const monto = Math.round(s.precioDAP * 0.3);
        let ns: SimState = { ...s, estado: 'AnticipoRecibido' };
        ns = addLog(ns, 'AnticipoRecibido', 'Banco', `SWIFT ref: SW${Date.now().toString(36).toUpperCase()} — $${monto.toLocaleString()} (30%)`, 'payment');
        return ns;
      });
    },
    confirmarLC: () => {
      if (state.estado !== 'AnticipoRecibido') return;
      setState(s => {
        const monto = Math.round(s.precioDAP * 0.7);
        let ns: SimState = { ...s, estado: 'CartaCreditoConfirmada' };
        ns = addLog(ns, 'CartaCreditoConfirmada', 'Banco', `LC ref: LC${Date.now().toString(36).toUpperCase()} — $${monto.toLocaleString()} (70%)`, 'payment');
        return ns;
      });
    },
    registrarDocumentos: () => {
      if (state.estado !== 'CartaCreditoConfirmada') return;
      setState(s => {
        let ns: SimState = { ...s, documentos: { ...s.documentos, FACTURA: true, PACKING_LIST: true, CERT_ORIGEN: true, POLIZA_SEGURO: true } };
        ns = addLog(ns, 'DocumentoRegistrado', 'Exportador', 'Factura + Packing + Cert.Origen + Póliza Seguro', 'info');
        return ns;
      });
    },
    reportarTemp: () => {
      const t = parseInt(tempInput);
      if (isNaN(t) || state.estado === 'Creado' || state.estado === 'Liquidado' || state.estado === 'Cancelado') return;
      setState(s => {
        const conforme = t <= -1800;
        let ns: SimState = { ...s, lecturas: s.lecturas + 1 };
        if (!conforme) ns.cadenaFrioConforme = false;
        ns = addLog(ns, 'TemperaturaReportada', 'Oráculo IoT',
          `${(t/100).toFixed(2)}°C | Conforme: ${conforme ? '✓' : '✗'} | DAP: riesgo del exportador hasta entrega`,
          conforme ? 'success' : 'warning');
        return ns;
      });
    },
    emitirCertificado: () => {
      if (state.estado !== 'CartaCreditoConfirmada' || !state.documentos['FACTURA'] || state.lecturas === 0 || !state.cadenaFrioConforme) return;
      setState(s => {
        let ns: SimState = { ...s, estado: 'Certificado', documentos: { ...s.documentos, CERT_SANITARIO: true } };
        ns = addLog(ns, 'MercanciaCertificada', 'Certificador (SANIPES)', 'Certificado sanitario emitido', 'success');
        return ns;
      });
    },
    registrarDAM: () => {
      if (state.estado !== 'Certificado') return;
      setState(s => {
        let ns: SimState = { ...s, documentos: { ...s.documentos, DAM: true } };
        ns = addLog(ns, 'DocumentoRegistrado', 'Exportador', 'DAM registrada ante SUNAT', 'info');
        return ns;
      });
    },
    embarcar: () => {
      if (state.estado !== 'Certificado' || !state.documentos['DAM']) return;
      setState(s => {
        let ns: SimState = { ...s, estado: 'Embarcado', documentos: { ...s.documentos, BL: true } };
        ns = addLog(ns, 'MercanciaEmbarcada', 'Naviera', `B/L emitido — Riesgo AÚN del exportador (DAP)`, 'info');
        return ns;
      });
    },
    entregarDestino: () => {
      if (state.estado !== 'Embarcado' || !state.cadenaFrioConforme) return;
      setState(s => {
        const p = s.puertoDestino!;
        let ns: SimState = { ...s, estado: 'EntregadoEnDestino', documentos: { ...s.documentos, AVISO_LLEGADA: true } };
        ns = addLog(ns, 'EntregaEnDestino', 'Naviera',
          `Entrega en ${p.nombre} (${p.locode}) — Riesgo transferido → Saldo autorizado: $${Math.round(s.precioDAP * 0.7).toLocaleString()}`, 'payment');
        return ns;
      });
    },
    pagarSaldo: () => {
      if (state.estado !== 'EntregadoEnDestino') return;
      setState(s => {
        let ns: SimState = { ...s, estado: 'Liquidado' };
        ns = addLog(ns, 'PagoSaldoRecibido', 'Banco', `Pago LC ejecutado — $${Math.round(s.precioDAP * 0.7).toLocaleString()} (70%)`, 'success');
        return ns;
      });
    },
    iniciarDisputa: () => {
      if (!['Certificado', 'Embarcado', 'EntregadoEnDestino'].includes(state.estado)) return;
      setState(s => {
        let ns: SimState = { ...s, estado: 'Disputado' };
        ns = addLog(ns, 'DisputaIniciada', 'Exportador/Importador', 'Disputa iniciada — esperando laudo', 'error');
        return ns;
      });
    },
    resolverDisputa: (autorizar: boolean) => {
      if (state.estado !== 'Disputado') return;
      setState(s => {
        let ns: SimState;
        if (autorizar) {
          ns = { ...s, estado: 'EntregadoEnDestino' };
          ns = addLog(ns, 'DisputaResuelta', 'Árbitro', 'Pago del saldo AUTORIZADO', 'success');
        } else {
          ns = { ...s, estado: 'Cancelado' };
          ns = addLog(ns, 'DisputaResuelta', 'Árbitro', 'Pago del saldo DENEGADO — Contrato cancelado', 'error');
        }
        return ns;
      });
    },
    cancelar: () => {
      if (['Embarcado', 'EntregadoEnDestino', 'Liquidado', 'Disputado', 'Cancelado'].includes(state.estado)) return;
      setState(s => {
        let ns: SimState = { ...s, estado: 'Cancelado' };
        ns = addLog(ns, 'ContratoCancelado', 'Importador', 'Cancelación por vencimiento de plazo', 'warning');
        return ns;
      });
    },
    reset: () => setState(INITIAL),
  };

  const logColors: Record<string, string> = {
    info: 'border-blue-500/30 bg-blue-500/5',
    payment: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  const anticipo = Math.round(state.precioDAP * 0.3);
  const saldo = Math.round(state.precioDAP * 0.7);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🧪</span> Simulador DAP
        </h2>
        <p className="text-slate-400 mt-1">
          Simula el flujo DAP: selección de destino → anticipo SWIFT → carta de crédito → embarque → entrega → pago.
        </p>
      </div>

      {/* Config */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Precio FOB (USD)</label>
            <input type="number" value={state.precioFOB}
              onChange={e => setState(s => ({ ...s, precioFOB: Number(e.target.value), precioDAP: s.destinoSeleccionado ? Number(e.target.value) + (s.puertoDestino?.fleteUSD || 0) + s.seguro : 0 }))}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Seguro (USD)</label>
            <input type="number" value={state.seguro}
              onChange={e => setState(s => ({ ...s, seguro: Number(e.target.value), precioDAP: s.destinoSeleccionado ? s.precioFOB + (s.puertoDestino?.fleteUSD || 0) + Number(e.target.value) : 0 }))}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Puerto Destino</label>
            <select value={puertoSel} onChange={e => setPuertoSel(Number(e.target.value))}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none">
              {puertos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — ${p.fleteUSD.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Temp. (centésimas °C)</label>
            <input type="number" value={tempInput} onChange={e => setTempInput(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:border-purple-500 focus:outline-none" />
          </div>
          <button onClick={actions.reset} className="px-4 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-xs text-red-300 ml-auto">🔄 Reset</button>
        </div>
      </div>

      {/* State Progress */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {(['Creado','AnticipoRecibido','CartaCreditoConfirmada','Certificado','Embarcado','EntregadoEnDestino','Liquidado'] as Estado[]).map((est, i, arr) => (
            <div key={est} className="flex items-center">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                state.estado === est ? `${estadoColors[est]} text-white ring-1 ring-white/20` :
                arr.indexOf(state.estado) > i ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-800/50 text-slate-600'
              }`}>
                <span>{estadoIcons[est]}</span>
                <span className="hidden lg:inline">{est.replace('CartaCreditoConfirmada','LC OK')}</span>
              </div>
              {i < arr.length - 1 && <span className="text-slate-600 mx-0.5">›</span>}
            </div>
          ))}
          {(state.estado === 'Disputado' || state.estado === 'Cancelado') && (
            <div className={`ml-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${estadoColors[state.estado]} text-white`}>
              <span>{estadoIcons[state.estado]}</span> {state.estado}
            </div>
          )}
        </div>
      </div>

      {/* Actions + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">Acciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionBtn label="🌍 seleccionarDestino()" sub={`→ ${puertos[puertoSel].nombre}`} onClick={actions.seleccionarDestino} disabled={state.estado !== 'Creado'} color="purple" />
              <ActionBtn label="💸 registrarAnticipo()" sub={`30% SWIFT — $${anticipo.toLocaleString()}`} onClick={actions.registrarAnticipo} disabled={state.estado !== 'Creado' || !state.destinoSeleccionado} color="green" />
              <ActionBtn label="🏦 confirmarCartaCredito()" sub={`70% LC — $${saldo.toLocaleString()}`} onClick={actions.confirmarLC} disabled={state.estado !== 'AnticipoRecibido'} color="blue" />
              <ActionBtn label="📄 registrarDocumentos()" sub="Factura+Packing+Origen+Seguro" onClick={actions.registrarDocumentos} disabled={state.estado !== 'CartaCreditoConfirmada'} color="slate" />
              <ActionBtn label="🌡️ reportarTemperatura()" sub={`${(parseInt(tempInput)/100).toFixed(2)}°C`} onClick={actions.reportarTemp} disabled={state.estado === 'Creado' || state.estado === 'Liquidado' || state.estado === 'Cancelado'} color="blue" />
              <ActionBtn label="🔬 emitirCertificado()" sub="SANIPES → desbloquea embarque" onClick={actions.emitirCertificado} disabled={state.estado !== 'CartaCreditoConfirmada' || !state.documentos['FACTURA'] || state.lecturas === 0 || !state.cadenaFrioConforme} color="yellow" />
              <ActionBtn label="🏛️ registrarDAM()" sub="SUNAT" onClick={actions.registrarDAM} disabled={state.estado !== 'Certificado'} color="slate" />
              <ActionBtn label="🚢 registrarEmbarque()" sub="B/L — riesgo AÚN del vendedor" onClick={actions.embarcar} disabled={state.estado !== 'Certificado' || !state.documentos['DAM']} color="cyan" />
              <ActionBtn label="📍 entregarEnDestino()" sub={`→ ${state.puertoDestino?.nombre || '...'} — Riesgo transferido`} onClick={actions.entregarDestino} disabled={state.estado !== 'Embarcado' || !state.cadenaFrioConforme} color="purple" />
              <ActionBtn label="💰 registrarPagoSaldo()" sub={`Banco ejecuta LC — $${saldo.toLocaleString()}`} onClick={actions.pagarSaldo} disabled={state.estado !== 'EntregadoEnDestino'} color="green" />
              <ActionBtn label="⚖️ iniciarDisputa()" sub="Antes de liquidación" onClick={actions.iniciarDisputa} disabled={!['Certificado','Embarcado','EntregadoEnDestino'].includes(state.estado)} color="red" />
              {state.estado === 'Disputado' && (
                <>
                  <ActionBtn label="✅ resolverDisputa(true)" sub="Autorizar pago" onClick={() => actions.resolverDisputa(true)} disabled={false} color="green" />
                  <ActionBtn label="❌ resolverDisputa(false)" sub="Denegar pago" onClick={() => actions.resolverDisputa(false)} disabled={false} color="red" />
                </>
              )}
              <ActionBtn label="⏰ cancelarPorVencimiento()" sub="Antes del embarque" onClick={actions.cancelar} disabled={['Embarcado','EntregadoEnDestino','Liquidado','Disputado','Cancelado'].includes(state.estado)} color="orange" />
            </div>
          </div>

          {/* Log */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">📡 Log de Eventos</h3>
              <span className="text-xs text-slate-500">{state.logs.length} eventos</span>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/30">
              {state.logs.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  Sin eventos. Comienza seleccionando un destino.
                </div>
              ) : state.logs.map(log => (
                <div key={log.id} className={`px-5 py-2 border-l-2 ${logColors[log.type]}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    <code className="text-xs text-cyan-400">{log.event}</code>
                    <span className="text-xs text-slate-500">por {log.actor}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold text-white text-sm mb-2">Estado</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${estadoColors[state.estado]} text-white text-sm`}>
              <span>{estadoIcons[state.estado]}</span> {state.estado}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-2">
            <h3 className="font-semibold text-white text-sm">💵 Precios (USD)</h3>
            <div className="flex justify-between text-xs"><span className="text-slate-400">FOB</span><span className="text-white">${state.precioFOB.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Flete</span><span className="text-cyan-300">${state.puertoDestino?.fleteUSD.toLocaleString() || '—'}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Seguro</span><span className="text-yellow-300">${state.seguro.toLocaleString()}</span></div>
            <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold"><span className="text-purple-300">DAP Total</span><span className="text-white">${state.precioDAP.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">30% SWIFT</span><span className="text-green-300">${anticipo.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">70% LC</span><span className="text-blue-300">${saldo.toLocaleString()}</span></div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-2">
            <h3 className="font-semibold text-white text-sm">🌡️ Cadena de Frío</h3>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Lecturas</span><span className="text-white">{state.lecturas}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-400">Conforme</span><span className={state.cadenaFrioConforme ? 'text-green-400' : 'text-red-400'}>{state.cadenaFrioConforme ? '✓' : '✗ ROTA'}</span></div>
            <p className="text-[10px] text-slate-500">En DAP, riesgo del exportador hasta entrega</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-1.5">
            <h3 className="font-semibold text-white text-sm">📄 Documentos</h3>
            {['FACTURA','PACKING_LIST','CERT_ORIGEN','POLIZA_SEGURO','CERT_SANITARIO','DAM','BL','AVISO_LLEGADA'].map(d => (
              <div key={d} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${state.documentos[d] ? 'bg-green-400' : 'bg-slate-600'}`} />
                <span className={`text-[10px] ${state.documentos[d] ? 'text-slate-300' : 'text-slate-600'}`}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, sub, onClick, disabled, color }: { label: string; sub: string; onClick: () => void; disabled: boolean; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/40',
    green: 'bg-green-900/20 border-green-500/30 hover:bg-green-900/40',
    blue: 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/40',
    yellow: 'bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/40',
    cyan: 'bg-cyan-900/20 border-cyan-500/30 hover:bg-cyan-900/40',
    red: 'bg-red-900/20 border-red-500/30 hover:bg-red-900/40',
    orange: 'bg-orange-900/20 border-orange-500/30 hover:bg-orange-900/40',
    slate: 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50',
  };
  const textColor: Record<string, string> = {
    purple: 'text-purple-300', green: 'text-green-300', blue: 'text-blue-300',
    yellow: 'text-yellow-300', cyan: 'text-cyan-300', red: 'text-red-300',
    orange: 'text-orange-300', slate: 'text-slate-300',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`p-3 rounded-lg border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]} disabled:hover:${colorMap[color]}`}>
      <div className={`text-sm font-medium ${textColor[color]}`}>{label}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </button>
  );
}
