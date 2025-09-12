import { toast } from 'sonner';

export function showUsageLimitToast(options: { message: string; description: string }) {
  toast.error(options.message, {
    description: options.description,
    duration: 5000,
    className: 'bg-[#1a1a1a] border border-[#333] text-white',
  });
}

export function showGenericError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 3000,
    className: 'bg-[#1a1a1a] border border-[#333] text-white',
  });
}
