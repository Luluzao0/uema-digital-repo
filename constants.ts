import { ChatSession, Document, Process, SectorType, User } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Luis Guilherme',
  email: 'luis.lopes@uema.br',
  role: 'Manager',
  sector: SectorType.PROGEP,
  avatarUrl: 'https://picsum.photos/id/1/200/200'
};

export const MOCK_DOCS: Document[] = [
  {
    id: 'd1',
    title: 'Edital de Concurso Docente 01/2025',
    type: 'PDF',
    sector: SectorType.PROGEP,
    createdAt: '2025-10-18',
    status: 'Published',
    tags: ['Concurso', 'Docente', 'Efetivo'],
    summary: 'Documento regulamenta o processo seletivo para 40 vagas de professor efetivo.',
    author: 'Maria Silva',
    size: '2.4 MB'
  },
  {
    id: 'd2',
    title: 'Relatório Financeiro Q3 2025',
    type: 'XLSX',
    sector: SectorType.PROPLAD,
    createdAt: '2025-10-15',
    status: 'Draft',
    tags: ['Financeiro', 'Orçamento', 'Q3'],
    summary: 'Análise preliminar dos gastos e empenhos do terceiro trimestre.',
    author: 'João Souza',
    size: '850 KB'
  },
  {
    id: 'd3',
    title: 'Projeto de Extensão: UEMA Comunidade',
    type: 'DOCX',
    sector: SectorType.PROEXAE,
    createdAt: '2025-10-10',
    status: 'Published',
    tags: ['Extensão', 'Comunidade', 'Bolsas'],
    author: 'Ana Pereira',
    size: '1.2 MB'
  },
  {
    id: 'd4',
    title: 'Ata de Reunião CONSUN',
    type: 'PDF',
    sector: SectorType.PROTOCOLO,
    createdAt: '2025-10-05',
    status: 'Archived',
    tags: ['Conselho', 'Decisões', 'Administrativo'],
    author: 'Secretaria Geral',
    size: '500 KB'
  },
  {
    id: 'd5',
    title: 'Plano de Cargos e Salários',
    type: 'PDF',
    sector: SectorType.PROGEP,
    createdAt: '2025-09-20',
    status: 'Published',
    tags: ['RH', 'Salários', 'Plano'],
    author: 'Carlos Alberto',
    size: '3.1 MB'
  }
];

export const MOCK_PROCESSES: Process[] = [
  {
    id: 'p1',
    number: 'PROC-2025-00128',
    title: 'Aquisição de Equipamentos de TI',
    currentStep: 'Análise Orçamentária',
    status: 'In Progress',
    assignedTo: 'PROPLAD',
    lastUpdate: '2025-10-19',
    priority: 'High'
  },
  {
    id: 'p2',
    number: 'PROC-2025-00145',
    title: 'Progressão Funcional - Dept. História',
    currentStep: 'Validação Documental',
    status: 'Pending',
    assignedTo: 'PROGEP',
    lastUpdate: '2025-10-18',
    priority: 'Medium'
  },
  {
    id: 'p3',
    number: 'PROC-2025-00099',
    title: 'Reformulação PPC Engenharia Civil',
    currentStep: 'Concluído',
    status: 'Approved',
    assignedTo: 'PROG',
    lastUpdate: '2025-10-10',
    priority: 'Low'
  }
];

export const MOCK_CHATS: ChatSession[] = [
  {
    id: 'c1',
    title: 'Análise Edital Concurso',
    lastMessage: 'Quais são os prazos para recurso?',
    updatedAt: '10 min atrás',
    context: ['d1'],
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Faça um resumo dos requisitos para a vaga de Engenharia no Edital 01/2025.',
        timestamp: '10:30'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Com base no **Edital de Concurso Docente 01/2025**, os requisitos para a área de Engenharia são:\n\n1.  Graduação em Engenharia Civil ou áreas afins.\n2.  Mestrado ou Doutorado em Estruturas ou Geotecnia.\n3.  Disponibilidade para 40h semanais.',
        timestamp: '10:30',
        relatedDocs: ['d1']
      },
      {
        id: 'm3',
        role: 'user',
        content: 'Quais são os prazos para recurso?',
        timestamp: '10:32'
      }
    ]
  },
  {
    id: 'c2',
    title: 'Dúvidas Orçamento Q3',
    lastMessage: 'Obrigado pela análise.',
    updatedAt: 'Ontem',
    context: ['d2'],
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Existe alguma inconsistência no Relatório Financeiro do Q3?',
        timestamp: '14:20'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Analisei o **Relatório Financeiro Q3 2025**. Há uma variação de 15% acima do previsto na rubrica de "Material de Consumo" comparado ao Q2. Recomendo verificar os empenhos da PROPLAD.',
        timestamp: '14:21',
        relatedDocs: ['d2']
      },
      {
        id: 'm3',
        role: 'user',
        content: 'Obrigado pela análise.',
        timestamp: '14:25'
      }
    ]
  }
];
