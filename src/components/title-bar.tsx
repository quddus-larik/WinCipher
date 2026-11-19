import {useEffect, useRef, useState} from "react";
import {
    AlertCircleIcon,
    Cancel01Icon,
    MinusSignIcon,
    RefreshIcon,
} from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from "@hugeicons/react";
import {isTauri} from "@tauri-apps/api/core";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {relaunch} from "@tauri-apps/plugin-process";
import {check, type Update} from "@tauri-apps/plugin-updater";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type UpdateDialog = {
    title: string;
    message: string;
    detail: string;
};

function getAppWindow() {
    return isTauri() ? getCurrentWindow() : null;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    return "An unknown error occurred. Please try again later.";
}

export function TitleBar() {
    const [update, setUpdate] = useState<Update | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [dialog, setDialog] = useState<UpdateDialog | null>(null);

    const activeRef = useRef(true);
    const updateHandleRef = useRef<Update | null>(null);

    const closeUpdateHandle = () => {
        const handle = updateHandleRef.current;
        updateHandleRef.current = null;

        if (handle) {
            void handle.close().catch(() => {
            });
        }
    };

    const showError = (title: string, message: string, error: unknown) => {
        setDialog({title, message, detail: getErrorMessage(error)});
    };

    const runUpdateCheck = async () => {
        if (isChecking) return;

        setIsChecking(true);
        setDialog(null);
        setUpdate(null);
        closeUpdateHandle();

        try {
            const availableUpdate = await check();

            if (!activeRef.current) {
                if (availableUpdate) {
                    void availableUpdate.close().catch(() => {
                    });
                }

                return;
            }

            updateHandleRef.current = availableUpdate;
            setUpdate(availableUpdate);
        } catch (error) {
            console.error("Could not check for WinCipher updates.", error);

            if (activeRef.current) {
                showError(
                    "Update check failed",
                    "WinCipher could not check for updates. Check your connection and try again.",
                    error
                );
            }
        } finally {
            if (activeRef.current) {
                setIsChecking(false);
            }
        }
    };

    useEffect(() => {
        activeRef.current = true;
        void runUpdateCheck();

        return () => {
            activeRef.current = false;
            closeUpdateHandle();
        };
    }, []);

    const handleUpdate = async () => {
        if (!update || isUpdating) return;

        setIsUpdating(true);
        setDialog(null);

        try {
            await update.downloadAndInstall();
            await relaunch();
        } catch (error) {
            console.error("Could not install the WinCipher update.", error);
            showError(
                "Update failed",
                `WinCipher could not update to version ${update.version}. Check your connection and try again.`,
                error
            );
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <header
                data-tauri-drag-region
                className={
                    "flex h-8 w-full shrink-0 select-none items-center justify-between gap-1 border-b border-border/60 bg-background px-1 pl-2"
                }
            >
                <p className={"text-xs"}>WinCipher</p>
                <div>
                    {update ? (
                        <Button
                            aria-label={`Update to version ${update.version}`}
                            size={"sm"}
                            isDisabled={isUpdating}
                            onPress={handleUpdate}
                        >
                            {isUpdating ? "Updating…" : "Update now"}
                        </Button>
                    ) : (
                        <Button
                            aria-label={"Check for updates"}
                            size={"sm"}
                            variant={"ghost"}
                            isDisabled={isChecking || isUpdating}
                            onPress={() => void runUpdateCheck()}
                        >
                            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={"size-3.5"}/>
                            {isChecking ? "Checking…" : "Check for updates"}
                        </Button>
                    )}
                    <Button
                        aria-label={"Minimize"}
                        variant={"ghost"}
                        size={"icon-sm"}
                        onPress={() => getAppWindow()?.minimize()}
                    >
                        <HugeiconsIcon icon={MinusSignIcon}/>
                    </Button>
                    <Button
                        aria-label={"Close"}
                        variant={"ghost"}
                        size={"icon-sm"}
                        className={"hover:bg-destructive/10 hover:text-destructive"}
                        onPress={() => getAppWindow()?.close()}
                    >
                        <HugeiconsIcon icon={Cancel01Icon}/>
                    </Button>
                </div>
            </header>

            <Dialog
                isOpen={dialog !== null}
                onOpenChange={(open) => {
                    if (!open) setDialog(null);
                }}
                isDismissable={false}
                showCloseButton={false}
            >
                <DialogHeader>
                    <div className={"flex items-center gap-2 text-destructive"}>
                        <HugeiconsIcon
                            icon={AlertCircleIcon}
                            strokeWidth={2}
                            className={"size-4 shrink-0"}
                        />
                        <DialogTitle>{dialog?.title}</DialogTitle>
                    </div>
                    <DialogDescription>{dialog?.message}</DialogDescription>
                    <DialogDescription className={"break-words text-foreground/80"}>
                        {dialog?.detail}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>Close</DialogClose>
                </DialogFooter>
            </Dialog>
        </>
    );
}
