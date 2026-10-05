import { useState } from 'react';

const sections = [
  {
    id: 'catalog',
    label: 'Catálogo de Puertos',
    code: `enum Continente { America, Europa, Asia }
enum Pais   { ElSalvador, EstadosUnidos, Espana, PaisesBajos, China }
enum Puerto { Acajutla, Miami, NewYork, Barcelona, Valencia, Rotterdam, HongKong, Shanghai }

struct InfoPuerto {
    Pais    pais;
    bytes5  locode;        // codigo UN/LOCODE
    string  nombre;
    uint256 fleteCent;     // flete 40' reefer en centavos de USD
    uint16  transitoDias;  // tiempo de transito maximo estimado
}

mapping(Puerto => InfoPuerto) public infoPuerto;

// En constructor:
infoPuerto[Puerto.Acajutla] = InfoPuerto(Pais.ElSalvador, "SVAQJ", "Acajutla", 280000, 15);
infoPuerto[Puerto.Miami]    = InfoPuerto(Pais.EstadosUnidos, "USMIA", "Miami", 320000, 20);
infoPuerto[Puerto.NewYork]  = InfoPuerto(Pais.EstadosUnidos, "USNYC", "New York", 360000, 25);
infoPuerto[Puerto.Barcelona]= InfoPuerto(Pais.Espana, "ESBCN", "Barcelona", 430000, 38);
infoPuerto[Puerto.Valencia] = InfoPuerto(Pais.Espana, "ESVLC", "Valencia", 420000, 35);
infoPuerto[Puerto.Rotterdam]= InfoPuerto(Pais.PaisesBajos, "NLRTM", "Rotterdam", 410000, 33);
infoPuerto[Puerto.HongKong] = InfoPuerto(Pais.China, "HKHKG", "Hong Kong", 330000, 40);
infoPuerto[Puerto.Shanghai] = InfoPuerto(Pais.China, "CNSHA", "Shanghai", 345000, 45);`
  },
  {
    id: 'destino',
    label: 'Selección de Destino',
    code: `function continenteDe(Pais p) public pure returns (Continente) {
    if (p == Pais.ElSalvador || p == Pais.EstadosUnidos) return Continente.America;
    if (p == Pais.Espana || p == Pais.PaisesBajos)       return Continente.Europa;
    return Continente.Asia;
}

function cotizarDAP(Puerto pu) public view returns (uint256) {
    return precioFOBCent + infoPuerto[pu].fleteCent + seguroCent;
}

/// El importador elige pais y puerto. Puede cambiarlos antes de pagar.
function seleccionarDestino(Pais pais, Puerto puerto)
    external solo(importador) enEstado(Estado.Creado)
{
    require(infoPuerto[puerto].pais == pais, "El puerto no pertenece al pais elegido");
    paisDestino = pais;
    puertoDestino = puerto;
    precioDAP = cotizarDAP(puerto);
    destinoSeleccionado = true;
    InfoPuerto memory ip = infoPuerto[puerto];
    emit DestinoSeleccionado(continenteDe(pais), pais, puerto, ip.locode, precioDAP, ip.transitoDias);
}

function anticipo() public view returns (uint256) { return precioDAP * PORC_ANTICIPO / 100; }
function saldo()    public view returns (uint256) { return precioDAP - anticipo(); }`
  },
  {
    id: 'pagos',
    label: 'Pagos (SWIFT + LC)',
    code: `// HITO 1: Adelanto 30% SWIFT
function registrarAnticipo(bytes32 refSWIFT, uint256 monto)
    external solo(banco) enEstado(Estado.Creado)
{
    require(destinoSeleccionado, "Primero seleccione pais y puerto de destino");
    require(monto == anticipo(), "El adelanto debe ser el 30% del precio DAP");
    estado = Estado.AnticipoRecibido;
    emit AnticipoRecibido(refSWIFT, monto);
}

// HITO 2: Carta de Credito 70%
function confirmarCartaCredito(bytes32 refLC, uint256 monto)
    external solo(banco) enEstado(Estado.AnticipoRecibido)
{
    require(monto == saldo(), "La carta de credito debe cubrir el 70%");
    estado = Estado.CartaCreditoConfirmada;
    emit CartaCreditoConfirmada(refLC, monto);
}

// HITO FINAL: Pago del saldo tras entrega
function registrarPagoSaldo(bytes32 refPago, uint256 monto)
    external solo(banco) enEstado(Estado.EntregadoEnDestino)
{
    require(monto == saldo(), "Monto distinto al saldo autorizado");
    estado = Estado.Liquidado;
    emit PagoSaldoRecibido(refPago, monto);
}`
  },
  {
    id: 'embarque',
    label: 'Embarque & Entrega',
    code: `// Embarque: riesgo AÚN del vendedor en DAP
function registrarEmbarque(bytes32 hBL) external solo(naviera) enEstado(Estado.Certificado) {
    require(documentos["DAM"] != bytes32(0), "Falta la DAM de exportacion");
    require(block.timestamp <= fechaLimiteEmbarque, "Fecha limite de embarque vencida");
    _doc("BL", hBL);
    estado = Estado.Embarcado;
    emit MercanciaEmbarcada(hBL, block.timestamp);
}

// Entrega en destino: riesgo se transfiere AQUI (DAP)
function registrarEntregaEnDestino(Puerto puerto, bytes32 hAvisoLlegada)
    external solo(naviera) enEstado(Estado.Embarcado)
{
    require(puerto == puertoDestino, "No es el puerto DAP seleccionado");
    require(cadenaFrioConforme, "Cadena de frio rota en transito: usar iniciarDisputa");
    _doc("AVISO_LLEGADA", hAvisoLlegada);
    estado = Estado.EntregadoEnDestino;
    emit EntregaEnDestino(paisDestino, puerto, infoPuerto[puerto].locode, block.timestamp);
    emit RiesgoTransferido(block.timestamp);
    emit PagoSaldoAutorizado(saldo());
}`
  },
  {
    id: 'disputa',
    label: 'Disputas & Cancelación',
    code: `function iniciarDisputa(string calldata motivo) external {
    require(msg.sender == exportador || msg.sender == importador, "No autorizado");
    require(estado >= Estado.Certificado && estado <= Estado.EntregadoEnDestino,
        "No disputable");
    estado = Estado.Disputado;
    emit DisputaIniciada(msg.sender, motivo);
}

/// true: autoriza pago. false: cancela.
function resolverDisputa(bool autorizarPago)
    external solo(arbitro) enEstado(Estado.Disputado)
{
    emit DisputaResuelta(autorizarPago);
    if (autorizarPago) {
        estado = Estado.EntregadoEnDestino;
        emit PagoSaldoAutorizado(saldo());
    } else {
        estado = Estado.Cancelado;
        emit ContratoCancelado("Laudo arbitral: pago del saldo denegado");
    }
}

function cancelarPorVencimiento() external solo(importador) {
    require(estado < Estado.Embarcado, "La mercancia ya fue embarcada");
    require(block.timestamp > fechaLimiteEmbarque, "Aun dentro del plazo");
    estado = Estado.Cancelado;
    emit ContratoCancelado("No se embarco dentro del plazo");
}`
  },
  {
    id: 'eventos',
    label: 'Eventos (16)',
    code: `event ContratoCreado(uint256 cantidadKg, uint256 precioFOBCent, uint256 fechaLimiteEmbarque);
event DestinoSeleccionado(Continente continente, Pais pais, Puerto puerto,
                          bytes5 locode, uint256 precioDAP, uint16 transitoDias);
event FleteActualizado(Puerto puerto, uint256 fleteCent);
event AnticipoRecibido(bytes32 referenciaSWIFT, uint256 monto);
event CartaCreditoConfirmada(bytes32 referenciaLC, uint256 monto);
event DocumentoRegistrado(bytes32 indexed tipo, bytes32 hash, address registradoPor);
event TemperaturaReportada(int16 tempCenti, bool conforme);
event MercanciaCertificada(bytes32 hashCertificadoSanitario);
event MercanciaEmbarcada(bytes32 hashBL, uint256 fecha);
event EntregaEnDestino(Pais pais, Puerto puerto, bytes5 locode, uint256 fecha);
event RiesgoTransferido(uint256 fecha);
event PagoSaldoAutorizado(uint256 monto);
event PagoSaldoRecibido(bytes32 referenciaPago, uint256 monto);
event DisputaIniciada(address indexed quien, string motivo);
event DisputaResuelta(bool pagoAutorizado);
event ContratoCancelado(string motivo);`
  },
];

export default function DAPCodeViewer() {
  const [activeSection, setActiveSection] = useState('catalog');
  const current = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>💻</span> Código Fuente DAP
        </h2>
        <p className="text-slate-400 mt-1">
          Contrato ExportacionPotaDAP — secciones clave del código Solidity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Secciones</h3>
            </div>
            <nav className="p-2 space-y-0.5">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    activeSection === s.id
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-slate-400 ml-2">ExportacionPotaDAP.sol</span>
              <span className="text-xs text-slate-500 ml-auto">{current.label}</span>
            </div>
            <div className="p-4 overflow-x-auto max-h-[70vh] overflow-y-auto">
              <pre className="text-sm leading-relaxed text-slate-300"><code>{current.code}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
