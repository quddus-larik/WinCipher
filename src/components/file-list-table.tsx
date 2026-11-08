import {useEffect, useState} from "react";
import {invoke, isTauri} from "@tauri-apps/api/core";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter} from "@/components/ui/table";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import {Progress} from "@/components/ui/progress"
import {Badge} from "@/components/ui/badge"
import {HugeiconsIcon} from '@hugeicons/react';
import {ArrowRight02Icon, CheckIcon} from '@hugeicons/core-free-icons';
import {Button} from "@/components/ui/button.tsx";
import {getImageConversionOptions, getImageFormat, isImageFile} from "@/lib/image-utils";


type FileListTableProps = {
    files: File[];
    onRemove?: (file: File) => void;
    onBusyChange?: (busy: boolean) => void;
};

type ConversionStatus = "idle" | "converting" | "converted" | "error";

type RowConversion = {
    target: string | null;
    status: ConversionStatus;
    progress: number;
    outputId: string | null;
    outputName: string | null;
    saving: boolean;
    savedPath: string | null;
    error: string | null;
};

type ConvertedImage = {
    id: string;
    fileName: string;
    size: number;
};

const emptyRow: RowConversion = {
    target: null,
    status: "idle",
    progress: 0,
    outputId: null,
    outputName: null,
    saving: false,
    savedPath: null,
    error: null,
};

const sizeUnits = ["B", "KB", "MB", "GB", "TB"];
const sizeFormatter = new Intl.NumberFormat("en", {maximumFractionDigits: 1});

function formatFileSize(bytes: number) {
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < sizeUnits.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${sizeFormatter.format(size)} ${sizeUnits[unitIndex]}`;
}

function getFileType(file: File) {
    if (file.type) return file.type;

    const extension = file.name.split(".").pop();
    return extension && extension !== file.name ? extension.toUpperCase() : "Unknown";
}

function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const fileIds = new WeakMap<File, string>();

function getFileId(file: File) {
    let id = fileIds.get(file);

    if (!id) {
        id = createId();
        fileIds.set(file, id);
    }

    return id;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return fallback;
}

function readFileAsBase64(file: File, onProgress: (percent: number) => void) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        reader.onload = () => {
            const result = reader.result;

            if (typeof result !== "string") {
                reject(new Error("Could not read the file."));
                return;
            }

            const separator = result.indexOf(",");
            resolve(separator === -1 ? result : result.slice(separator + 1));
        };

        reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
        reader.readAsDataURL(file);
    });
}

const maxFileNameLength = 32;

function truncateFileName(fileName: string) {
    if (fileName.length <= maxFileNameLength) return fileName;

    const lastDotIndex = fileName.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0;
    const extension = hasExtension ? fileName.slice(lastDotIndex) : "";
    const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;

    if (extension.length >= maxFileNameLength - 1) {
        return `${fileName.slice(0, maxFileNameLength - 1)}…`;
    }

    const visibleBaseLength = Math.max(1, maxFileNameLength - extension.length - 1);
    return `${baseName.slice(0, visibleBaseLength)}…${extension}`;
}

function FilePreview({file}: { file: File }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);

        if (!isImageFile(file)) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (previewUrl && !hasError) {
        return (
            <img
                src={previewUrl}
                alt={file.name}
                className={"h-8 w-auto rounded-sm object-contain select-none"}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                onError={() => setHasError(true)}
            />
        );
    }

    return (
        <Avatar>
            <AvatarFallback className={"rounded-sm"}>CN</AvatarFallback>
        </Avatar>
    );
}

function ConvertCell({
                         file,
                         target,
                         disabled,
                         onTargetChange,
                     }: {
    file: File;
    target: string | null;
    disabled: boolean;
    onTargetChange: (target: string | null) => void;
}) {
    const imageFormat = getImageFormat(file);

    if (!imageFormat) {
        return <span>{getFileType(file)}</span>;
    }

    const options = getImageConversionOptions(imageFormat);

    if (options.length === 0) {
        return <span>{imageFormat}</span>;
    }

    return (
        <div className={"flex items-center gap-2"}>
            <Badge className={"rounded-sm"} variant={"secondary"}>{imageFormat}</Badge>
            <HugeiconsIcon size={16} icon={ArrowRight02Icon}/>
            <Combobox
                allowsEmptyCollection
                aria-label={`Convert ${imageFormat} to`}
                selectedKey={target}
                onSelectionChange={(key) => onTargetChange(key == null ? null : String(key))}
                isDisabled={disabled}
            >
                <ComboboxInput placeholder={"Convert to"} className={"w-22"} disabled={disabled}/>
                <ComboboxContent>
                    <ComboboxList
                        renderEmptyState={() => (
                            <ComboboxEmpty>No formats found.</ComboboxEmpty>
                        )}
                    >
                        {options.map((option) => (
                            <ComboboxItem key={option} id={option}>
                                {option}
                            </ComboboxItem>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
}

export function FileListTable({files, onRemove, onBusyChange}: FileListTableProps) {
    const [rows, setRows] = useState<Record<string, RowConversion>>({});
    const [conversionCount, setConversionCount] = useState(0);
    const [saveCount, setSaveCount] = useState(0);
    const isBusy = conversionCount > 0 || saveCount > 0;
    const totalSize = files.reduce((total, file) => total + file.size, 0);

    useEffect(() => {
        onBusyChange?.(isBusy);
    }, [isBusy, onBusyChange]);

    useEffect(() => {
        return () => onBusyChange?.(false);
    }, [onBusyChange]);

    const updateRow = (fileId: string, patch: Partial<RowConversion>) => {
        setRows((previousRows) => ({
            ...previousRows,
            [fileId]: {
                ...emptyRow,
                ...previousRows[fileId],
                ...patch,
            },
        }));
    };

    const changeTarget = (fileId: string, target: string | null) => {
        const outputId = rows[fileId]?.outputId;

        if (outputId) {
            void invoke("discard_converted_image", {id: outputId}).catch(() => {
            });
        }

        updateRow(fileId, {
            target,
            status: "idle",
            progress: 0,
            outputId: null,
            outputName: null,
            saving: false,
            savedPath: null,
            error: null,
        });
    };

    const convertOne = async (file: File, fileId: string, target: string) => {
        if (!isTauri()) {
            updateRow(fileId, {
                status: "error",
                progress: 0,
                error: "Conversion is only available in the desktop app.",
            });
            return;
        }

        const outputId = createId();
        let progressTimer: number | undefined;

        updateRow(fileId, {
            status: "converting",
            progress: 1,
            outputId: null,
            outputName: null,
            savedPath: null,
            error: null,
        });

        try {
            const data = await readFileAsBase64(file, (percent) => {
                updateRow(fileId, {progress: Math.max(1, Math.round(percent * 0.35))});
            });

            updateRow(fileId, {progress: 40});

            progressTimer = window.setInterval(() => {
                setRows((previousRows) => {
                    const row = previousRows[fileId];

                    if (!row || row.status !== "converting" || row.progress >= 90) {
                        return previousRows;
                    }

                    return {
                        ...previousRows,
                        [fileId]: {...row, progress: Math.min(90, row.progress + 3)},
                    };
                });
            }, 300);

            const result = await invoke<ConvertedImage>("convert_image", {
                id: outputId,
                fileName: file.name,
                targetFormat: target,
                data,
            });

            updateRow(fileId, {
                status: "converted",
                progress: 100,
                outputId: result.id,
                outputName: result.fileName,
                error: null,
            });
        } catch (error) {
            updateRow(fileId, {
                status: "error",
                progress: 0,
                error: getErrorMessage(error, "Could not convert the image."),
            });
        } finally {
            if (progressTimer !== undefined) {
                window.clearInterval(progressTimer);
            }
        }
    };

    const convertRow = async (file: File) => {
        if (isBusy) return;

        const fileId = getFileId(file);
        const target = rows[fileId]?.target;

        if (!target || !isImageFile(file)) return;

        setConversionCount((count) => count + 1);

        try {
            await convertOne(file, fileId, target);
        } finally {
            setConversionCount((count) => Math.max(0, count - 1));
        }
    };

    const convertAll = async () => {
        if (isBusy) return;

        const pendingRows = files.flatMap((file) => {
            const fileId = getFileId(file);
            const row = rows[fileId];

            if (!row?.target || row.status === "converted" || !isImageFile(file)) {
                return [];
            }

            return [{file, fileId, target: row.target}];
        });

        if (pendingRows.length === 0) return;

        setConversionCount((count) => count + 1);

        try {
            for (const pendingRow of pendingRows) {
                await convertOne(pendingRow.file, pendingRow.fileId, pendingRow.target);
            }
        } finally {
            setConversionCount((count) => Math.max(0, count - 1));
        }
    };

    const markSaving = (outputIds: string[], saving: boolean, error?: string) => {
        const idSet = new Set(outputIds);

        setRows((previousRows) => {
            const nextRows = {...previousRows};

            for (const [fileId, row] of Object.entries(nextRows)) {
                if (row.outputId && idSet.has(row.outputId)) {
                    nextRows[fileId] = {
                        ...row,
                        saving,
                        error: error ?? row.error,
                    };
                }
            }

            return nextRows;
        });
    };

    const saveImages = async (outputIds: string[]) => {
        if (isBusy || outputIds.length === 0) return;

        setSaveCount((count) => count + 1);
        markSaving(outputIds, true);

        try {
            const savedPaths = await invoke<string[] | null>("save_converted_images", {ids: outputIds});

            if (!savedPaths) {
                markSaving(outputIds, false);
                return;
            }

            const savedById = new Map(outputIds.map((id, index) => [id, savedPaths[index] ?? null]));

            setRows((previousRows) => {
                const nextRows = {...previousRows};

                for (const [fileId, row] of Object.entries(nextRows)) {
                    if (row.outputId && savedById.has(row.outputId)) {
                        nextRows[fileId] = {
                            ...row,
                            saving: false,
                            savedPath: savedById.get(row.outputId) ?? null,
                            error: null,
                        };
                    }
                }

                return nextRows;
            });
        } catch (error) {
            markSaving(outputIds, false, getErrorMessage(error, "Could not save the converted images."));
        } finally {
            setSaveCount((count) => Math.max(0, count - 1));
        }
    };

    const saveRow = (fileId: string) => {
        const outputId = rows[fileId]?.outputId;

        if (outputId) {
            void saveImages([outputId]);
        }
    };

    const handleRemove = (file: File) => {
        if (isBusy) return;

        const fileId = getFileId(file);
        const outputId = rows[fileId]?.outputId;

        if (outputId) {
            void invoke("discard_converted_image", {id: outputId}).catch(() => {
            });
        }

        setRows((previousRows) => {
            const nextRows = {...previousRows};
            delete nextRows[fileId];
            return nextRows;
        });

        onRemove?.(file);
    };

    const convertedOutputIds = files
        .map((file) => rows[getFileId(file)]?.outputId)
        .filter((outputId): outputId is string => Boolean(outputId));

    const hasPendingConversions = files.some((file) => {
        const row = rows[getFileId(file)];
        return Boolean(row?.target) && row.status !== "converted" && isImageFile(file);
    });

    const footerLabel = conversionCount > 0
        ? "Converting…"
        : saveCount > 0
            ? "Saving…"
            : hasPendingConversions
                ? "Convert all"
                : "Save all";

    const footerDisabled = isBusy || (hasPendingConversions ? false : convertedOutputIds.length === 0);

    const handleFooterPress = () => {
        if (hasPendingConversions) {
            void convertAll();
        } else {
            void saveImages(convertedOutputIds);
        }
    };

    return (
        <Table aria-label="Uploaded files">
            <TableHeader>
                <TableHead isRowHeader>Name</TableHead>
                <TableHead>Convert</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
                {files.map((file, index) => {
                    const fileId = getFileId(file);
                    const row = rows[fileId] ?? emptyRow;
                    const isConverted = row.status === "converted";
                    const actionLabel = row.status === "converting"
                        ? "Converting…"
                        : row.saving
                            ? "Saving…"
                            : isConverted
                                ? "Save"
                                : "Convert";
                    const actionDisabled = isBusy || (isConverted
                        ? !row.outputId
                        : !row.target || !isImageFile(file));

                    return (
                        <TableRow key={`${file.name}-${file.lastModified}-${index}`}>
                            <TableCell className="font-medium flex gap-2 items-center">
                                <FilePreview file={file}/>
                                <div className={"flex min-w-0 flex-col gap-1"}>
                                    <span title={file.name} className={"flex gap-1 items-center"}>{truncateFileName(file.name)}
                                        {isConverted && row.progress === 100  ? (
                                            <HugeiconsIcon size={18} icon={CheckIcon}/>
                                        ) : null}
                                    </span>
                                    <div className={"flex items-center gap-1.5"}>
                                        <Progress
                                            aria-label={`${file.name} conversion progress`}
                                            value={row.progress}
                                            className="w-24"
                                        />
                                    </div>
                                    {row.error ? (
                                        <span
                                            className={"max-w-40 truncate text-[10px] text-destructive"}
                                            title={row.error}
                                        >
                                            {row.error}
                                        </span>
                                    ) : null}
                                </div>
                            </TableCell>
                            <TableCell>
                                <ConvertCell
                                    file={file}
                                    target={row.target}
                                    disabled={isBusy}
                                    onTargetChange={(target) => changeTarget(fileId, target)}
                                />
                            </TableCell>
                            <TableCell className="text-right">{formatFileSize(file.size)}</TableCell>
                            <TableCell className={"text-right"}>
                                <div className={"flex items-center justify-end gap-1"}>
                                    <Button
                                        variant={"secondary"}
                                        size={"sm"}
                                        isDisabled={actionDisabled}
                                        onPress={() => {
                                            if (isConverted) {
                                                saveRow(fileId);
                                            } else {
                                                void convertRow(file);
                                            }
                                        }}
                                    >
                                        {actionLabel}
                                    </Button>
                                    <Button
                                        variant={"secondary"}
                                        size={"sm"}
                                        isDisabled={isBusy}
                                        onPress={() => handleRemove(file)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}

            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell/>
                    <TableCell className="text-right">{formatFileSize(totalSize)}</TableCell>
                    <TableCell className={"text-right"}>
                        <Button size={"sm"} isDisabled={footerDisabled} onPress={handleFooterPress}>
                            {footerLabel}
                        </Button>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );
}
