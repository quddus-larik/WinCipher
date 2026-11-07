import "./App.css";
import {Button} from "@/components/ui/button.tsx";
import {PlusIcon, Settings03Icon} from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from '@hugeicons/react';
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {FileListTable} from "@/components/file-list-table";
import {UploadPrompt} from "@/components/upload-prompt";
import {useFileUpload} from "@/hooks/use-file-upload";


function App() {
    const {
        files,
        isDraggingFile,
        fileInputRef,
        openFilePicker,
        handleFileInputChange,
        dragHandlers,
    } = useFileUpload();

    return (
        <main
            className={`bg-background flex flex-col gap-3 items-center min-h-svh w-full ${files.length > 0 ? "justify-start" : "justify-center"}`}
            {...dragHandlers}
        >
            {files.length > 0 ? (
                <FileListTable files={files}/>
            ) : (
                <UploadPrompt isDraggingFile={isDraggingFile}/>
            )}
            <input ref={fileInputRef} type="file" accept="*/*" multiple className={"hidden"}
                   onChange={handleFileInputChange}/>


            <Tabs defaultSelectedKey="convert" className={"absolute bottom-3 left-1/2 -translate-x-1/2"}>
                <TabsList>
                    <TabsTrigger id="convert">Overview</TabsTrigger>
                    <TabsTrigger id="optimise">Analytics</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button className={"absolute bottom-3 left-3"} variant={"secondary"} size={"icon-sm"}><HugeiconsIcon
                icon={Settings03Icon}/></Button>
            <Button className={"absolute bottom-3 right-3"} variant={"secondary"} size={"icon-sm"}
                    onClick={openFilePicker}><HugeiconsIcon icon={PlusIcon}/></Button>
        </main>
    );
}

export default App;
