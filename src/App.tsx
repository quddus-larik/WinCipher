import "./App.css";
import {Button} from "@/components/ui/button.tsx";
import {PlusIcon, Settings03Icon} from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from '@hugeicons/react';
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {FileListTable} from "@/components/file-list-table";
import {UploadPrompt} from "@/components/upload-prompt";
import {TitleBar} from "@/components/title-bar";
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
        <div className={"flex h-svh w-full flex-col overflow-hidden bg-background"}>
            <TitleBar/>
            <main
                className={`flex min-h-0 flex-1 flex-col gap-3 items-center w-full overflow-y-auto ${files.length > 0 ? "justify-start" : "justify-center"}`}
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
                        <TabsTrigger id="convert">Convert</TabsTrigger>
                        <TabsTrigger id="optimise">Optimize</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button className={"absolute bottom-3 left-3"} variant={"secondary"} size={"icon"}><HugeiconsIcon
                    icon={Settings03Icon}/></Button>
                <Button className={"absolute bottom-3 right-3"} variant={"secondary"} size={"icon"}
                        onClick={openFilePicker}><HugeiconsIcon icon={PlusIcon}/></Button>
            </main>
        </div>
    );
}

export default App;
