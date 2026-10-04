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
uint256 public immutable fechaLimiteEmbarque;       // unix timestamp`
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
];

function highlightSolidity(code: string): string {
  return code
    // Comments
    .replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>')
    .replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>')
    // Strings
    .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
    // Keywords
    .replace(/\b(pragma|solidity|import|from|contract|is|using|for|function|external|internal|public|private|view|pure|returns|return|require|emit|event|modifier|mapping|struct|enum|if|else|memory|calldata|storage|immutable|constant)\b/g, '<span class="text-purple-400 font-medium">$1</span>')
    // Types
    .replace(/\b(uint256|int16|address|bool|bytes32|string|Estado)\b/g, '<span class="text-cyan-400">$1</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>')
    // Special values
    .replace(/\b(true|false|msg\.sender|block\.timestamp|address\(this\))\b/g, '<span class="text-rose-400">$1</span>');
}

export default function CodeViewer() {
  const [activeSection, setActiveSection] = useState('header');
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>💻</span> Código Fuente Solidity
        </h2>
        <p className="text-slate-400 mt-1">
          Navega por secciones del contrato inteligente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Secciones</h3>
            </div>
            <nav className="p-2 space-y-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {section.label}
                </button>
              ))}
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
                <span className="text-xs text-slate-400 ml-2">ExportacionPotaCFR.sol</span>
              </div>
              <span className="text-xs text-slate-500">{currentSection.label}</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightSolidity(currentSection.code) }} />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
