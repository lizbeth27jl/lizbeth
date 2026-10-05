import { useState } from 'react';

interface PuertoInfo {
  id: number;
  nombre: string;
  pais: string;
  continente: string;
  locode: string;
  fleteUSD: number;
  transitoDias: number;
  emoji: string;
}

const puertos: PuertoInfo[] = [
  { id: 0, nombre: 'Acajutla', pais: 'El Salvador', continente: 'América', locode: 'SVAQJ', fleteUSD: 2800, transitoDias: 15, emoji: '🇸🇻' },
  { id: 1, nombre: 'Miami', pais: 'Estados Unidos', continente: 'América', locode: 'USMIA', fleteUSD: 3200, transitoDias: 20, emoji: '🇺🇸' },
  { id: 2, nombre: 'New York', pais: 'Estados Unidos', continente: 'América', locode: 'USNYC', fleteUSD: 3600, transitoDias: 25, emoji: '🇺🇸' },
  { id: 3, nombre: 'Barcelona', pais: 'España', continente: 'Europa', locode: 'ESBCN', fleteUSD: 4300, transitoDias: 38, emoji: '🇪🇸' },
  { id: 4, nombre: 'Valencia', pais: 'España', continente: 'Europa', locode: 'ESVLC', fleteUSD: 4200, transitoDias: 35, emoji: '🇪🇸' },
  { id: 5, nombre: 'Rotterdam', pais: 'Países Bajos', continente: 'Europa', locode: 'NLRTM', fleteUSD: 4100, transitoDias: 33, emoji: '🇳🇱' },
  { id: 6, nombre: 'Hong Kong', pais: 'China', continente: 'Asia', locode: 'HKHKG', fleteUSD: 3300, transitoDias: 40, emoji: '🇨🇳' },
  { id: 7, nombre: 'Shanghai', pais: 'China', continente: 'Asia', locode: 'CNSHA', fleteUSD: 3450, transitoDias: 45, emoji: '🇨🇳' },
];

const continenteColors: Record<string, string> = {
  'América': 'from-green-900/30 to-slate-800/50 border-green-500/20',
  'Europa': 'from-blue-900/30 to-slate-800/50 border-blue-500/20',
  'Asia': 'from-red-900/30 to-slate-800/50 border-red-500/20',
};

const continenteBadge: Record<string, string> = {
  'América': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Europa': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Asia': 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function DAPPortCatalog() {
  const [selectedPuerto, setSelectedPuerto] = useState<number | null>(null);
  const [precioFOB, setPrecioFOB] = useState(12000); // USD
  const [seguro, setSeguro] = useState(350); // USD
  const [filterCont, setFilterCont] = useState<string>('Todos');

  const filtered = filterCont === 'Todos' ? puertos : puertos.filter(p => p.continente === filterCont);
  const selected = selectedPuerto !== null ? puertos[selectedPuerto] : null;
  const precioDAP = selected ? precioFOB + selected.fleteUSD + seguro : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🌍</span> Catálogo de Destinos DAP
        </h2>
        <p className="text-slate-400 mt-1">
          3 continentes, 5 países, 8 puertos. El importador selecciona el destino y el contrato calcula el precio DAP (FOB + flete + seguro).
        </p>
      </div>

      {/* Pricing Calculator */}
      <div className="bg-gradient-to-r from-purple-900/20 to-slate-800/50 rounded-xl border border-purple-500/20 p-5">
        <h3 className="font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <span>🧮</span> Calculadora de Precio DAP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Precio FOB Matarani (USD)</label>
            <input
              type="number"
              value={precioFOB}
              onChange={e => setPrecioFOB(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Seguro de Carga (USD)</label>
            <input
              type="number"
              value={seguro}
              onChange={e => setSeguro(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">A cargo del vendedor en DAP</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Puerto Destino</label>
            <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm">
              {selected ? (
                <div>
                  <span className="text-white font-medium">{selected.emoji} {selected.nombre}</span>
                  <span className="text-slate-400 text-xs ml-2">Flete: ${selected.fleteUSD.toLocaleString()}</span>
                </div>
              ) : (
                <span className="text-slate-500">Seleccione un puerto abajo ↓</span>
              )}
            </div>
          </div>
        </div>
        {selected && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-400">FOB</div>
                <div className="text-lg font-bold text-white">${precioFOB.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">+ Flete</div>
                <div className="text-lg font-bold text-cyan-300">${selected.fleteUSD.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">+ Seguro</div>
                <div className="text-lg font-bold text-yellow-300">${seguro.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">= Precio DAP</div>
                <div className="text-lg font-bold text-purple-300">${precioDAP.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-center border-t border-slate-700/50 pt-3">
              <div>
                <div className="text-xs text-slate-400">Anticipo 30% (SWIFT)</div>
                <div className="text-sm font-bold text-green-300">${Math.round(precioDAP * 0.3).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Saldo 70% (Carta de Crédito)</div>
                <div className="text-sm font-bold text-blue-300">${Math.round(precioDAP * 0.7).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continent Filter */}
      <div className="flex gap-2 flex-wrap">
        {['Todos', 'América', 'Europa', 'Asia'].map(c => (
          <button
            key={c}
            onClick={() => setFilterCont(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCont === c
                ? 'bg-slate-700 text-white border border-slate-500'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white'
            }`}
          >
            {c === 'América' && '🌎 '}{c === 'Europa' && '🌍 '}{c === 'Asia' && '🌏 '}{c}
          </button>
        ))}
      </div>

      {/* Port Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPuerto(selectedPuerto === p.id ? null : p.id)}
            className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${
              selectedPuerto === p.id
                ? `bg-gradient-to-br ${continenteColors[p.continente]} border-white/30 ring-1 ring-white/10`
                : `bg-gradient-to-br ${continenteColors[p.continente]}`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{p.emoji}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${continenteBadge[p.continente]}`}>
                {p.continente}
              </span>
            </div>
            <h4 className="font-semibold text-white text-sm">{p.nombre}</h4>
            <p className="text-xs text-slate-400">{p.pais}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                <code className="text-cyan-400">{p.locode}</code>
              </span>
              <span className="text-xs text-slate-400">{p.transitoDias}d tránsito</span>
            </div>
            <div className="mt-2 text-sm font-bold text-white">
              Flete: ${p.fleteUSD.toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* Contract Code Reference */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="font-semibold text-white mb-3 text-sm">📝 Datos en el Contrato (constructor)</h3>
        <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-900/50 rounded-lg p-4">
{`// Maestro de puertos (mismos datos que Tabla 5 del ERP)
infoPuerto[Puerto.Acajutla]  = InfoPuerto(Pais.ElSalvador,    "SVAQJ", "Acajutla",   280000, 15);
infoPuerto[Puerto.Miami]     = InfoPuerto(Pais.EstadosUnidos, "USMIA", "Miami",      320000, 20);
infoPuerto[Puerto.NewYork]   = InfoPuerto(Pais.EstadosUnidos, "USNYC", "New York",   360000, 25);
infoPuerto[Puerto.Barcelona] = InfoPuerto(Pais.Espana,        "ESBCN", "Barcelona",  430000, 38);
infoPuerto[Puerto.Valencia]  = InfoPuerto(Pais.Espana,        "ESVLC", "Valencia",   420000, 35);
infoPuerto[Puerto.Rotterdam] = InfoPuerto(Pais.PaisesBajos,   "NLRTM", "Rotterdam",  410000, 33);
infoPuerto[Puerto.HongKong]  = InfoPuerto(Pais.China,         "HKHKG", "Hong Kong",  330000, 40);
infoPuerto[Puerto.Shanghai]  = InfoPuerto(Pais.China,         "CNSHA", "Shanghai",   345000, 45);

// Precio DAP = FOB + flete + seguro
function cotizarDAP(Puerto pu) public view returns (uint256) {
    return precioFOBCent + infoPuerto[pu].fleteCent + seguroCent;
}`}
        </pre>
      </div>
    </div>
  );
}
