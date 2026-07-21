export type AppSectionKey =
  | 'dashboard'
  | 'compliance'
  | 'evaluations'
  | 'development'
  | 'applause'
  | 'people'
  | 'users';

export interface NavigationSection {
  key: AppSectionKey;
  label: string;
  shortLabel: string;
  group: 'workspace' | 'registry';
  groupLabel: string;
  description: string;
  roles: readonly string[];
}

export const navigationGroups = [
  { key: 'workspace', label: 'Workspace' },
  { key: 'registry', label: 'Cadastro' },
] as const;

export const navigationSections: readonly NavigationSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'DA',
    group: 'workspace',
    groupLabel: 'Workspace',
    description: 'Resumo, indicadores e leitura executiva.',
    roles: ['admin', 'hr', 'manager'],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    shortLabel: 'CO',
    group: 'workspace',
    groupLabel: 'Workspace',
    description: 'Canal, fila de tratamento e status dos casos.',
    roles: ['admin', 'hr', 'manager', 'employee', 'compliance'],
  },
  {
    key: 'evaluations',
    label: 'Avaliacoes',
    shortLabel: 'AV',
    group: 'workspace',
    groupLabel: 'Workspace',
    description: 'Fluxos separados por origem do feedback.',
    roles: ['admin', 'hr', 'manager', 'employee'],
  },
  {
    key: 'development',
    label: 'Desenvolvimento',
    shortLabel: 'DE',
    group: 'workspace',
    groupLabel: 'Workspace',
    description: 'Formacao, trilhas e evolucao individual.',
    roles: ['admin', 'hr', 'manager', 'employee'],
  },
  {
    key: 'applause',
    label: 'Aplause',
    shortLabel: 'AP',
    group: 'workspace',
    groupLabel: 'Workspace',
    description: 'Reconhecimento entre pares e cultura positiva.',
    roles: ['admin', 'hr', 'manager', 'employee'],
  },
  {
    key: 'people',
    label: 'Pessoas',
    shortLabel: 'PE',
    group: 'registry',
    groupLabel: 'Cadastro',
    description: 'Estrutura da organizacao e cadastro base.',
    roles: ['admin', 'hr', 'manager'],
  },
  {
    key: 'users',
    label: 'Usuarios',
    shortLabel: 'US',
    group: 'registry',
    groupLabel: 'Cadastro',
    description: 'Acessos, perfis e administracao do ambiente.',
    roles: ['admin', 'hr', 'manager'],
  },
];

export function getNavigationSection(key: string | null): NavigationSection | undefined {
  return navigationSections.find((section) => section.key === key);
}

export function visibleNavigationGroups(roleKey: string | null) {
  return navigationGroups
    .map((group) => ({
      ...group,
      sections: navigationSections.filter(
        (section) => section.group === group.key && section.roles.includes(roleKey ?? ''),
      ),
    }))
    .filter((group) => group.sections.length > 0);
}
