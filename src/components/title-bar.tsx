import {Cancel01Icon, MinusSignIcon} from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from "@hugeicons/react";
import {isTauri} from "@tauri-apps/api/core";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {Button} from "@/components/ui/button";

function getAppWindow() {
    return isTauri() ? getCurrentWindow() : null;
}

export function TitleBar() {
    return (
        <header
            data-tauri-drag-region
            className={
                "flex h-8 w-full shrink-0 select-none items-center justify-between gap-1 border-b border-border/60 bg-background px-1 pl-2"
            }
        >
            <p className={"text-xs"}>WinCipher</p>
            <div>
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
    );
}
