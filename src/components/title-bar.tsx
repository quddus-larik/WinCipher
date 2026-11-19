import {useEffect, useState} from "react";
import {
    AlertCircleIcon,
    Cancel01Icon,
    MinusSignIcon,
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
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

    useEffect(() => {
        if (!isTauri()) return;

        let active = true;
        let updateHandle: Update | null = null;

        check()
            .then((availableUpdate) => {
                if (!active) {
                    if (availableUpdate) {
                        void availableUpdate.close().catch(() => {
                        });
                    }

                    return;
                }

                updateHandle = availableUpdate;
                setUpdate(availableUpdate);
            })
            .catch(() => {
                // An unavailable update server should not block app startup.
            });

        return () => {
            active = false;

            if (updateHandle) {
                void updateHandle.close().catch(() => {
                });
            }
        };
    }, []);

    const handleUpdate = async () => {
        if (!update || isUpdating) return;

        setIsUpdating(true);
        setUpdateError(null);
        setIsErrorDialogOpen(false);

        try {
            await update.downloadAndInstall();
            await relaunch();
        } catch (error) {
            console.error("Could not install the WinCipher update.", error);
            setUpdateError(getErrorMessage(error));
            setIsErrorDialogOpen(true);
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
                    ) : null}
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
                isOpen={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
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
                        <DialogTitle>Update failed</DialogTitle>
                    </div>
                    <DialogDescription>
                        WinCipher could not update to version {update?.version}. Check your
                        connection and try again.
                    </DialogDescription>
                    <DialogDescription className={"break-words text-foreground/80"}>
                        {updateError}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>Close</DialogClose>
                </DialogFooter>
            </Dialog>
        </>
    );
}
