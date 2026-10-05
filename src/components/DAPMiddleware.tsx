const middlewareCode = `// middleware/listener.js - eventos del contrato ExportacionPotaDAP -> API REST del ERP
const { ethers } = require("ethers");
const axios = require("axios");
const abi = require("./ExportacionPotaDAP.abi.json");

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);
const contrato = new ethers.Contract(process.env.CONTRATO, abi, provider);
const erp = axios.create({
  baseURL: process.env.ERP_API,
  headers: { Authorization: \`Bearer \${process.env.ERP_TOKEN}\` }
});
const PEDIDO = process.env.PEDIDO_ID;
const usd = (c) => (Number(c) / 100).toFixed(2);    // centavos -> USD
const txt = (b) => ethers.toUtf8String(b);           // bytes5 "NLRTM" -> texto

// Catalogo: mismo orden que los enum del contrato
const CONTINENTES = ["America", "Europa", "Asia"];
const PAISES  = ["El Salvador", "Estados Unidos", "Espana", "Paises Bajos", "China"];
const PUERTOS = ["Acajutla", "Miami", "New York", "Barcelona", "Valencia",
                 "Rotterdam", "Hong Kong", "Shanghai"];

contrato.on("ContratoCreado", (kg, fob, fechaLimite, ev) =>
  erp.post("/pedidos-exportacion", {
    pedido: PEDIDO, kg: Number(kg), precioFOB: usd(fob),
    incoterm: "DAP", fechaLimiteEmbarque: new Date(Number(fechaLimite) * 1000),
    contrato: ev.log.address
  }));

contrato.on("DestinoSeleccionado", (cont, pais, puerto, locode, precio, dias) =>
  erp.patch(\`/pedidos-exportacion/\${PEDIDO}/destino\`, {
    continente: CONTINENTES[Number(cont)], pais: PAISES[Number(pais)],
    puerto: PUERTOS[Number(puerto)], locode: txt(locode),
    precioDAP: usd(precio), transitoDias: Number(dias)
  }));

contrato.on("FleteActualizado", (puerto, flete) =>
  erp.patch(\`/puertos/\${PUERTOS[Number(puerto)]}\`, { flete: usd(flete) }));

contrato.on("AnticipoRecibido", (ref, monto) =>
  erp.post("/cobros", {
    pedido: PEDIDO, medio: "SWIFT", porcentaje: 30,
    monto: usd(monto), ref
  }));

contrato.on("CartaCreditoConfirmada", (ref, monto) =>
  erp.post("/cartas-credito", {
    pedido: PEDIDO, ref, estado: "Confirmada", monto: usd(monto)
  }));

contrato.on("DocumentoRegistrado", (tipo, hash, por, ev) =>
  erp.post(\`/expedientes/\${PEDIDO}/documentos\`, {
    tipo: ethers.decodeBytes32String(tipo),
    hash, registradoPor: por, tx: ev.log.transactionHash
  }));

contrato.on("TemperaturaReportada", async (t, conforme) => {
  await erp.post(\`/lotes/\${PEDIDO}/temperaturas\`, {
    celsius: Number(t) / 100, conforme
  });
  if (!conforme) await erp.post("/alertas", {
    pedido: PEDIDO, tipo: "CADENA_FRIO",
    responsable: "EXPORTADOR (DAP)"
  });
});

contrato.on("MercanciaCertificada", (hash) =>
  erp.patch(\`/lotes/\${PEDIDO}\`, { certificado: true, hash }));

contrato.on("MercanciaEmbarcada", (hashBL, fecha) =>
  erp.patch(\`/embarques/\${PEDIDO}\`, {
    estado: "Embarcado", hashBL,
    fecha: new Date(Number(fecha) * 1000), kardex: "EN_TRANSITO"
  }));

contrato.on("EntregaEnDestino", (pais, puerto, locode, fecha) =>
  erp.patch(\`/embarques/\${PEDIDO}\`, {
    estado: "Entregado", pais: PAISES[Number(pais)],
    puerto: PUERTOS[Number(puerto)], locode: txt(locode),
    fecha: new Date(Number(fecha) * 1000)
  }));

contrato.on("RiesgoTransferido", () =>
  erp.patch(\`/lotes/\${PEDIDO}\`, { kardex: "BAJA_DEFINITIVA" }));

contrato.on("PagoSaldoAutorizado", (monto) =>
  erp.post(\`/cartas-credito/\${PEDIDO}/presentacion\`, { monto: usd(monto) }));

contrato.on("PagoSaldoRecibido", (ref, monto) =>
  erp.post("/cobros", {
    pedido: PEDIDO, medio: "CARTA_CREDITO", porcentaje: 70,
    monto: usd(monto), ref, cierre: true
  }));

contrato.on("DisputaIniciada", (quien, motivo) =>
  erp.patch(\`/lotes/\${PEDIDO}\`, { congelado: true, motivo }));

contrato.on("DisputaResuelta", (autorizado) =>
  erp.post("/reportes/laudo", { pedido: PEDIDO, pagoAutorizado: autorizado }));

contrato.on("ContratoCancelado", (motivo) =>
  erp.post(\`/pedidos-exportacion/\${PEDIDO}/cancelacion\`, { motivo }));`;

const eventMappings = [
  { event: 'ContratoCreado', erp: 'POST /pedidos-exportacion', desc: 'Crea pedido de exportación con incoterm DAP', color: 'blue' },
  { event: 'DestinoSeleccionado', erp: 'PATCH /pedidos/{id}/destino', desc: 'Actualiza país, puerto, locode, precio DAP y días de tránsito', color: 'purple' },
  { event: 'FleteActualizado', erp: 'PATCH /puertos/{nombre}', desc: 'Actualiza maestro de puertos del ERP', color: 'cyan' },
  { event: 'AnticipoRecibido', erp: 'POST /cobros (SWIFT 30%)', desc: 'Registra cobro del adelanto vía transferencia SWIFT', color: 'green' },
  { event: 'CartaCreditoConfirmada', erp: 'POST /cartas-credito', desc: 'Registra carta de crédito confirmada por el banco', color: 'blue' },
  { event: 'DocumentoRegistrado', erp: 'POST /expedientes/{id}/documentos', desc: 'Registra hash del documento en el expediente', color: 'cyan' },
  { event: 'TemperaturaReportada', erp: 'POST /lotes/{id}/temperaturas + /alertas', desc: 'Registra lectura IoT. Si no conforme: alerta al exportador (DAP)', color: 'yellow' },
  { event: 'MercanciaCertificada', erp: 'PATCH /lotes/{id}', desc: 'Marca lote como certificado sanitariamente', color: 'amber' },
  { event: 'MercanciaEmbarcada', erp: 'PATCH /embarques/{id}', desc: 'Kardex → EN_TRANSITO. B/L registrado.', color: 'purple' },
  { event: 'EntregaEnDestino', erp: 'PATCH /embarques/{id}', desc: 'Estado → Entregado. País, puerto y locode actualizados.', color: 'purple' },
  { event: 'RiesgoTransferido', erp: 'PATCH /lotes/{id} → BAJA_DEFINITIVA', desc: 'Baja definitiva del kardex (DAP: al llegar a destino)', color: 'green' },
  { event: 'PagoSaldoAutorizado', erp: 'POST /cartas-credito/{id}/presentacion', desc: 'Presentación de documentos al banco para cobro LC', color: 'green' },
  { event: 'PagoSaldoRecibido', erp: 'POST /cobros (LC 70%) + cierre', desc: 'Cobro de carta de crédito ejecutado. Pedido cerrado.', color: 'green' },
  { event: 'DisputaIniciada', erp: 'PATCH /lotes/{id} → congelado', desc: 'Congela el lote hasta resolución', color: 'red' },
  { event: 'DisputaResuelta', erp: 'POST /reportes/laudo', desc: 'Registra si se autoriza o deniega el pago', color: 'amber' },
  { event: 'ContratoCancelado', erp: 'POST /pedidos/{id}/cancelacion', desc: 'Cancela pedido de exportación', color: 'red' },
];

const colorClasses: Record<string, { bg: string; border: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  green: { bg: 'bg-green-500/5', border: 'border-green-500/20', dot: 'bg-green-400' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', dot: 'bg-purple-400' },
  red: { bg: 'bg-red-500/5', border: 'border-red-500/20', dot: 'bg-red-400' },
};

export default function DAPMiddleware() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔗</span> Middleware ERP — DAP
        </h2>
        <p className="text-slate-400 mt-1">
          16 eventos mapeados a acciones REST. El banco actúa como oráculo: los pagos SWIFT y LC se registran on-chain y el middleware los refleja en el ERP.
        </p>
      </div>

      {/* Architecture */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="font-semibold text-white mb-4 text-sm">Arquitectura DAP</h3>
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="flex-1 bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-lg border border-purple-500/30 p-4 text-center">
            <div className="text-2xl mb-1">⛓️</div>
            <div className="font-semibold text-purple-300 text-xs">Smart Contract DAP</div>
            <div className="text-[10px] text-slate-400">16 eventos</div>
          </div>
          <div className="text-slate-500 text-xs text-center">
            <div>WebSocket</div>
            <div>→</div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-indigo-900/30 to-slate-800 rounded-lg border border-indigo-500/30 p-4 text-center">
            <div className="text-2xl mb-1">🔄</div>
            <div className="font-semibold text-indigo-300 text-xs">Middleware</div>
            <div className="text-[10px] text-slate-400">centavos→USD, bytes5→texto</div>
          </div>
          <div className="text-slate-500 text-xs text-center">
            <div>REST API</div>
            <div>→</div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-green-900/30 to-slate-800 rounded-lg border border-green-500/30 p-4 text-center">
            <div className="text-2xl mb-1">🏢</div>
            <div className="font-semibold text-green-300 text-xs">ERP</div>
            <div className="text-[10px] text-slate-400">ventas, tesorería, logística</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-lg mb-1">🏦</div>
            <div className="text-xs text-blue-300 font-medium">Banco = Oráculo</div>
            <div className="text-[10px] text-slate-400">Registra SWIFT y LC on-chain</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-lg mb-1">💲</div>
            <div className="text-xs text-green-300 font-medium">Centavos USD</div>
            <div className="text-[10px] text-slate-400">usd(c) = Number(c)/100 → "120.00"</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-lg mb-1">📍</div>
            <div className="text-xs text-purple-300 font-medium">bytes5 → LOCODE</div>
            <div className="text-[10px] text-slate-400">txt(b) = toUtf8String → "NLRTM"</div>
          </div>
        </div>
      </div>

      {/* Event Mappings */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm">Mapeo Evento → Acción ERP (16 eventos)</h3>
        </div>
        <div className="divide-y divide-slate-700/30 max-h-96 overflow-y-auto">
          {eventMappings.map((m) => {
            const c = colorClasses[m.color];
            return (
              <div key={m.event} className={`px-5 py-2.5 ${c.bg} border-l-2 ${c.border}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <code className="text-xs text-cyan-400">{m.event}</code>
                  <span className="text-slate-500 text-xs">→</span>
                  <code className="text-xs text-green-400">{m.erp}</code>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-4">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Code */}
      <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-slate-400 ml-2">middleware/listener.js</span>
        </div>
        <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto">
          <pre className="text-xs leading-relaxed text-slate-300"><code>{middlewareCode}</code></pre>
        </div>
      </div>

      {/* Key Differences */}
      <div className="bg-gradient-to-r from-purple-900/20 to-slate-800/50 rounded-xl border border-purple-500/20 p-5">
        <h3 className="font-semibold text-purple-300 mb-3">🔑 Diferencias con el Middleware CFR</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="space-y-2">
            <p><strong className="text-cyan-300">CFR:</strong> Escrow USDC on-chain. Los pagos se mueven automáticamente.</p>
            <p><strong className="text-cyan-300">CFR:</strong> <code className="text-green-400">usd(x) = formatUnits(x, 6)</code></p>
            <p><strong className="text-cyan-300">CFR:</strong> Un solo destino (Shanghai). Sin catálogo.</p>
          </div>
          <div className="space-y-2">
            <p><strong className="text-purple-300">DAP:</strong> Banco oráculo off-chain. Registra referencias SWIFT/LC.</p>
            <p><strong className="text-purple-300">DAP:</strong> <code className="text-green-400">usd(c) = Number(c)/100</code> (centavos)</p>
            <p><strong className="text-purple-300">DAP:</strong> 8 puertos, bytes5 LOCODE, catálogo dinámico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
