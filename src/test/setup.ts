import '@testing-library/jest-dom/vitest'

// jsdom não implementa URL.createObjectURL/revokeObjectURL de verdade,
// e o shim do Vitest não é compatível com o File global do Node usado
// pelo Testing Library. Como os testes só precisam de uma URL
// qualquer para setar em <img src>, um mock simples resolve.
URL.createObjectURL = (() => 'blob:mock-url') as typeof URL.createObjectURL
URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL
