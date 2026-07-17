import React from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Erro isolado na interface:', error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-white p-8 text-center"><h2 className="font-bold text-slate-800">{this.props.title || 'Não foi possível exibir esta área'}</h2><p className="max-w-md text-sm text-slate-500">O restante do sistema continua disponível. Tente carregar esta área novamente.</p><Button onClick={() => window.location.reload()}>Tentar novamente</Button></div>;
    }
    return this.props.children;
  }
}
