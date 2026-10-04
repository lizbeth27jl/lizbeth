const actors = [
  {
    role: 'exportador',
    label: 'Exportador',
    entity: 'Pesquera del Sur S.A.C.',
    icon: '🏭',
    color: 'amber',
    description: 'Procesadora y exportadora de pota congelada desde Paita, Perú.',
    permissions: [
      'Registrar documentos comerciales (factura, packing list, cert. origen)',
      'Registrar DAM ante SUNAT',
      'Iniciar disputa (antes del embarque)',
    ],
  },
  {
    role: 'importador',
    label: 'Importador',
    entity: 'Comprador en Shanghai',
    icon: '🏢',
    color: 'red',
    description: 'Comprador chino que recibe la mercancía CFR Shanghai.',
    permissions: [
      'Financiar el contrato (depositar 100% USDC)',
      'Confirmar recepción de mercancía',
      'Registrar reclamos de tránsito',
      'Iniciar disputa (antes del embarque)',
      'Cancelar por vencimiento de plazo',
    ],
  },
  {
    role: 'agenteCarga',
    label: 'Agente de Carga',
    entity: 'Naviera / Agente',
    icon: '🚢',
    color: 'cyan',
    description: 'Responsable del Bill of Lading y registro de arribo.',
    permissions: [
      'Registrar embarque (B/L "a bordo")',
      'Registrar arribo al puerto de destino',
    ],
  },
  {
    role: 'certificador',
    label: 'Certificador',
    entity: 'SANIPES',
    icon: '🔬',
    color: 'yellow',
    description: 'Inspector sanitario que emite el certificado fitosanitario.',
    permissions: [
      'Emitir certificado sanitario (desbloquea anticipo 30%)',
    ],
  },
  {
    role: 'oraculoTemperatura',
    label: 'Oráculo IoT',
    entity: 'Sensor Reefer',
    icon: '🌡️',
    color: 'blue',
    description: 'Sensor de temperatura del contenedor refrigerado (reefer).',
    permissions: [
      'Reportar temperatura del contenedor (en centésimas de °C)',
    ],
  },
  {
    role: 'arbitro',
    label: 'Árbitro',
    entity: 'Centro de Arbitraje',
    icon: '⚖️',
    color: 'purple',
    description: 'Centro de arbitraje pactado en el contrato comercial.',
    permissions: [
      'Resolver disputas (repartir saldo entre exportador e importador)',
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-300', badge: 'bg-amber-500/10 text-amber-400' },
  red: { bg: 'bg-red-500/5', border: 'border-red-500/30', text: 'text-red-300', badge: 'bg-red-500/10 text-red-400' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/30', text: 'text-cyan-300', badge: 'bg-cyan-500/10 text-cyan-400' },
  yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/30', text: 'text-yellow-300', badge: 'bg-yellow-500/10 text-yellow-400' },
  blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/30', text: 'text-blue-300', badge: 'bg-blue-500/10 text-blue-400' },
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-300', badge: 'bg-purple-500/10 text-purple-400' },
};

export default function ActorsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>👥</span> Actores del Contrato
        </h2>
        <p className="text-slate-400 mt-1">
          Seis roles inmutables con permisos diferenciados por modifier <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs">solo(address)</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actors.map((actor) => {
          const colors = colorClasses[actor.color];
          return (
            <div
              key={actor.role}
              className={`rounded-xl border p-5 ${colors.bg} ${colors.border} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{actor.icon}</span>
                <div>
                  <h3 className={`font-semibold ${colors.text}`}>{actor.label}</h3>
                  <p className="text-xs text-slate-400">{actor.entity}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-3">{actor.description}</p>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Permisos:</p>
                {actor.permissions.map((perm, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-500" />
                    <span className="text-xs text-slate-300">{perm}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/30">
                <code className="text-xs text-slate-500">
                  {actor.role}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
