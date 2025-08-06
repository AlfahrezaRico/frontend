import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as ShadcnToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <ShadcnToastProvider>
      {toasts.map(({ id, title, description, variant }) => (
        <div key={id} className={`fixed top-4 right-4 z-50 w-96 max-w-full animate-fade-in-up`}>
          <Toast variant={variant || 'default'}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose onClick={() => removeToast(id)} />
          </Toast>
        </div>
      ))}
      <ToastViewport />
    </ShadcnToastProvider>
  );
}
