import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CanvasErrorBoundary capturó un error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 border border-destructive/30 bg-destructive/5 rounded-2xl flex flex-col items-center justify-center text-center gap-4 my-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-sm font-black text-foreground">
              Ocurrió un problema al visualizar las páginas
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Uno de los archivos cargados podría tener fuentes o estructuras dañadas que impiden su renderizado visual.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="text-xs font-bold gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar visualización
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
