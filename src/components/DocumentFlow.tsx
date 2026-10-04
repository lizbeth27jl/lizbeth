const documents = [
  {
    key: 'FACTURA',
    label: 'Factura Comercial',
    icon: '🧾',
    registeredBy: 'Exportador',
    state: 'Financiado',
    description: 'Factura comercial internacional con términos CFR Shanghai.',
  },
  {
    key: 'PACKING_LIST',
    label: 'Packing List',
    icon: '📦',
    registeredBy: 'Exportador',
    state: 'Financiado',
    description: 'Lista de empaque detallada del contenedor FCL.',
  },
  {
    key: 'CERT_ORIGEN',
    label: 'Certificado de Origen',
    icon: '📜',
    registeredBy: 'Exportador',
    state: 'Financiado',
    description: 'Certificado de origen bajo TLC Perú-China para arancel preferencial.',
  },
  {
    key: 'CERT_SANITARIO',
    label: 'Certificado Sanitario',
    icon: '🔬',
    registeredBy: 'Certificador (SANIPES)',
    state: 'Inspeccionado',
    description: 'Certificado fitosanitario para productos hidrobiológicos. Desbloquea el anticipo 30%.',
    milestone: true,
  },
  {
    key: 'DAM',
    label: 'Declaración Aduanera (DAM)',
    icon: '🏛️',
    registeredBy: 'Exportador',
    state: 'Inspeccionado',
    description: 'DAM numerada ante SUNAT. Requisito para el embarque.',
  },
  {
    key: 'BL',
    label: 'Bill of Lading (B/L)',
    icon: '🚢',
    registeredBy: 'Agente de Carga',
    state: 'A Bordo',
    description: 'B/L limpio "a bordo". Transmite el riesgo CFR y desbloquea el saldo 70%.',
    milestone: true,
  },
];

export default function DocumentFlow() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📄</span> Flujo Documental
        </h2>
        <p className="text-slate-400 mt-1">
          Cada documento se registra como hash on-chain: <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs">mapping(bytes32 =&gt; bytes32) documentos</code>
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-yellow-500 to-cyan-500 hidden md:block" />
        
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={doc.key} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="hidden md:flex flex-shrink-0 w-12 items-start justify-center pt-4">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  doc.milestone 
                    ? 'border-yellow-400 bg-yellow-400/30' 
                    : 'border-slate-500 bg-slate-700'
                }`} />
              </div>
              
              {/* Card */}
              <div className={`flex-1 rounded-xl border p-4 transition-all hover:scale-[1.005] ${
                doc.milestone 
                  ? 'bg-gradient-to-r from-yellow-900/20 to-slate-800/50 border-yellow-500/30' 
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{doc.label}</h3>
                        {doc.milestone && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-300 rounded uppercase">
                            Hito
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                    <span className="text-slate-500">Clave:</span>
                    <code className="text-cyan-400">{doc.key}</code>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                    <span className="text-slate-500">Por:</span>
                    <span>{doc.registeredBy}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                    <span className="text-slate-500">Estado:</span>
                    <span className="text-blue-300">{doc.state}</span>
                  </span>
                  <span className="text-xs text-slate-600">#{index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Registration Code */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <span>💻</span> Registro de Documentos (Solidity)
        </h3>
        <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-900/50 rounded-lg p-4">
{`// Documentos comerciales (3 en 1 transacción)
function registrarDocumentosComerciales(
    bytes32 hFactura, bytes32 hPacking, bytes32 hOrigen
) external solo(exportador) enEstado(Financiado)

// Certificado sanitario → libera anticipo 30%
function emitirCertificadoSanitario(bytes32 hCertificado)
    external solo(certificador) enEstado(Financiado) nonReentrant

// DAM de SUNAT
function registrarDAM(bytes32 hDAM) 
    external solo(exportador) enEstado(Inspeccionado)

// B/L → transmite riesgo CFR + libera saldo 70%
function registrarEmbarque(bytes32 hBL)
    external solo(agenteCarga) enEstado(Inspeccionado) nonReentrant`}
        </pre>
      </div>
    </div>
  );
}
