// lib/institute-theme.ts
export type InstituteCode = 'IAS' | 'ISM' | 'CTB'

export const INSTITUTE_THEMES = {
  IAS: {
    id: 'IAS',
    nombre: 'Instituto de Artes del Sur',
    campus: 'Campus Sur',
    primary: '#E11D48',
    bg: '#FFF1F2',
    badge: 'bg-red-100 text-red-700 border-red-200'
  },
  ISM: {
    id: 'ISM',
    nombre: 'Instituto Superior San Martín',
    campus: 'Sede Central',
    primary: '#2563EB',
    bg: '#EFF6FF',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  CTB: {
    id: 'CTB',
    nombre: 'Colegio Técnico Belgrano',
    campus: 'Sede Única',
    primary: '#0F766E',
    bg: '#CCFBF1',
    badge: 'bg-teal-100 text-teal-700 border-teal-200'
  }
} as const

export const getGradeStyle = (nota: number) => {
  if (nota < 4) return 'text-red-600 bg-red-50'
  if (nota < 7) return 'text-amber-600 bg-amber-50'
  return 'text-emerald-600 bg-emerald-50'
}

export const getEstadoStyle = (estado: string) => {
  if (estado === 'Promocionado') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (estado === 'Regular') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (estado === 'Libre') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-50 text-slate-600'
}

