interface ScanOverlayProps {
  label: string
}

const SCAN_COLOR = '#22c55e' // verde — só deste overlay, não muda a cor principal do app

/**
 * Overlay animado exibido em cima da própria foto anexada enquanto a
 * busca roda — antes disso o único feedback era um spinner discreto
 * embaixo da tela, fácil de não perceber (a imagem ficava parada,
 * parecia que nada estava acontecendo). Aqui a foto continua visível
 * (levemente escurecida), um anel giratório central comunica
 * "carregando", uma linha de scan varre de cima a baixo e os cantos de
 * mira pulsam — reforça "a IA está analisando esta imagem agora".
 */
export function ScanOverlay({ label }: ScanOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-background/35" />

      {/* Anel giratório central, tipo "carregando" */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-16 w-16">
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${SCAN_COLOR}33` }}
          />
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: SCAN_COLOR, animationDuration: '1s' }}
          />
        </div>
      </div>

      {/* Linha de scan varrendo verticalmente */}
      <div
        className="absolute inset-x-0 h-1 animate-scan-sweep"
        style={{
          background: `linear-gradient(to right, transparent, ${SCAN_COLOR} 20%, ${SCAN_COLOR} 80%, transparent)`,
          boxShadow: `0 0 12px 2px ${SCAN_COLOR}cc`,
        }}
      />

      {/* Cantos de mira, tipo scanner/reconhecimento */}
      {(['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'] as const).map(
        (pos) => (
          <div
            key={pos}
            className={`absolute h-6 w-6 animate-scan-pulse ${pos} m-3`}
            style={{ borderColor: SCAN_COLOR }}
          />
        ),
      )}

      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <span
          className="animate-scan-pulse rounded-full bg-background/80 px-3 py-1 text-xs font-medium shadow-sm"
          style={{ color: SCAN_COLOR }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
