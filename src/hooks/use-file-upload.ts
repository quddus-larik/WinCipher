import {useRef, useState} from "react";
import type {ChangeEvent, DragEvent} from "react";
import {isImageFile} from "@/lib/image-utils";

const isFileDrag = (event: DragEvent<HTMLElement>) =>
    event.dataTransfer.types.includes("Files");

export function useFileUpload(disabled = false) {
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const dragDepth = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = (fileList: FileList | null) => {
        if (disabled || !fileList || fileList.length === 0) return;

        const imageFiles = Array.from(fileList).filter(isImageFile);
        if (imageFiles.length === 0) return;

        setFiles((previousFiles) => [...previousFiles, ...imageFiles]);
    };

    const openFilePicker = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const removeFile = (file: File) => {
        setFiles((previousFiles) => previousFiles.filter((current) => current !== file));
    };

    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        addFiles(event.target.files);
        event.target.value = "";
    };

    const handleDragEnter = (event: DragEvent<HTMLElement>) => {
        if (disabled || !isFileDrag(event)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setIsDraggingFile(true);
    };

    const handleDragOver = (event: DragEvent<HTMLElement>) => {
        if (disabled || !isFileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = (event: DragEvent<HTMLElement>) => {
        if (!isFileDrag(event)) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0 || event.relatedTarget === null) {
            dragDepth.current = 0;
            setIsDraggingFile(false);
        }
    };

    const handleDrop = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        dragDepth.current = 0;
        setIsDraggingFile(false);
        addFiles(event.dataTransfer.files);
    };

    return {
        files,
        isDraggingFile,
        fileInputRef,
        openFilePicker,
        removeFile,
        handleFileInputChange,
        dragHandlers: {
            onDragEnter: handleDragEnter,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
        },
    };
}
