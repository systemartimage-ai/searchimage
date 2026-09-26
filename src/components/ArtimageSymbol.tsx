// Símbolo oficial da marca Artimage (baixado de artimage.com.br/images/symbol.svg —
// o mesmo site-fonte do catálogo indexado). fill="currentColor" pra herdar a cor via CSS.
export function ArtimageSymbol({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.1 120" className={className} fill="currentColor">
      <path d="M40.3 80.9L26.9 120H.9l44-120h25.4l42 119.9H86.7l-46.4-39zm7.8-22.3L73 79.5 57.2 31.9l-9.1 26.7z" />
    </svg>
  )
}
