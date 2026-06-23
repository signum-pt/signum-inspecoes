import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'
import path from 'path'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'),    fontWeight: 'bold'   },
  ],
})

const R = '#D41317'       // Vermelho Signum
const R_DARK = '#A50E11'  // Vermelho escuro
const GRAY = '#F4F4F4'    // Fundo secção
const BORDER = '#E0E0E0'  // Linhas
const TEXT = '#1A1A1A'    // Texto principal
const MUTED = '#666666'   // Texto secundário

const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    color: TEXT,
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    paddingBottom: 32,
    paddingLeft: 0,
    paddingRight: 0,
  },

  // Barra vermelha esquerda
  barra: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: 14,
    backgroundColor: R,
  },

  corpo: {
    marginLeft: 28,
    marginRight: 24,
  },

  // ─── CABEÇALHO ───────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingBottom: 12,
    paddingLeft: 28,
    paddingRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: R,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerEsq: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 15,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: R,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  headerSubtitulo: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerDir: {
    alignItems: 'flex-end',
    gap: 6,
  },
  logoSignum: {
    width: 130,
    height: 46,
    objectFit: 'contain',
  },
  logosRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  logoCert: {
    width: 34,
    height: 34,
    objectFit: 'contain',
  },

  // ─── FICHA DA INSTALAÇÃO ─────────────────────────────────────
  fichaBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fichaCard: {
    flex: 1,
    backgroundColor: GRAY,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: R,
  },
  fichaLabel: {
    fontSize: 6.5,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fichaValor: {
    fontSize: 9,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: TEXT,
  },

  // Linha CPE / Alimentação / Data
  metaRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  metaCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  metaCellLast: {
    flex: 1,
    padding: 6,
  },
  metaLabel: {
    fontSize: 6.5,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaValor: {
    fontSize: 8.5,
    color: TEXT,
  },

  // ─── SECÇÕES ─────────────────────────────────────────────────
  secao: {
    marginBottom: 10,
  },
  secaoHeader: {
    backgroundColor: R,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
    marginBottom: 1,
  },
  secaoTitulo: {
    fontFamily: 'Roboto', fontWeight: 'bold',
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Tabela de campos
  tabelaCampos: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  campoLinha: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 20,
  },
  campoLinhaAlt: {
    backgroundColor: '#FAFAFA',
  },
  campoLinhaUltima: {
    borderBottomWidth: 0,
  },
  campoNome: {
    flex: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    color: TEXT,
    justifyContent: 'center',
  },
  campoSep: {
    width: 1,
    backgroundColor: BORDER,
  },
  campoResposta: {
    flex: 2,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    justifyContent: 'center',
  },
  respostaConforme: {
    color: '#16a34a',
    fontFamily: 'Roboto', fontWeight: 'bold',
  },
  respostaNaoConforme: {
    color: R,
    fontFamily: 'Roboto', fontWeight: 'bold',
  },
  respostaVazia: {
    color: '#BBBBBB',
  },
  separadorLinha: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  separadorTexto: {
    fontFamily: 'Roboto', fontWeight: 'bold',
    fontSize: 7.5,
    color: '#374151',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ─── OBSERVAÇÕES ─────────────────────────────────────────────
  obsBox: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  obsLabel: {
    fontSize: 7,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  obsTexto: {
    fontSize: 8.5,
    color: TEXT,
    lineHeight: 1.5,
  },

  // ─── ASSINATURA ──────────────────────────────────────────────
  assinaturaSection: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  assinaturaTitulo: {
    fontSize: 7,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  assinaturaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  assinaturaBloco: {
    flex: 1,
    alignItems: 'center',
  },
  assinaturaAreaVazia: {
    height: 60,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    width: '100%',
    marginBottom: 6,
  },
  assinaturaAreaImagem: {
    height: 60,
    width: '100%',
    marginBottom: 6,
  },
  assinaturaImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  assinaturaLinha: {
    borderBottomWidth: 1,
    borderBottomColor: TEXT,
    width: '80%',
    marginBottom: 5,
  },
  assinaturaLabel: {
    fontSize: 7.5,
    color: MUTED,
    textAlign: 'center',
  },
  assinaturaNome: {
    fontSize: 8,
    fontFamily: 'Roboto', fontWeight: 'bold',
    color: TEXT,
    textAlign: 'center',
    marginTop: 2,
  },

  // ─── RODAPÉ ──────────────────────────────────────────────────
  rodape: {
    position: 'absolute',
    bottom: 10,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 4,
  },
  rodapeEsq: {
    fontSize: 6.5,
    color: MUTED,
  },
  rodapeDir: {
    fontSize: 6.5,
    color: MUTED,
  },

  // ─── FOTOS ───────────────────────────────────────────────────
  fotosSecaoHeader: {
    backgroundColor: R,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
    marginBottom: 10,
  },
  fotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fotoCelula: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fotoImg: {
    width: '100%',
    height: 160,
    objectFit: 'contain',
    backgroundColor: '#F4F4F4',
  },
  fotoLegenda: {
    fontSize: 7,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: GRAY,
  },

  // ─── LOGO RODAPÉ (fixo, acima do rodapé, páginas 2+) ────────
  logoRodapeFixed: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoRodape: {
    width: 70,
    height: 24,
    objectFit: 'contain',
  },
  // Logo final pág 1 (centrado no corpo)
  logoFinalWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
})

// ─── INTERFACES ──────────────────────────────────────────────────────────────
interface Resposta {
  campo_id: string
  valor_texto?: string | null
  valor_numero?: number | null
  valor_bool?: boolean | null
  valor_data?: string | null
  valor_opcoes?: string[] | null
}
interface Campo {
  id: string
  nome: string
  chave: string
  tipo: string
  unidade?: string
}
interface TemplateCampo {
  campo_id: string
  obrigatorio: boolean
  negrito: boolean
  ordem: number
  campos: Campo
}
interface Secao {
  id: string
  titulo: string
  ordem: number
  template_campos: TemplateCampo[]
}
interface Foto { url: string; base64?: string; legenda?: string }
interface Logos {
  signum: string
  iso14001: string
  iso9001: string
  pmeExcelencia: string
  pmeLider: string
}
interface Configuracoes {
  empresa_nome: string
  empresa_morada: string
  empresa_telefone: string
  empresa_email: string
  empresa_website: string
}

interface VisitaDados {
  loja: { nome: string; cpe?: string; alimentacao?: string }
  entidade: { nome: string }
  tecnico: { nome: string }
  data_visita: string
  nome_cliente?: string
  observacoes_gerais?: string
  assinatura_cliente?: string
  numero_processo?: string
  template_referencia?: string
}
interface Props {
  visita: VisitaDados
  secoes: Secao[]
  respostas: Resposta[]
  fotos: Foto[]
  logos: Logos
  config: Configuracoes
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatarResposta(campo: Campo, respostas: Resposta[]) {
  const r = respostas.find(r => r.campo_id === campo.id)
  if (!r) return { texto: '', tipo: 'vazia' as const }

  if (campo.tipo === 'sim_nao') {
    const isSimNao = campo.chave?.startsWith('tem_') || campo.chave?.startsWith('possui_')
    if (r.valor_bool === true)  return { texto: isSimNao ? 'Sim' : '✓  Conforme', tipo: 'conforme' as const }
    if (r.valor_bool === false) return { texto: isSimNao ? 'Não' : '✗  Não conforme', tipo: 'naoconforme' as const }
    return { texto: '', tipo: 'vazia' as const }
  }
  if (campo.tipo === 'numero') {
    if (r.valor_numero != null) return { texto: `${r.valor_numero}${campo.unidade ? ' ' + campo.unidade : ''}`, tipo: 'normal' as const }
    return { texto: '', tipo: 'vazia' as const }
  }
  if (campo.tipo === 'escolha_multipla') {
    const v = r.valor_opcoes
    const texto = Array.isArray(v) ? v.join(', ') : (typeof v === 'string' ? v : '')
    return { texto, tipo: 'normal' as const }
  }
  if (campo.tipo === 'data') return { texto: r.valor_data ? new Date(r.valor_data + 'T00:00:00').toLocaleDateString('pt-PT') : '', tipo: 'normal' as const }
  const txt = r.valor_texto ?? ''
  return { texto: txt, tipo: txt ? 'normal' as const : 'vazia' as const }
}

// ─── COMPONENTES ─────────────────────────────────────────────────────────────
function Cabecalho({ logos, pagina1 }: { logos: Logos; pagina1?: boolean }) {
  return (
    <View style={s.header} fixed>
      {pagina1 ? (
        <View style={s.headerEsq}>
          <Text style={s.headerTitulo}>Verificação Técnica{'\n'}de Instalações Elétricas</Text>
          <Text style={s.headerSubtitulo}>Relatório de inspeção elétrica</Text>
        </View>
      ) : (
        <View style={s.headerEsq} />
      )}
      <View style={s.headerDir}>
        {pagina1 && logos.signum ? <Image style={s.logoSignum} src={logos.signum} /> : <View />}
        <View style={s.logosRow}>
          {logos.iso14001      ? <Image style={s.logoCert} src={logos.iso14001} /> : <View />}
          {logos.iso9001       ? <Image style={s.logoCert} src={logos.iso9001} /> : <View />}
          {logos.pmeExcelencia ? <Image style={s.logoCert} src={logos.pmeExcelencia} /> : <View />}
          {logos.pmeLider      ? <Image style={s.logoCert} src={logos.pmeLider} /> : <View />}
        </View>
      </View>
    </View>
  )
}

function Rodape({ referencia, config }: { referencia: string; config: Configuracoes }) {
  const info = [
    config.empresa_morada,
    config.empresa_telefone ? `T: ${config.empresa_telefone}` : '',
    config.empresa_email,
    config.empresa_website,
  ].filter(Boolean).join('  ·  ')

  return (
    <View style={s.rodape} fixed>
      <Text style={s.rodapeEsq}>{referencia ? `${referencia}  ·  ` : ''}{info}</Text>
      <Text style={s.rodapeDir} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )
}

function SecaoView({ secao, respostas, secaoNum }: { secao: Secao; respostas: Resposta[]; secaoNum: number }) {
  const campos = [...(secao.template_campos ?? [])]
    .filter(tc => tc.campos != null)
    .sort((a, b) => a.ordem - b.ordem)

  if (campos.length === 0) return <View />

  // Contador só para campos que têm valor (não separadores)
  let campoNum = 0

  // Conta total de linhas para saber qual é a última que tem bordo
  const totalLinhas = campos.length
  // Alternância ignora separadores
  let altIndex = 0

  // Separar primeiro campo do resto para agrupar com o cabeçalho (evitar header orfão)
  const primeiroCampo = campos[0]
  const restoCampos = campos.slice(1)

  function renderLinha(tc: TemplateCampo, i: number, indexGlobal: number) {
    const isSeparador = tc.campos?.tipo === 'separador'
    const isUltimo = indexGlobal === totalLinhas - 1

    if (isSeparador) {
      return (
        <View key={tc.campo_id} wrap={false} style={[s.separadorLinha, isUltimo ? s.campoLinhaUltima : {}]}>
          <Text style={s.separadorTexto}>{tc.campos?.nome ?? ''}</Text>
        </View>
      )
    }

    campoNum++
    const isAlt = altIndex % 2 === 1
    altIndex++
    const { texto, tipo } = formatarResposta(tc.campos, respostas)

    return (
      <View key={tc.campo_id} wrap={false} style={[
        s.campoLinha,
        isAlt ? s.campoLinhaAlt : {},
        isUltimo ? s.campoLinhaUltima : {},
      ]}>
        <View style={s.campoNome}>
          <Text>
            <Text style={{ color: '#9CA3AF' }}>{secaoNum}.{campoNum}  </Text>
            <Text style={tc.negrito ? { fontFamily: 'Helvetica-Bold' } : {}}>{tc.campos?.nome ?? ''}</Text>
          </Text>
        </View>
        <View style={s.campoSep} />
        <View style={s.campoResposta}>
          <Text style={
            tipo === 'conforme' ? s.respostaConforme :
            tipo === 'naoconforme' ? s.respostaNaoConforme :
            tipo === 'vazia' ? s.respostaVazia : {}
          }>
            {texto || '—'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.secao}>
      {/* Cabeçalho + primeira linha juntos para evitar cabeçalho orfão */}
      <View wrap={false}>
        <View style={s.secaoHeader}>
          <Text style={s.secaoTitulo}>{secaoNum}.  {secao.titulo}</Text>
        </View>
        {primeiroCampo && (
          <View style={[s.tabelaCampos, restoCampos.length > 0 ? { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}]}>
            {renderLinha(primeiroCampo, 0, 0)}
          </View>
        )}
      </View>
      {/* Restantes linhas — cada uma pode quebrar para a página seguinte */}
      {restoCampos.length > 0 && (
        <View style={[s.tabelaCampos, { borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          {restoCampos.map((tc, i) => renderLinha(tc, i + 1, i + 1))}
        </View>
      )}
    </View>
  )
}

// ─── DOCUMENTO PRINCIPAL ─────────────────────────────────────────────────────
export default function RelatorioPDF({ visita, secoes, respostas, fotos, logos, config }: Props) {
  const secoesOrdenadas = [...secoes].sort((a, b) => a.ordem - b.ordem)
  const dataFormatada = visita.data_visita
    ? new Date(visita.data_visita + 'T00:00:00').toLocaleDateString('pt-PT')
    : ''

  return (
    <Document title={`Relatório - ${visita.loja.nome} - ${dataFormatada}`} author="Signum">
      <Page size="A4" style={s.page}>
        <View style={s.barra} fixed />
        <Cabecalho logos={logos} pagina1 />

        <View style={s.corpo}>
          {/* Ficha da instalação */}
          <View style={s.fichaBox}>
            <View style={s.fichaCard}>
              <Text style={s.fichaLabel}>Instalação</Text>
              <Text style={s.fichaValor}>{visita.loja.nome}</Text>
            </View>
            <View style={s.fichaCard}>
              <Text style={s.fichaLabel}>Requerente / Entidade</Text>
              <Text style={s.fichaValor}>{visita.entidade.nome}</Text>
            </View>
            <View style={s.fichaCard}>
              <Text style={s.fichaLabel}>Técnico responsável</Text>
              <Text style={s.fichaValor}>{visita.tecnico.nome}</Text>
            </View>
          </View>

          {/* CPE / Alimentação / Data / Nº Processo */}
          <View style={s.metaRow}>
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>CPE</Text>
              <Text style={s.metaValor}>{visita.loja.cpe || '—'}</Text>
            </View>
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Alimentação</Text>
              <Text style={s.metaValor}>{visita.loja.alimentacao || '—'}</Text>
            </View>
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Data da visita</Text>
              <Text style={s.metaValor}>{dataFormatada}</Text>
            </View>
            <View style={s.metaCellLast}>
              <Text style={s.metaLabel}>Nº Processo</Text>
              <Text style={s.metaValor}>{visita.numero_processo || '—'}</Text>
            </View>
          </View>

          {/* Secções */}
          {secoesOrdenadas.map((secao, i) => (
            <SecaoView key={secao.id} secao={secao} respostas={respostas} secaoNum={i + 1} />
          ))}

          {/* Observações gerais */}
          {visita.observacoes_gerais ? (
            <View style={s.obsBox}>
              <Text style={s.obsLabel}>Observações gerais</Text>
              <Text style={s.obsTexto}>{visita.observacoes_gerais}</Text>
            </View>
          ) : <View />}

          {/* Assinatura */}
          <View style={s.assinaturaSection} wrap={false}>
            <Text style={s.assinaturaTitulo}>Assinaturas</Text>
            <View style={s.assinaturaRow}>
              {/* Técnico */}
              <View style={s.assinaturaBloco}>
                <View style={s.assinaturaAreaVazia} />
                <View style={s.assinaturaLinha} />
                <Text style={s.assinaturaLabel}>Técnico</Text>
                <Text style={s.assinaturaNome}>{visita.tecnico.nome}</Text>
              </View>
              {/* Cliente */}
              <View style={s.assinaturaBloco}>
                {visita.assinatura_cliente ? (
                  <View style={s.assinaturaAreaImagem}>
                    <Image style={s.assinaturaImg} src={visita.assinatura_cliente} />
                  </View>
                ) : (
                  <View style={s.assinaturaAreaVazia} />
                )}
                <View style={s.assinaturaLinha} />
                <Text style={s.assinaturaLabel}>Requerente / Entidade</Text>
                {visita.nome_cliente ? <Text style={s.assinaturaNome}>{visita.nome_cliente}</Text> : <View />}
              </View>
            </View>
          </View>

        </View>

        {/* Logo Signum — posicionado no fundo da pág 1, fora do fluxo */}
        {logos.signum ? (
          <View style={s.logoRodapeFixed}>
            <Image style={s.logoRodape} src={logos.signum} />
          </View>
        ) : <View />}

        <Rodape referencia={visita.template_referencia ?? ''} config={config} />
      </Page>

      {/* Página de fotos — só se existirem */}
      {fotos.length > 0 && (
        <Page size="A4" style={s.page}>
          <View style={s.barra} fixed />
          <Cabecalho logos={logos} />

          <View style={s.corpo}>
            <View style={s.fotosSecaoHeader}>
              <Text style={s.secaoTitulo}>Registo fotográfico</Text>
            </View>
            <View style={s.fotoGrid}>
              {fotos.map((foto, i) => (
                <View key={i} style={s.fotoCelula}>
                  {foto.base64
                    ? <Image style={s.fotoImg} src={foto.base64} />
                    : <View style={[s.fotoImg, { backgroundColor: '#f0f0f0' }]} />
                  }
                  {foto.legenda ? <Text style={s.fotoLegenda}>{foto.legenda}</Text> : <View />}
                </View>
              ))}
            </View>
          </View>

          {/* Logo Signum — fixo acima do rodapé nas páginas 2+ */}
          {logos.signum ? (
            <View style={s.logoRodapeFixed}>
              <Image style={s.logoRodape} src={logos.signum} />
            </View>
          ) : <View />}

          <Rodape referencia={visita.template_referencia ?? ''} config={config} />
        </Page>
      )}
    </Document>
  )
}
