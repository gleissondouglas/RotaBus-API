/**
 * Utilitário de logs de interação exclusivo para o ambiente de desenvolvimento local.
 * 
 * Garante que mensagens só sejam impressas no terminal quando __DEV__ for verdadeiro,
 * identificando com clareza o componente, o arquivo e a ação disparada.
 */

export interface UserInteractionLog {
  /** Nome do componente no código (ex: "<PrimaryButton />", "<BackButton />") */
  component: string;
  /** Texto exibido ou identificador do elemento (ex: "Entrar ou criar conta", "Falar destino") */
  label: string;
  /** Arquivo ou tela onde o elemento está localizado (ex: "app/index.tsx", "app/inicio.tsx") */
  fileOrScreen?: string;
  /** O que o clique ou interação faz (ex: "Navegar para /login", "Iniciar captura de voz") */
  action: string;
  /** Informações extras opcionais (ex: parâmetros de navegação, status atual) */
  details?: Record<string, any>;
}

/**
 * Emite um log formatado no terminal quando o usuário clica ou interage com um elemento no app.
 * Só é executado em ambiente de desenvolvimento local (__DEV__).
 */
export function logUserInteraction({
  component,
  label,
  fileOrScreen,
  action,
  details,
}: UserInteractionLog): void {
  if (!__DEV__) {
    return;
  }

  const parts = [
    `[RotaBus:Interação] 🔘 Elemento: ${component}`,
    `Texto: "${label}"`,
  ];

  if (fileOrScreen) {
    parts.push(`Arquivo: ${fileOrScreen}`);
  }

  parts.push(`Ação: ${action}`);

  if (details && Object.keys(details).length > 0) {
    try {
      parts.push(`Detalhes: ${JSON.stringify(details)}`);
    } catch {
      parts.push(`Detalhes: [Obj]`);
    }
  }

  console.log(parts.join(" | "));
}
