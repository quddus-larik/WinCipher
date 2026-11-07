import {FileAddIcon, FileAttachmentIcon} from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from "@hugeicons/react";

type UploadPromptProps = {
    isDraggingFile: boolean;
};

export function UploadPrompt({isDraggingFile}: UploadPromptProps) {
    return (
        <>
            <HugeiconsIcon icon={isDraggingFile ? FileAddIcon : FileAttachmentIcon} className={"size-20"}/>
            <p className={"text-sm text-muted-foreground"}>
                {isDraggingFile ? "Drop it here" : "Drag & Drop your files"}
            </p>
        </>
    );
}
