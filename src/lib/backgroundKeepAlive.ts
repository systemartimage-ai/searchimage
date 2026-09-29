/**
 * Mantém a aba "viva" pro navegador durante processamento pesado em
 * segundo plano (upload em massa, indexação de pasta local) — achado
 * real: trocar de aba fazia o navegador congelar/atrasar tanto a thread
 * principal quanto o Worker de embedding, travando o processamento até o
 * usuário voltar manualmente. Não existe API de plataforma que force uma
 * aba em segundo plano a processar em velocidade normal — é economia de
 * bateria/CPU deliberada do navegador — mas abas que estão reproduzindo
 * áudio de verdade recebem MUITO menos desaceleração (o navegador evita
 * cortar áudio no meio, isso afetaria o usuário). Toca um tom constante
 * a 20Hz (abaixo do que a maioria das pessoas ouve) com ganho
 * praticamente zero (tecnicamente audível, imperceptível na prática) —
 * contorno conhecido, usado por vários apps web, não é uma garantia
 * formal da plataforma.
 *
 * Contador de referência: várias operações (ex. indexar duas pastas ao
 * mesmo tempo) podem pedir "mantenha vivo" simultaneamente — só para de
 * verdade quando todas tiverem terminado.
 */
let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null
let refCount = 0

export function startBackgroundKeepAlive(): void {
  refCount++
  if (audioContext) return

  try {
    audioContext = new AudioContext()
    gainNode = audioContext.createGain()
    gainNode.gain.value = 0.0001
    oscillator = audioContext.createOscillator()
    oscillator.frequency.value = 20
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start()
  } catch {
    // Navegador sem suporte a Web Audio, ou política de autoplay bloqueou
    // (precisa de gesto do usuário) — degrada pro comportamento normal
    // (sem o contorno), não pode quebrar o fluxo de upload/indexação.
    audioContext = null
    oscillator = null
    gainNode = null
  }
}

export function stopBackgroundKeepAlive(): void {
  refCount = Math.max(0, refCount - 1)
  if (refCount > 0) return

  oscillator?.stop()
  oscillator?.disconnect()
  gainNode?.disconnect()
  audioContext?.close()
  audioContext = null
  oscillator = null
  gainNode = null
}
