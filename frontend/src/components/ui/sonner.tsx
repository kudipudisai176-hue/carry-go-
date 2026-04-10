import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-white/20 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.12)] group-[.toaster]:rounded-2xl group-[.toaster]:px-6 group-[.toaster]:py-4 group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:rounded-xl group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          error: "group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-50/90",
          success: "group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-50/90",
          info: "group-[.toaster]:border-indigo-500/20 group-[.toaster]:bg-indigo-50/90",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
