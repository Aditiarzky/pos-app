"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode, createContext, useContext, useState } from "react";

type ConfirmDialogProps = {
    title?: string;
    description?: string | ReactNode;
    cancelText?: string;
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

type ConfirmContextType = {
    openConfirm: (props: ConfirmDialogProps) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<ConfirmDialogProps>({});

    const openConfirm = (newProps: ConfirmDialogProps): Promise<boolean> => {
        setProps({
            title: newProps.title ?? "Konfirmasi",
            description: newProps.description ?? "Apakah Anda yakin ingin melanjutkan?",
            cancelText: newProps.cancelText ?? "Batal",
            confirmText: newProps.confirmText ?? "Ya, Lanjutkan",
            onConfirm: newProps.onConfirm,
            onCancel: newProps.onCancel,
        });
        setOpen(true);

        return new Promise((resolve) => {
            setProps((prev) => ({
                ...prev,
                onConfirm: () => {
                    newProps.onConfirm?.();
                    setOpen(false);
                    resolve(true);
                },
                onCancel: () => {
                    newProps.onCancel?.();
                    setOpen(false);
                    resolve(false);
                },
            }));
        });
    };

    const handleConfirm = () => {
        props.onConfirm?.();
    };

    const handleCancel = () => {
        props.onCancel?.();
    };

    return (
        <ConfirmContext.Provider value={{ openConfirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{props.title}</AlertDialogTitle>
                        <AlertDialogDescription>{props.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {props.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            {props.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within ConfirmProvider");
    }
    return context.openConfirm;
}