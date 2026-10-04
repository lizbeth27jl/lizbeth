export default function ContractParams() {
  const params = [
    {
      category: 'Condiciones Comerciales',
      items: [
        { name: 'PEDIDO_MINIMO_KG', value: '20,000 kg', type: 'uint256', desc: 'Un contenedor completo (FCL)' },
        { name: 'PORC_ANTICIPO', value: '30%', type: 'uint256', desc: 'Porcentaje liberado con certificado sanitario' },
        { name: 'TEMP_MAX_CENTI', value: '-1,800 (-18.00°C)', type: 'int16', desc: 'Temperatura máxima en centésimas de grado' },
        { name: 'cantidadKg', value: 'Variable', type: 'uint256 immutable', desc: 'Cantidad negociada en el contrato' },
        { name: 'precioCFR', value: 'Variable (USDC 6 dec)', type: 'uint256 immutable', desc: 'Precio total CFR Shanghai en USDC' },
        { name: 'fechaLimiteEmbarque', value: 'Unix timestamp', type: 'uint256 immutable', desc: 'Fecha máxima para embarque' },
      ],
    },
    {
      category: 'Seguridad',
      items: [
        { name: 'ReentrancyGuard', value: 'OpenZeppelin', type: 'modifier', desc: 'Protección contra reentrancia en pagos' },
        { name: 'SafeERC20', value: 'OpenZeppelin', type: 'library', desc: 'Transferencias seguras de USDC' },
        { name: 'solo(address)', value: 'Custom', type: 'modifier', desc: 'Control de acceso por rol inmutable' },
        { name: 'enEstado(Estado)', value: 'Custom', type: 'modifier', desc: 'Validación de estado para cada acción' },
      ],
    },
  ];

  const events = [
    'ContratoCreado', 'PedidoFinanciado', 'DocumentoRegistrado', 'TemperaturaReportada',
    'MercanciaInspeccionada', 'PagoLiberado', 'RiesgoTransferido', 'MercanciaArribada',
    'RecepcionConfirmada', 'ReclamoTransitoRegistrado', 'DisputaIniciada', 'DisputaResuelta',
    'ContratoCancelado',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Parámetros del Contrato
        </h2>
        <p className="text-slate-400 mt-1">
          Constantes y variables inmutables definidas en el contrato.
        </p>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {params.map((section) => (
          <div key={section.category} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/30">
              <h3 className="font-semibold text-white text-sm">{section.category}</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
              {section.items.map((item) => (
                <div key={item.name} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-cyan-400 text-xs font-mono">{item.name}</code>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{item.type}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <h3 className="font-semibold text-white text-sm">Eventos Emitidos (13 eventos)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Escuchados por el middleware del ERP para sincronización off-chain</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {events.map((event) => (
              <span
                key={event}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50 text-xs text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {event}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dependencies */}
      <div className="bg-gradient-to-r from-purple-900/20 to-slate-800/50 rounded-xl border border-purple-500/20 p-5">
        <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
          <span>📚</span> Dependencias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">IERC20</code>
            <p className="text-xs text-slate-400 mt-1">Interface estándar ERC-20</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">SafeERC20</code>
            <p className="text-xs text-slate-400 mt-1">Transferencias seguras USDC</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-xs text-cyan-400">ReentrancyGuard</code>
            <p className="text-xs text-slate-400 mt-1">Protección anti-reentrancia</p>
          </div>
        </div>
      </div>
    </div>
  );
}
