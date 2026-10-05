import { useState } from 'react';

const middlewareCode = `// middleware/listener.js - escucha los eventos del contrato y los envia al ERP
const { ethers } = require("ethers");
const axios = require("axios");
const abi = require("./ExportacionPotaCFR.abi.json");

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);
const contrato = new ethers.Contract(process.env.CONTRATO, abi, provider);
const erp = axios.create({
  baseURL: process.env.ERP_API,
  headers: { Authorization: \`Bearer \${process.env.ERP_TOKEN}\` }
});
const LOTE = process.env.CODIGO_LOTE;
const usd = (x) => ethers.formatUnits(x, 6);

contrato.on("PedidoFinanciado", (monto, ev) =>
  erp.patch(\`/pedidos/\${LOTE}/estado\`, {
    estado: "Financiado", monto: usd(monto),
    tx: ev.log.transactionHash
  }));

contrato.on("DocumentoRegistrado", (tipo, hash, por, ev) =>
  erp.post(\`/lotes/\${LOTE}/documentos\`, {
    tipo: ethers.decodeBytes32String(tipo),
    hash, registradoPor: por, tx: ev.log.transactionHash
  }));

contrato.on("TemperaturaReportada", async (temp, conforme, riesgoComprador, ev) => {
  await erp.post(\`/lotes/\${LOTE}/temperaturas\`, {
    celsius: Number(temp) / 100,
    conforme, riesgoComprador, tx: ev.log.transactionHash
  });
  if (!conforme) await erp.post("/alertas", {
    lote: LOTE,
    tipo: riesgoComprador ? "TRANSITO_RIESGO_COMPRADOR" : "PRE_EMBARQUE_RIESGO_VENDEDOR"
  });
});

contrato.on("PagoLiberado", (beneficiario, monto, hito, ev) =>
  erp.post("/cobros", {
    pedido: LOTE, beneficiario, monto: usd(monto), concepto: hito,
    tx: ev.log.transactionHash
  }));

contrato.on("RiesgoTransferido", (fecha, hashBL, ev) =>
  erp.patch(\`/pedidos/\${LOTE}/estado\`, {
    estado: "ABordo",
    fechaABordo: new Date(Number(fecha) * 1000), hashBL
  }));

contrato.on("DisputaIniciada", (quien, motivo) =>
  erp.patch(\`/lotes/\${LOTE}\`, { congelado: true, motivo }));`;

const usdcSimCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCSimulado is ERC20 {
    constructor() ERC20("USD Coin (simulado)", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address a, uint256 m) external { _mint(a, m); }
}`;

const eventMappings = [
  {
    event: 'ContratoCreado',
    params: ['cantidadKg', 'precioCFR', 'fechaLimiteEmbarque'],
    erpAction: 'POST /pedidos',
    description: 'Crea el pedido en el ERP con los términos comerciales',
    color: 'blue',
  },
  {
    event: 'PedidoFinanciado',
    params: ['monto'],
    erpAction: 'PATCH /pedidos/{lote}/estado',
    description: 'Actualiza estado a "Financiado" y registra el monto USDC',
    color: 'green',
  },
  {
    event: 'DocumentoRegistrado',
    params: ['tipo', 'hash', 'registradoPor'],
    erpAction: 'POST /lotes/{lote}/documentos',
    description: 'Registra hash del documento y quién lo subió',
    color: 'cyan',
  },
  {
    event: 'TemperaturaReportada',
    params: ['tempCenti', 'conforme', 'riesgoDelComprador'],
    erpAction: 'POST /lotes/{lote}/temperaturas + POST /alertas',
    description: 'Registra lectura IoT. Si no conforme → genera alerta',
    color: 'yellow',
  },
  {
    event: 'MercanciaInspeccionada',
    params: ['hashCertificadoSanitario'],
    erpAction: 'PATCH /lotes/{lote} + POST /cobros (30%)',
    description: 'Registra certificación y el asiento del anticipo',
    color: 'amber',
  },
  {
    event: 'PagoLiberado',
    params: ['beneficiario', 'monto', 'hito'],
    erpAction: 'POST /cobros',
    description: 'Genera asiento contable en el ERP',
    color: 'green',
  },
  {
    event: 'RiesgoTransferido',
    params: ['fecha', 'hashBL'],
    erpAction: 'PATCH /pedidos/{lote}/estado',
    description: 'Baja definitiva del kardex (riesgo del comprador)',
    color: 'purple',
  },
  {
    event: 'MercanciaArribada',
    params: ['fecha'],
    erpAction: 'PATCH /pedidos/{lote}/estado',
    description: 'Actualiza estado logístico a "Arribado"',
    color: 'purple',
  },
  {
    event: 'RecepcionConfirmada',
    params: ['fecha'],
    erpAction: 'PATCH /pedidos/{lote}/estado → Cerrado',
    description: 'Cierra el pedido en el ERP',
    color: 'green',
  },
  {
    event: 'ReclamoTransitoRegistrado',
    params: ['motivo'],
    erpAction: 'POST /reclamos',
    description: 'Registra reclamo para gestión de seguros',
    color: 'red',
  },
  {
    event: 'DisputaIniciada',
    params: ['quien', 'motivo'],
    erpAction: 'PATCH /lotes/{lote} → congelado: true',
    description: 'Congela el lote en el ERP hasta resolución',
    color: 'red',
  },
  {
    event: 'DisputaResuelta',
    params: ['montoExportador', 'montoImportador'],
    erpAction: 'POST /cobros (ajuste) + PATCH estado',
    description: 'Ajusta asientos contables según laudo',
    color: 'amber',
  },
  {
    event: 'ContratoCancelado',
    params: ['montoDevuelto'],
    erpAction: 'PATCH /pedidos/{lote}/estado → Cancelado',
    description: 'Cancela pedido y registra devolución',
    color: 'red',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
  green: { bg: 'bg-green-500/5', border: 'border-green-500/20', text: 'text-green-300', dot: 'bg-green-400' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
  red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-300', dot: 'bg-red-400' },
};

export default function MiddlewareERP() {
  const [activeCode, setActiveCode] = useState<'middleware' | 'usdc'>('middleware');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔗</span> Middleware ERP
        </h2>
        <p className="text-slate-400 mt-1">
          Listener que conecta los eventos on-chain con el sistema ERP off-chain vía WebSocket + REST API.
        </p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="font-semibold text-white mb-4 text-sm">Arquitectura de Integración</h3>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Smart Contract */}
          <div className="flex-1 bg-gradient-to-br from-blue-900/30 to-slate-800 rounded-lg border border-blue-500/30 p-4 text-center">
            <div className="text-3xl mb-2">⛓️</div>
            <div className="font-semibold text-blue-300 text-sm">Smart Contract</div>
            <div className="text-xs text-slate-400 mt-1">ExportacionPotaCFR</div>
            <div className="text-xs text-slate-500 mt-1">emite 13 eventos</div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-slate-500 text-xs">WebSocket</div>
            <div className="text-slate-500 text-xl">→</div>
            <div className="text-slate-500 text-xs">ethers.js</div>
          </div>

          {/* Middleware */}
          <div className="flex-1 bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-lg border border-purple-500/30 p-4 text-center">
            <div className="text-3xl mb-2">🔄</div>
            <div className="font-semibold text-purple-300 text-sm">Middleware</div>
            <div className="text-xs text-slate-400 mt-1">listener.js</div>
            <div className="text-xs text-slate-500 mt-1">transforma eventos → API calls</div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-slate-500 text-xs">REST API</div>
            <div className="text-slate-500 text-xl">→</div>
            <div className="text-slate-500 text-xs">axios + Bearer</div>
          </div>

          {/* ERP */}
          <div className="flex-1 bg-gradient-to-br from-green-900/30 to-slate-800 rounded-lg border border-green-500/30 p-4 text-center">
            <div className="text-3xl mb-2">🏢</div>
            <div className="font-semibold text-green-300 text-sm">ERP</div>
            <div className="text-xs text-slate-400 mt-1">Sistema contable</div>
            <div className="text-xs text-slate-500 mt-1">asientos, kardex, alertas</div>
          </div>
        </div>
      </div>

      {/* Event Mappings */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-white text-sm">Mapeo Evento → Acción ERP (13 eventos)</h3>
        </div>
        <div className="divide-y divide-slate-700/30 max-h-96 overflow-y-auto">
          {eventMappings.map((mapping) => {
            const colors = colorClasses[mapping.color];
            return (
              <div key={mapping.event} className={`px-5 py-3 ${colors.bg} border-l-2 ${colors.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <code className="text-xs text-cyan-400 font-mono">{mapping.event}</code>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">→</div>
                  <code className="text-xs text-green-400 font-mono">{mapping.erpAction}</code>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500">Params:</span>
                  {mapping.params.map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{p}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">{mapping.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-slate-400 ml-2">
              {activeCode === 'middleware' ? 'middleware/listener.js' : 'USDCSimulado.sol'}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveCode('middleware')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                activeCode === 'middleware' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              listener.js
            </button>
            <button
              onClick={() => setActiveCode('usdc')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                activeCode === 'usdc' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              USDC.sol
            </button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto">
          <pre className="text-xs leading-relaxed text-slate-300">
            <code>{activeCode === 'middleware' ? middlewareCode : usdcSimCode}</code>
          </pre>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="font-semibold text-white text-sm mb-3">⚙️ Variables de Entorno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'RPC_WSS', desc: 'WebSocket RPC del nodo blockchain' },
            { name: 'CONTRATO', desc: 'Dirección del contrato desplegado' },
            { name: 'ERP_API', desc: 'Base URL de la API del ERP' },
            { name: 'ERP_TOKEN', desc: 'Bearer token de autenticación' },
            { name: 'CODIGO_LOTE', desc: 'Código de lote del pedido en el ERP' },
          ].map(v => (
            <div key={v.name} className="flex items-start gap-2 bg-slate-900/50 rounded-lg p-3">
              <code className="text-xs text-cyan-400 font-mono whitespace-nowrap">{v.name}</code>
              <span className="text-xs text-slate-400">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* USDC Simulado */}
      <div className="bg-gradient-to-r from-green-900/20 to-slate-800/50 rounded-xl border border-green-500/20 p-5">
        <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
          <span>🪙</span> USDC Simulado (Testing)
        </h3>
        <p className="text-sm text-slate-400 mb-3">
          Token ERC-20 con 6 decimales para testing local. Permite mintear USDC sin depender de la red principal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">decimals()</code>
            <p className="text-xs text-slate-400 mt-1">Retorna 6 (igual que USDC real)</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">mint(address, amount)</code>
            <p className="text-xs text-slate-400 mt-1">Crea tokens sin restricción (solo test)</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">ERC20("USD Coin", "USDC")</code>
            <p className="text-xs text-slate-400 mt-1">Compatible con interfaces estándar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
