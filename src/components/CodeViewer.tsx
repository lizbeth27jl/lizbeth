import { useState } from 'react';

const sections = [
  {
    id: 'header',
    label: 'Header & Imports',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";`
  },
  {
    id: 'state',
    label: 'Estado & Actores',
    code: `enum Estado { Creado, Financiado, Inspeccionado, ABordo, Arribado, Cerrado, Disputado }

// ----- Actores -----
IERC20  public immutable usdc;
address public immutable exportador;        // Pesquera del Sur S.A.C.
address public immutable importador;        // comprador en Shanghai
address public immutable agenteCarga;       // naviera / agente: B/L y arribo
address public immutable certificador;      // inspector sanitario (SANIPES)
address public immutable oraculoTemperatura;// sensor IoT del contenedor reefer
address public immutable arbitro;           // centro de arbitraje pactado`
  },
  {
    id: 'conditions',
    label: 'Condiciones',
    code: `// ----- Condiciones comerciales -----
uint256 public constant PEDIDO_MINIMO_KG = 20000;   // un contenedor completo (FCL)
uint256 public constant PORC_ANTICIPO    = 30;      // hito 1: certificado sanitario
int16   public constant TEMP_MAX_CENTI   = -1800;   // -18.00 C (cadena de congelado)
uint256 public immutable cantidadKg;
uint256 public immutable precioCFR;                 // USDC (6 decimales)
uint256 public immutable fechaLimiteEmbarque;       // unix timestamp

// ----- Estado -----
Estado  public estado;
uint256 public lecturasPreEmbarque;
bool    public tempConformePreEmbarque = true;
uint256 public fechaABordo;
mapping(bytes32 => bytes32) public documentos;      // tipo => hash del documento`
  },
  {
    id: 'events',
    label: 'Eventos',
    code: `// ----- Eventos (los escucha el middleware del ERP) -----
event ContratoCreado(uint256 cantidadKg, uint256 precioCFR, uint256 fechaLimiteEmbarque);
event PedidoFinanciado(uint256 monto);
event DocumentoRegistrado(bytes32 indexed tipo, bytes32 hash, address registradoPor);
event TemperaturaReportada(int16 tempCenti, bool conforme, bool riesgoDelComprador);
event MercanciaInspeccionada(bytes32 hashCertificadoSanitario);
event PagoLiberado(address indexed beneficiario, uint256 monto, string hito);
event RiesgoTransferido(uint256 fecha, bytes32 hashBL);
event MercanciaArribada(uint256 fecha);
event RecepcionConfirmada(uint256 fecha);
event ReclamoTransitoRegistrado(string motivo);
event DisputaIniciada(address indexed quien, string motivo);
event DisputaResuelta(uint256 montoExportador, uint256 montoImportador);
event ContratoCancelado(uint256 montoDevuelto);`
  },
  {
    id: 'constructor',
    label: 'Constructor',
    code: `constructor(
    address _usdc, address _importador, address _agenteCarga, address _certificador,
    address _oraculo, address _arbitro, uint256 _cantidadKg, uint256 _precioCFR,
    uint256 _fechaLimiteEmbarque
) {
    require(_cantidadKg >= PEDIDO_MINIMO_KG, "Pedido menor a un contenedor completo");
    require(_fechaLimiteEmbarque > block.timestamp, "Fecha limite invalida");
    usdc = IERC20(_usdc);
    exportador = msg.sender;
    importador = _importador;
    agenteCarga = _agenteCarga;
    certificador = _certificador;
    oraculoTemperatura = _oraculo;
    arbitro = _arbitro;
    cantidadKg = _cantidadKg;
    precioCFR = _precioCFR;
    fechaLimiteEmbarque = _fechaLimiteEmbarque;
    estado = Estado.Creado;
    emit ContratoCreado(_cantidadKg, _precioCFR, _fechaLimiteEmbarque);
}`
  },
  {
    id: 'financiar',
    label: 'Financiar',
    code: `/// Hito 0: el importador deposita el 100% del precio CFR en el escrow.
function financiar() external solo(importador) enEstado(Estado.Creado) {
    estado = Estado.Financiado;
    usdc.safeTransferFrom(msg.sender, address(this), precioCFR);
    emit PedidoFinanciado(precioCFR);
}`
  },
  {
    id: 'documentos',
    label: 'Documentos',
    code: `/// Factura comercial, packing list y certificado de origen (TLC Peru-China).
function registrarDocumentosComerciales(bytes32 hFactura, bytes32 hPacking, bytes32 hOrigen)
    external solo(exportador) enEstado(Estado.Financiado)
{
    _doc("FACTURA", hFactura);
    _doc("PACKING_LIST", hPacking);
    _doc("CERT_ORIGEN", hOrigen);
}

/// Declaracion Aduanera de Mercancias (DAM) numerada ante SUNAT.
function registrarDAM(bytes32 hDAM) external solo(exportador) enEstado(Estado.Inspeccionado) {
    _doc("DAM", hDAM);
}`
  },
  {
    id: 'temperatura',
    label: 'Temperatura IoT',
    code: `/// El sensor IoT reporta la temperatura del contenedor (en centesimas de C).
function reportarTemperatura(int16 tempCenti) external solo(oraculoTemperatura) {
    require(estado != Estado.Cerrado && estado != Estado.Creado, "Sin carga en curso");
    bool conforme = tempCenti <= TEMP_MAX_CENTI;
    bool riesgoComprador = (estado == Estado.ABordo || estado == Estado.Arribado);
    if (!riesgoComprador) {
        lecturasPreEmbarque++;
        if (!conforme) tempConformePreEmbarque = false;
    }
    emit TemperaturaReportada(tempCenti, conforme, riesgoComprador);
}`
  },
  {
    id: 'hitos',
    label: 'Hitos de Pago',
    code: `/// Hito 1: certificado sanitario emitido -> se libera el anticipo del 30%.
function emitirCertificadoSanitario(bytes32 hCertificado)
    external solo(certificador) enEstado(Estado.Financiado) nonReentrant
{
    require(documentos["FACTURA"] != bytes32(0), "Faltan documentos comerciales");
    require(lecturasPreEmbarque > 0 && tempConformePreEmbarque, "Cadena de congelado no conforme");
    _doc("CERT_SANITARIO", hCertificado);
    estado = Estado.Inspeccionado;
    emit MercanciaInspeccionada(hCertificado);
    _pagar(exportador, precioCFR * PORC_ANTICIPO / 100, "Anticipo 30% - certificado sanitario");
}

/// Hito 2: B/L limpio "a bordo" -> transmision del riesgo CFR y pago del saldo (70%).
function registrarEmbarque(bytes32 hBL)
    external solo(agenteCarga) enEstado(Estado.Inspeccionado) nonReentrant
{
    require(documentos["DAM"] != bytes32(0), "Falta la DAM de exportacion");
    require(tempConformePreEmbarque, "Cadena de congelado no conforme al embarque");
    require(block.timestamp <= fechaLimiteEmbarque, "Fecha limite de embarque vencida");
    _doc("BL", hBL);
    estado = Estado.ABordo;
    fechaABordo = block.timestamp;
    emit RiesgoTransferido(block.timestamp, hBL);
    _pagar(exportador, usdc.balanceOf(address(this)), "Saldo 70% - B/L a bordo");
}`
  },
  {
    id: 'trazabilidad',
    label: 'Trazabilidad',
    code: `/// Hitos de trazabilidad posteriores (no mueven fondos: el riesgo ya es del comprador).
function registrarArribo() external solo(agenteCarga) enEstado(Estado.ABordo) {
    estado = Estado.Arribado;
    emit MercanciaArribada(block.timestamp);
}

function confirmarRecepcion() external solo(importador) enEstado(Estado.Arribado) {
    estado = Estado.Cerrado;
    emit RecepcionConfirmada(block.timestamp);
}

/// Daños en transito: se registran como evidencia para el seguro o la naviera.
function registrarReclamoTransito(string calldata motivo) external solo(importador) {
    require(estado == Estado.ABordo || estado == Estado.Arribado, "Solo despues del embarque");
    emit ReclamoTransitoRegistrado(motivo);
}`
  },
  {
    id: 'disputa',
    label: 'Disputas',
    code: `/// Disputa: solo antes del embarque, mientras el riesgo es del vendedor.
function iniciarDisputa(string calldata motivo) external {
    require(msg.sender == exportador || msg.sender == importador, "No autorizado");
    require(estado == Estado.Financiado || estado == Estado.Inspeccionado, "No disputable");
    estado = Estado.Disputado;
    emit DisputaIniciada(msg.sender, motivo);
}

/// El arbitro reparte el saldo retenido (porcentaje para el exportador, 0-100).
function resolverDisputa(uint256 porcExportador)
    external solo(arbitro) enEstado(Estado.Disputado) nonReentrant
{
    require(porcExportador <= 100, "Porcentaje invalido");
    uint256 saldo = usdc.balanceOf(address(this));
    uint256 aExportador = saldo * porcExportador / 100;
    uint256 aImportador = saldo - aExportador;
    estado = Estado.Cerrado;
    if (aExportador > 0) _pagar(exportador, aExportador, "Laudo arbitral");
    if (aImportador > 0) _pagar(importador, aImportador, "Laudo arbitral - devolucion");
    emit DisputaResuelta(aExportador, aImportador);
}`
  },
  {
    id: 'cancelacion',
    label: 'Cancelación',
    code: `/// Si no se embarca a tiempo, el importador recupera el saldo retenido.
function cancelarPorVencimiento() external solo(importador) nonReentrant {
    require(estado == Estado.Financiado || estado == Estado.Inspeccionado, "No cancelable");
    require(block.timestamp > fechaLimiteEmbarque, "Aun dentro del plazo");
    uint256 saldo = usdc.balanceOf(address(this));
    estado = Estado.Cerrado;
    _pagar(importador, saldo, "Cancelacion por vencimiento");
    emit ContratoCancelado(saldo);
}`
  },
  {
    id: 'helpers',
    label: 'Funciones Internas',
    code: `function _doc(bytes32 tipo, bytes32 hash) private {
    require(hash != bytes32(0), "Hash vacio");
    documentos[tipo] = hash;
    emit DocumentoRegistrado(tipo, hash, msg.sender);
}

function _pagar(address a, uint256 monto, string memory hito) private {
    usdc.safeTransfer(a, monto);
    emit PagoLiberado(a, monto, hito);
}`
  },
  {
    id: 'middleware',
    label: '🔗 Middleware (JS)',
    code: `// middleware/listener.js - escucha eventos y los envia al ERP
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
    tipo: riesgoComprador
      ? "TRANSITO_RIESGO_COMPRADOR"
      : "PRE_EMBARQUE_RIESGO_VENDEDOR"
  });
});

contrato.on("PagoLiberado", (beneficiario, monto, hito, ev) =>
  erp.post("/cobros", {
    pedido: LOTE, beneficiario, monto: usd(monto),
    concepto: hito, tx: ev.log.transactionHash
  }));

contrato.on("RiesgoTransferido", (fecha, hashBL, ev) =>
  erp.patch(\`/pedidos/\${LOTE}/estado\`, {
    estado: "ABordo",
    fechaABordo: new Date(Number(fecha) * 1000), hashBL
  }));

contrato.on("DisputaIniciada", (quien, motivo) =>
  erp.patch(\`/lotes/\${LOTE}\`, { congelado: true, motivo }));`
  },
  {
    id: 'usdc',
    label: '🪙 USDC Simulado',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCSimulado is ERC20 {
    constructor() ERC20("USD Coin (simulado)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address a, uint256 m) external {
        _mint(a, m);
    }
}`
  },
];

function highlightCode(code: string, lang: 'solidity' | 'javascript'): string {
  let result = code;

  // Comments
  result = result.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  if (lang === 'solidity') {
    // Strings
    result = result.replace(/(".*?")/g, '<span class="text-green-400">$1</span>');
    // Keywords
    result = result.replace(/\b(pragma|solidity|import|from|contract|is|using|for|function|external|internal|public|private|view|pure|returns|return|require|emit|event|modifier|mapping|struct|enum|if|else|memory|calldata|storage|immutable|constant|override)\b/g, '<span class="text-purple-400 font-medium">$1</span>');
    // Types
    result = result.replace(/\b(uint256|int16|uint8|address|bool|bytes32|string|Estado)\b/g, '<span class="text-cyan-400">$1</span>');
    // Numbers
    result = result.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');
    // Special
    result = result.replace(/\b(true|false|msg\.sender|block\.timestamp|address\(this\))\b/g, '<span class="text-rose-400">$1</span>');
  } else {
    // JS strings (template literals)
    result = result.replace(/(`[^`]*`)/g, '<span class="text-green-400">$1</span>');
    result = result.replace(/(".*?")/g, '<span class="text-green-400">$1</span>');
    // Keywords
    result = result.replace(/\b(const|let|var|function|async|await|require|return|if|else|new|module|exports)\b/g, '<span class="text-purple-400 font-medium">$1</span>');
    // Numbers
    result = result.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');
    // Special
    result = result.replace(/\b(true|false|null|undefined)\b/g, '<span class="text-rose-400">$1</span>');
  }

  return result;
}

export default function CodeViewer() {
  const [activeSection, setActiveSection] = useState('header');
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];
  const isJS = currentSection.id === 'middleware';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>💻</span> Código Fuente Completo
        </h2>
        <p className="text-slate-400 mt-1">
          Contrato Solidity + Middleware Node.js + USDC Simulado para testing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Secciones</h3>
            </div>
            <nav className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
              {sections.map((section) => {
                const isSpecial = section.id === 'middleware' || section.id === 'usdc';
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      activeSection === section.id
                        ? isSpecial
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Code Display */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-slate-400 ml-2">
                  {currentSection.id === 'middleware' ? 'middleware/listener.js' :
                   currentSection.id === 'usdc' ? 'USDCSimulado.sol' :
                   'ExportacionPotaCFR.sol'}
                </span>
              </div>
              <span className="text-xs text-slate-500">{currentSection.label}</span>
            </div>
            <div className="p-4 overflow-x-auto max-h-[70vh] overflow-y-auto">
              <pre className="text-sm leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(currentSection.code, isJS ? 'javascript' : 'solidity') }} />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
