import {useState} from "react";
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
    const [isWorking, setIsWorking] = useState(false);
    const {
        files,
        isDraggingFile,
        fileInputRef,
        openFilePicker,
        removeFile,
        handleFileInputChange,
        dragHandlers,
    } = useFileUpload(isWorking);

    return (
        <div className={"flex h-svh w-full flex-col overflow-hidden bg-background"} onContextMenu={(e) => e.preventDefault()}>
            <TitleBar/>
            <main
                className={`flex min-h-0 flex-1 flex-col gap-3 items-center w-full overflow-y-auto ${files.length > 0 ? "justify-start" : "justify-center"}`}
                {...dragHandlers}
            >
                {files.length > 0 ? (
                    <FileListTable
                        files={files}
                        onRemove={removeFile}
                        onBusyChange={setIsWorking}
                    />
                ) : (
                    <UploadPrompt isDraggingFile={isDraggingFile}/>
                )}
                <input ref={fileInputRef} type="file"
                       accept="image/*,audio/*,.mp3,.wav,.wave,.flac,.aac,.m4a,.ogg,.oga,.aiff,.aif,.aifc,.caf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                       multiple disabled={isWorking}
                       className={"hidden"} onChange={handleFileInputChange}/>


                <Tabs defaultSelectedKey="convert" isDisabled={isWorking}
                      className={"absolute bottom-3 left-1/2 -translate-x-1/2"}>
                    <TabsList>
                        <TabsTrigger id="convert">Convert</TabsTrigger>
                        <TabsTrigger id="optimise" isDisabled={true}>Optimize</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button className={"absolute bottom-3 left-3"} variant={"secondary"} size={"icon"}
                        isDisabled={true}><HugeiconsIcon
                    icon={Settings03Icon}/></Button>
                <Button className={"absolute bottom-3 right-3"} variant={"secondary"} size={"icon"}
                        isDisabled={isWorking} onClick={openFilePicker}><HugeiconsIcon
                    icon={PlusIcon}/></Button>
            </main>
        </div>
    );
}

export default App;
