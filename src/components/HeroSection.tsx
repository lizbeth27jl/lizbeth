export default function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950 to-cyan-900/30" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Solidity ^0.8.20 • OpenZeppelin • Escrow
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
              ExportaciónPotaCFR
            </span>
          </h1>
          
          <p className="mt-4 text-xl sm:text-2xl text-slate-300 font-light">
            Pota Congelada CFR Shanghai
          </p>
          
          <p className="mt-2 text-lg text-slate-400 max-w-3xl mx-auto">
            Contrato inteligente de escrow en USDC con liberación de pagos por hitos para exportación 
            de pota congelada bajo Incoterms® 2020
          </p>

          {/* Key stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Pedido Mínimo', value: '20,000 kg', sub: 'FCL Contenedor' },
              { label: 'Anticipo', value: '30%', sub: 'Cert. Sanitario' },
              { label: 'Saldo', value: '70%', sub: 'B/L a Bordo' },
              { label: 'Temp. Máx', value: '-18°C', sub: 'Cadena Frío' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Route visualization */}
          <div className="mt-10 flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="text-lg">🇵🇪</span>
              <span className="text-amber-300 font-medium">Pesquera del Sur S.A.C.</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>→</span>
              <span className="text-xs">CFR</span>
              <span>→</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-lg">🇨🇳</span>
              <span className="text-red-300 font-medium">Importador Shanghai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
