export default function PaymentMilestones() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>💰</span> Hitos de Pago
        </h2>
        <p className="text-slate-400 mt-1">
          Escrow en USDC (6 decimales) con liberación automática al cumplirse condiciones on-chain.
        </p>
      </div>

      {/* Payment Flow */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {/* Importador deposits */}
          <div className="flex-1 bg-blue-900/20 rounded-lg border border-blue-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏢</span>
              <span className="text-blue-300 font-semibold text-sm">Importador deposita</span>
            </div>
            <div className="text-2xl font-bold text-white">100% USDC</div>
            <div className="text-xs text-slate-400 mt-1">
              <code className="text-cyan-400">financiar()</code> → Estado: Financiado
            </div>
            <div className="mt-3 text-xs text-slate-500">
              safeTransferFrom → Escrow Contract
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="text-slate-500 text-2xl">→</div>
          </div>
          <div className="lg:hidden flex justify-center">
            <div className="text-slate-500 text-2xl rotate-90">→</div>
          </div>

          {/* Escrow */}
          <div className="flex-1 bg-slate-700/30 rounded-lg border border-slate-600/50 p-4 flex flex-col justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold text-white">Escrow</div>
              <div className="text-xs text-slate-400 mt-1">Contrato Inteligente</div>
              <div className="text-xs text-slate-500 mt-2">ReentrancyGuard + SafeERC20</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="text-slate-500 text-2xl">→</div>
          </div>
          <div className="lg:hidden flex justify-center">
            <div className="text-slate-500 text-2xl rotate-90">→</div>
          </div>

          {/* Exportador receives */}
          <div className="flex-1 bg-amber-900/20 rounded-lg border border-amber-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏭</span>
              <span className="text-amber-300 font-semibold text-sm">Exportador recibe</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-lg font-bold text-white">30% <span className="text-sm text-slate-400">anticipo</span></div>
                <div className="text-xs text-slate-400">
                  <code className="text-cyan-400">emitirCertificadoSanitario()</code>
                </div>
              </div>
              <div className="border-t border-slate-700/50 pt-2">
                <div className="text-lg font-bold text-white">70% <span className="text-sm text-slate-400">saldo</span></div>
                <div className="text-xs text-slate-400">
                  <code className="text-cyan-400">registrarEmbarque()</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hito 1 */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-slate-800/50 rounded-xl border border-yellow-500/20 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-xl">
              🔬
            </div>
            <div>
              <h3 className="font-semibold text-yellow-300">Hito 1: Anticipo 30%</h3>
              <p className="text-xs text-slate-400">Certificado Sanitario SANIPES</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>Documentos comerciales registrados</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>Lecturas de temperatura conformes (&gt; 0)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>Temperatura ≤ -18°C en todas las lecturas</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <code className="text-xs text-cyan-400">
              precioCFR * 30 / 100 → exportador
            </code>
          </div>
        </div>

        {/* Hito 2 */}
        <div className="bg-gradient-to-br from-cyan-900/20 to-slate-800/50 rounded-xl border border-cyan-500/20 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-xl">
              🚢
            </div>
            <div>
              <h3 className="font-semibold text-cyan-300">Hito 2: Saldo 70%</h3>
              <p className="text-xs text-slate-400">B/L limpio "a bordo"</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>DAM registrada ante SUNAT</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>Cadena de frío conforme al embarque</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-green-400">✓</span>
              <span>Fecha límite de embarque no vencida</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <code className="text-xs text-cyan-400">
              balanceOf(contract) → exportador
            </code>
          </div>
        </div>
      </div>

      {/* Risk Transfer */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl border border-slate-700/50 p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
          <span>⚡</span> Transmisión del Riesgo (CFR)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-slate-400">
              <strong className="text-white">Antes del B/L:</strong> El riesgo es del exportador. 
              Si la cadena de frío se rompe, el exportador no recibe pago.
            </p>
            <p className="text-slate-400">
              <strong className="text-white">Después del B/L:</strong> El riesgo se transmite al comprador (CFR Incoterms 2020).
              Las lecturas de temperatura en tránsito son informativas (riesgo del comprador).
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2">Lógica de riesgo en <code className="text-cyan-400">reportarTemperatura()</code>:</p>
            <pre className="text-xs text-slate-300 overflow-x-auto">
{`bool riesgoComprador = 
  (estado == ABordo || estado == Arribado);
if (!riesgoComprador) {
  // Afecta conformidad pre-embarque
  lecturasPreEmbarque++;
  if (!conforme) tempConforme = false;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
