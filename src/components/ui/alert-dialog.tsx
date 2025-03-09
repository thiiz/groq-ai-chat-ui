"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlertDialogProps {
  title?: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

interface AlertContextType {
  alert: (props: AlertDialogProps) => void;
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [dialogProps, setDialogProps] = React.useState<AlertDialogProps>({
    message: "",
    title: "Alert",
    confirmText: "OK",
  });

  const alert = React.useCallback((props: AlertDialogProps) => {
    setDialogProps({
      title: props.title || "Alert",
      message: props.message,
      onConfirm: props.onConfirm,
      confirmText: props.confirmText || "OK",
    });
    setOpen(true);
  }, []);

  const handleConfirm = () => {
    if (dialogProps.onConfirm) {
      dialogProps.onConfirm();
    }
    setOpen(false);
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogProps.title}</DialogTitle>
            <DialogDescription>{dialogProps.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleConfirm}>{dialogProps.confirmText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = React.useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}