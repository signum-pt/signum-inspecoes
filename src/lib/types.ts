export type UserRole = 'admin' | 'tecnico' | 'escritorio'
export type TipoCampo = 'texto' | 'numero' | 'sim_nao' | 'escolha_multipla' | 'data' | 'foto' | 'observacao' | 'separador'
export type EstadoVisita = 'rascunho' | 'em_curso' | 'concluida' | 'assinada'

export interface Profile {
  id: string
  email: string
  nome: string
  role: UserRole
  ativo: boolean
  created_at: string
}

export interface Entidade {
  id: string
  nome: string
  logo_url?: string
  cor: string
  notas: string
  ativo: boolean
  created_at: string
}

export interface Loja {
  id: string
  entidade_id: string
  entidade?: Entidade
  nome: string
  morada: string
  cidade: string
  codigo_postal: string
  distrito: string | null
  contacto: string
  email_contacto: string
  notas: string
  // Alimentação geral
  cpe: string
  tipo_alimentacao: string
  tensao: string
  potencia_contratada: string
  disjuntor_geral: string
  // Posto de Transformação
  tem_pt: boolean
  pt_kva: string
  pt_tipo: string
  // Grupo Gerador Socorro
  tem_gerador_socorro: boolean
  gerador_socorro_kva: string
  // Grupo Gerador Segurança
  tem_gerador_seguranca: boolean
  gerador_seguranca_kva: string
  // Quadros US
  quadro_us_voltagem: string
  quadro_us_uc: string
  // UPS
  tem_ups: boolean
  ups_kva: string
  // Transformador de isolamento
  tem_trafo_isolamento: boolean
  trafo_isolamento_kva: string
  // Bateria de condensadores
  tem_bateria_condensadores: boolean
  bateria_condensadores_kvar: string
  // PAC
  tem_pac: boolean
  // UPAC
  tem_upac: boolean
  upac_kva: string
  // PCVE
  tem_pcve: boolean
  pcve_kva: string
  ativo: boolean
  created_at: string
}

// Biblioteca global de campos
export interface Campo {
  id: string
  nome: string
  chave: string           // slug único, ex: "resistencia_terra"
  tipo: TipoCampo
  unidade: string         // "Ω", "V", "A", etc.
  descricao: string
  opcoes: string[]        // para escolha_multipla
  sistema: boolean        // campos de sistema não podem ser apagados nem ter a chave alterada
  ativo: boolean
  created_at: string
}

export interface Template {
  id: string
  entidade_id: string
  entidade?: Entidade
  nome: string
  descricao: string
  versao: number
  ativo: boolean
  created_at: string
  updated_at: string
  secoes?: TemplateSecao[]
}

export interface TemplateSecao {
  id: string
  template_id: string
  titulo: string
  ordem: number
  campos?: TemplateCampo[]
}

export interface TemplateCampo {
  id: string
  secao_id: string
  campo_id: string
  campo?: Campo
  obrigatorio: boolean
  ordem: number
  placeholder: string
}

export interface Visita {
  id: string
  loja_id: string
  loja?: Loja
  tecnico_id: string
  tecnico?: Profile
  template_id: string
  template_versao: number
  template?: Template
  data_visita: string
  estado: EstadoVisita
  nome_cliente: string
  observacoes_gerais: string
  assinatura_cliente?: string
  created_at: string
  updated_at: string
  respostas?: VisitaResposta[]
  fotos?: VisitaFoto[]
}

export interface VisitaResposta {
  id: string
  visita_id: string
  campo_id: string
  campo?: Campo
  valor_texto?: string
  valor_numero?: number
  valor_bool?: boolean
  valor_data?: string
  valor_opcoes?: string[]
}

export interface VisitaFoto {
  id: string
  visita_id: string
  campo_id?: string
  url: string
  legenda: string
  ordem: number
}

export interface Agendamento {
  id: string
  loja_id?: string
  loja?: Loja
  tecnico_id?: string
  tecnico?: Profile
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
  created_by: string
  created_at: string
}
