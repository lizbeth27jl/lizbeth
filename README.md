// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
 
/// @title Exportacion de pota congelada DAP (Incoterms 2020) - Pesquera del Sur S.A.C.
/// @notice Contrato sincronizado con el ERP mejorado. En el estado "Creado" el
///         importador selecciona el pais y el puerto de destino (3 continentes,
///         5 paises, 8 puertos) y el contrato calcula el precio DAP.
///         Pago mixto: 30% adelanto SWIFT + 70% carta de credito confirmada.
///         El banco actua como oraculo: registra los cobros y solo paga el saldo
///         cuando la mercancia se entrega en el puerto seleccionado.
contract ExportacionPotaDAP {
 
    // ================= CATALOGO DE DESTINOS =================
    enum Continente { America, Europa, Asia }
    enum Pais   { ElSalvador, EstadosUnidos, Espana, PaisesBajos, China }
    enum Puerto { Acajutla, Miami, NewYork, Barcelona, Valencia, Rotterdam, HongKong, Shanghai }
 
    struct InfoPuerto {
        Pais    pais;
        bytes5  locode;        // codigo UN/LOCODE (igual al maestro de puertos del ERP)
        string  nombre;
        uint256 fleteCent;     // flete 40' reefer en centavos de USD
        uint16  transitoDias;  // tiempo de transito maximo estimado
    }
 
    mapping(Puerto => InfoPuerto) public infoPuerto;
 
    // ================= ESTADOS =================
    enum Estado {
        Creado, AnticipoRecibido, CartaCreditoConfirmada, Certificado,
        Embarcado, EntregadoEnDestino, Liquidado, Disputado, Cancelado
    }
 
    // ================= ACTORES =================
    address public immutable exportador;         // Pesquera del Sur S.A.C.
    address public immutable importador;         // comprador en el pais de destino
    address public immutable banco;              // banco confirmante (oraculo bancario)
    address public immutable certificador;       // inspector SANIPES
    address public immutable naviera;            // naviera / agente: B/L y entrega
    address public immutable oraculoTemperatura; // sensor IoT del reefer
    address public immutable arbitro;            // centro de arbitraje pactado
 
    // ================= CONDICIONES COMERCIALES =================
    uint256 public constant PEDIDO_MINIMO_KG = 20000;  // un contenedor completo (FCL)
    uint256 public constant PORC_ANTICIPO    = 30;     // adelanto por SWIFT
    int16   public constant TEMP_MAX_CENTI   = -1800;  // -18.00 C
    uint256 public immutable cantidadKg;
    uint256 public immutable precioFOBCent;            // valor FOB Matarani (centavos USD)
    uint256 public immutable seguroCent;               // seguro de carga (a cargo del vendedor en DAP)
    uint256 public immutable fechaLimiteEmbarque;
 
    // ================= DESTINO SELECCIONADO =================
    bool    public destinoSeleccionado;
    Pais    public paisDestino;
    Puerto  public puertoDestino;
    uint256 public precioDAP;                          // FOB + flete + seguro (centavos USD)
 
    // ================= ESTADO DE LA OPERACION =================
    Estado  public estado;
    uint256 public lecturas;
    bool    public cadenaFrioConforme = true;
    mapping(bytes32 => bytes32) public documentos;     // tipo => hash del documento
 
    // ================= EVENTOS (los escucha el middleware del ERP) =================
    event ContratoCreado(uint256 cantidadKg, uint256 precioFOBCent, uint256 fechaLimiteEmbarque);
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
    event ContratoCancelado(string motivo);
 
    modifier solo(address quien) { require(msg.sender == quien, "No autorizado"); _; }
    modifier enEstado(Estado e)  { require(estado == e, "Estado invalido para esta accion"); _; }
 
    constructor(
        address _importador, address _banco, address _certificador, address _naviera,
        address _oraculo, address _arbitro, uint256 _cantidadKg,
        uint256 _precioFOBCent, uint256 _seguroCent, uint256 _fechaLimiteEmbarque
    ) {
        require(_cantidadKg >= PEDIDO_MINIMO_KG, "Pedido menor a un contenedor completo");
        require(_fechaLimiteEmbarque > block.timestamp, "Fecha limite invalida");
 
        exportador = msg.sender;
        importador = _importador;
        banco = _banco;
        certificador = _certificador;
        naviera = _naviera;
        oraculoTemperatura = _oraculo;
        arbitro = _arbitro;
        cantidadKg = _cantidadKg;
        precioFOBCent = _precioFOBCent;
        seguroCent = _seguroCent;
        fechaLimiteEmbarque = _fechaLimiteEmbarque;
 
        // Maestro de puertos (mismos datos que la Tabla 5 del ERP; fletes referenciales)
        infoPuerto[Puerto.Acajutla] = InfoPuerto(Pais.ElSalvador, "SVAQJ", "Acajutla", 280000, 15);
        infoPuerto[Puerto.Miami] = InfoPuerto(Pais.EstadosUnidos, "USMIA", "Miami", 320000, 20);
        infoPuerto[Puerto.NewYork] = InfoPuerto(Pais.EstadosUnidos, "USNYC", "New York", 360000, 25);
        infoPuerto[Puerto.Barcelona] = InfoPuerto(Pais.Espana, "ESBCN", "Barcelona", 430000, 38);
        infoPuerto[Puerto.Valencia] = InfoPuerto(Pais.Espana, "ESVLC", "Valencia", 420000, 35);
        infoPuerto[Puerto.Rotterdam] = InfoPuerto(Pais.PaisesBajos, "NLRTM", "Rotterdam", 410000, 33);
        infoPuerto[Puerto.HongKong] = InfoPuerto(Pais.China, "HKHKG", "Hong Kong", 330000, 40);
        infoPuerto[Puerto.Shanghai] = InfoPuerto(Pais.China, "CNSHA", "Shanghai", 345000, 45);
 
        estado = Estado.Creado;
        emit ContratoCreado(_cantidadKg, _precioFOBCent, _fechaLimiteEmbarque);
    }
 
    // ================= CONSULTAS DEL CATALOGO =================
    function continenteDe(Pais p) public pure returns (Continente) {
        if (p == Pais.ElSalvador || p == Pais.EstadosUnidos) return Continente.America;
        if (p == Pais.Espana || p == Pais.PaisesBajos)       return Continente.Europa;
        return Continente.Asia;
    }
 
    function nombrePais(Pais p) public pure returns (string memory) {
        if (p == Pais.ElSalvador)    return "El Salvador";
        if (p == Pais.EstadosUnidos) return "Estados Unidos";
        if (p == Pais.Espana)        return "Espana";
        if (p == Pais.PaisesBajos)   return "Paises Bajos";
        return "China";
    }
 
    /// Devuelve los puertos disponibles para un pais (para mostrar opciones en el ERP o en Remix).
    function puertosDePais(Pais p) external view returns (Puerto[] memory lista) {
        uint256 n;
        for (uint8 i = 0; i <= uint8(Puerto.Shanghai); i++)
            if (infoPuerto[Puerto(i)].pais == p) n++;
        lista = new Puerto[](n);
        uint256 k;
        for (uint8 i = 0; i <= uint8(Puerto.Shanghai); i++)
            if (infoPuerto[Puerto(i)].pais == p) lista[k++] = Puerto(i);
    }
 
    /// Simula el precio DAP de un puerto antes de elegirlo.
    function cotizarDAP(Puerto pu) public view returns (uint256) {
        return precioFOBCent + infoPuerto[pu].fleteCent + seguroCent;
    }
 
    // ================= ESTADO "CREADO": SELECCION DE DESTINO =================
    /// El importador elige el pais y el puerto de destino. Puede cambiarlos
    /// mientras el contrato siga en "Creado" (antes de pagar el adelanto).
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
 
    /// El ERP (maestro de puertos) actualiza un flete antes de que se elija el destino.
    function actualizarFlete(Puerto puerto, uint256 fleteCent)
        external solo(exportador) enEstado(Estado.Creado)
    {
        require(!destinoSeleccionado || puerto != puertoDestino, "Destino ya cotizado");
        infoPuerto[puerto].fleteCent = fleteCent;
        emit FleteActualizado(puerto, fleteCent);
    }
 
    function anticipo() public view returns (uint256) { return precioDAP * PORC_ANTICIPO / 100; }
    function saldo()    public view returns (uint256) { return precioDAP - anticipo(); }
 
    // ================= HITO 1: ADELANTO 30% (SWIFT) =================
    function registrarAnticipo(bytes32 refSWIFT, uint256 monto)
        external solo(banco) enEstado(Estado.Creado)
    {
        require(destinoSeleccionado, "Primero seleccione pais y puerto de destino");
        require(monto == anticipo(), "El adelanto debe ser el 30% del precio DAP");
        estado = Estado.AnticipoRecibido;
        emit AnticipoRecibido(refSWIFT, monto);
    }
 
    // ================= HITO 2: CARTA DE CREDITO 70% =================
    function confirmarCartaCredito(bytes32 refLC, uint256 monto)
        external solo(banco) enEstado(Estado.AnticipoRecibido)
    {
        require(monto == saldo(), "La carta de credito debe cubrir el 70%");
        estado = Estado.CartaCreditoConfirmada;
        emit CartaCreditoConfirmada(refLC, monto);
    }
 
    /// Factura comercial, packing list, certificado de origen y poliza de seguro.
    function registrarDocumentosComerciales(bytes32 hFactura, bytes32 hPacking,
        bytes32 hOrigen, bytes32 hSeguro)
        external solo(exportador) enEstado(Estado.CartaCreditoConfirmada)
    {
        _doc("FACTURA", hFactura); _doc("PACKING_LIST", hPacking);
        _doc("CERT_ORIGEN", hOrigen); _doc("POLIZA_SEGURO", hSeguro);
    }
 
    /// En DAP la cadena de frio es responsabilidad del vendedor hasta la entrega.
    function reportarTemperatura(int16 tempCenti) external solo(oraculoTemperatura) {
        require(estado >= Estado.CartaCreditoConfirmada && estado <= Estado.Embarcado,
            "Sin carga en curso");
        bool conforme = tempCenti <= TEMP_MAX_CENTI;
        lecturas++;
        if (!conforme) cadenaFrioConforme = false;
        emit TemperaturaReportada(tempCenti, conforme);
    }
 
    // ================= HITO 3: CERTIFICADO SANITARIO =================
    function emitirCertificadoSanitario(bytes32 hCertificado)
        external solo(certificador) enEstado(Estado.CartaCreditoConfirmada)
    {
        require(documentos["FACTURA"] != bytes32(0), "Faltan documentos comerciales");
        require(lecturas > 0 && cadenaFrioConforme, "Cadena de congelado no conforme");
        _doc("CERT_SANITARIO", hCertificado);
        estado = Estado.Certificado;
        emit MercanciaCertificada(hCertificado);
    }
 
    function registrarDAM(bytes32 hDAM) external solo(exportador) enEstado(Estado.Certificado) {
        _doc("DAM", hDAM);
    }
 
    // ================= HITO 4: EMBARQUE (riesgo sigue con el vendedor) =================
    function registrarEmbarque(bytes32 hBL) external solo(naviera) enEstado(Estado.Certificado) {
        require(documentos["DAM"] != bytes32(0), "Falta la DAM de exportacion");
        require(block.timestamp <= fechaLimiteEmbarque, "Fecha limite de embarque vencida");
        _doc("BL", hBL);
        estado = Estado.Embarcado;
        emit MercanciaEmbarcada(hBL, block.timestamp);
    }
 
    // ================= HITO 5 (PENULTIMO): ENTREGA EN PAIS Y PUERTO DE DESTINO =================
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
    }
 
    // ================= HITO 6 (FINAL): PAGO DEL SALDO 70% =================
    function registrarPagoSaldo(bytes32 refPago, uint256 monto)
        external solo(banco) enEstado(Estado.EntregadoEnDestino)
    {
        require(monto == saldo(), "Monto distinto al saldo autorizado");
        estado = Estado.Liquidado;
        emit PagoSaldoRecibido(refPago, monto);
    }
 
    // ================= EXCEPCIONES =================
    function iniciarDisputa(string calldata motivo) external {
        require(msg.sender == exportador || msg.sender == importador, "No autorizado");
        require(estado >= Estado.Certificado && estado <= Estado.EntregadoEnDestino,
            "No disputable");
        estado = Estado.Disputado;
        emit DisputaIniciada(msg.sender, motivo);
    }
 
    /// true: el arbitro autoriza al banco a pagar el saldo. false: se cancela.
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
    }
 
    function _doc(bytes32 tipo, bytes32 hash) private {
        require(hash != bytes32(0), "Hash vacio");
        documentos[tipo] = hash;
        emit DocumentoRegistrado(tipo, hash, msg.sender);
    }
}
// middleware/listener.js - eventos del contrato ExportacionPotaDAP -> API REST del ERP
const { ethers } = require("ethers");
const axios = require("axios");
const abi = require("./ExportacionPotaDAP.abi.json");
 
const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);
const contrato = new ethers.Contract(process.env.CONTRATO, abi, provider);
const erp = axios.create({ baseURL: process.env.ERP_API,
  headers: { Authorization: `Bearer ${process.env.ERP_TOKEN}` } });
const PEDIDO = process.env.PEDIDO_ID;               // pedido de exportacion en el ERP
const usd = (c) => (Number(c) / 100).toFixed(2);    // el contrato guarda centavos
const txt = (b) => ethers.toUtf8String(b);           // bytes5 "NLRTM" -> texto
 
// Catalogo: mismo orden que los enum del contrato
const CONTINENTES = ["America", "Europa", "Asia"];
const PAISES  = ["El Salvador", "Estados Unidos", "Espana", "Paises Bajos", "China"];
const PUERTOS = ["Acajutla", "Miami", "New York", "Barcelona", "Valencia",
                 "Rotterdam", "Hong Kong", "Shanghai"];
 
contrato.on("ContratoCreado", (kg, fob, fechaLimite, ev) =>                       // Ventas
  erp.post("/pedidos-exportacion", { pedido: PEDIDO, kg: Number(kg), precioFOB: usd(fob),
    incoterm: "DAP", fechaLimiteEmbarque: new Date(Number(fechaLimite) * 1000),
    contrato: ev.log.address }));
 
contrato.on("DestinoSeleccionado", (cont, pais, puerto, locode, precio, dias) =>  // Ventas / Logistica
  erp.patch(`/pedidos-exportacion/${PEDIDO}/destino`, {
    continente: CONTINENTES[Number(cont)], pais: PAISES[Number(pais)],
    puerto: PUERTOS[Number(puerto)], locode: txt(locode),
    precioDAP: usd(precio), transitoDias: Number(dias) }));
 
contrato.on("FleteActualizado", (puerto, flete) =>                                // Maestro de puertos
  erp.patch(`/puertos/${PUERTOS[Number(puerto)]}`, { flete: usd(flete) }));
 
contrato.on("AnticipoRecibido", (ref, monto) =>                                   // Tesoreria
  erp.post("/cobros", { pedido: PEDIDO, medio: "SWIFT", porcentaje: 30, monto: usd(monto), ref }));
 
contrato.on("CartaCreditoConfirmada", (ref, monto) =>                             // Tesoreria
  erp.post("/cartas-credito", { pedido: PEDIDO, ref, estado: "Confirmada", monto: usd(monto) }));
 
contrato.on("DocumentoRegistrado", (tipo, hash, por, ev) =>                       // Comercio Exterior
  erp.post(`/expedientes/${PEDIDO}/documentos`, { tipo: ethers.decodeBytes32String(tipo),
    hash, registradoPor: por, tx: ev.log.transactionHash }));
 
contrato.on("TemperaturaReportada", async (t, conforme) => {                       // Trazabilidad
  await erp.post(`/lotes/${PEDIDO}/temperaturas`, { celsius: Number(t) / 100, conforme });
  if (!conforme) await erp.post("/alertas", { pedido: PEDIDO, tipo: "CADENA_FRIO",
    responsable: "EXPORTADOR (DAP)" });
});
 
contrato.on("MercanciaCertificada", (hash) =>                                      // Calidad
  erp.patch(`/lotes/${PEDIDO}`, { certificado: true, hash }));
 
contrato.on("MercanciaEmbarcada", (hashBL, fecha) =>                              // Logistica / Almacen
  erp.patch(`/embarques/${PEDIDO}`, { estado: "Embarcado", hashBL,
    fecha: new Date(Number(fecha) * 1000), kardex: "EN_TRANSITO" }));
 
contrato.on("EntregaEnDestino", (pais, puerto, locode, fecha) =>                  // Logistica
  erp.patch(`/embarques/${PEDIDO}`, { estado: "Entregado", pais: PAISES[Number(pais)],
    puerto: PUERTOS[Number(puerto)], locode: txt(locode),
    fecha: new Date(Number(fecha) * 1000) }));
 
contrato.on("RiesgoTransferido", () =>                                             // Almacen
  erp.patch(`/lotes/${PEDIDO}`, { kardex: "BAJA_DEFINITIVA" }));
 
contrato.on("PagoSaldoAutorizado", (monto) =>                                      // Tesoreria
  erp.post(`/cartas-credito/${PEDIDO}/presentacion`, { monto: usd(monto) }));
 
contrato.on("PagoSaldoRecibido", (ref, monto) =>                                   // Tesoreria / Reportes
  erp.post("/cobros", { pedido: PEDIDO, medio: "CARTA_CREDITO", porcentaje: 70,
    monto: usd(monto), ref, cierre: true }));
 
contrato.on("DisputaIniciada", (quien, motivo) =>                                  // Trazabilidad
  erp.patch(`/lotes/${PEDIDO}`, { congelado: true, motivo }));
 
contrato.on("DisputaResuelta", (autorizado) =>                                     // Reportes
  erp.post("/reportes/laudo", { pedido: PEDIDO, pagoAutorizado: autorizado }));
 
contrato.on("ContratoCancelado", (motivo) =>                                       // Finanzas
  erp.post(`/pedidos-exportacion/${PEDIDO}/cancelacion`, { motivo }));
 
