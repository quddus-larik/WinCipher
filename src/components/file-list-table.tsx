import {useEffect, useState} from "react";
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
import {conversionFilesData} from "@/config/data";
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';


type FileListTableProps = {
    files: File[];
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

const imageConversions = conversionFilesData.conversions.image;
const imageFileExtensions = new Set([
    "png", "jpg", "jpeg", "jfif", "webp", "heic", "heif",
    "gif", "bmp", "tif", "tiff", "svg", "avif", "ico",
]);

function getFileExtension(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

function isImageFile(file: File) {
    return file.type.startsWith("image/") || imageFileExtensions.has(getFileExtension(file.name));
}

function getImageFormat(file: File) {
    if (!isImageFile(file)) return null;

    const extension = getFileExtension(file.name);

    if (extension === "jpg" || extension === "jpeg" || extension === "jfif") {
        return "JPG/JPEG";
    }

    if (extension === "heic" || extension === "heif") {
        return "HEIC";
    }

    if (extension) {
        return extension.toUpperCase();
    }

    const mimeSubtype = file.type.split("/")[1]?.split("+")[0];
    return mimeSubtype ? mimeSubtype.toUpperCase() : null;
}

function getImageConversionOptions(sourceFormat: string) {
    return imageConversions.find(
        (conversion) => conversion.source_format === sourceFormat,
    )?.possible_conversions ?? [];
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

function ConvertCell({file}: { file: File }) {
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
            <HugeiconsIcon size={16} icon={ArrowRight02Icon} />
            <Combobox allowsEmptyCollection aria-label={`Convert ${imageFormat} to`}>
                <ComboboxInput placeholder={"Convert to"} className={"w-36"}/>
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

export function FileListTable({files}: FileListTableProps) {
    const totalSize = files.reduce((total, file) => total + file.size, 0);

    return (
        <Table aria-label="Uploaded files">
            <TableHeader>
                <TableHead isRowHeader>Name</TableHead>
                <TableHead>Convert</TableHead>
                <TableHead className="text-right">Size</TableHead>
            </TableHeader>
            <TableBody>
                {files.map((file, index) => (
                    <TableRow key={`${file.name}-${file.lastModified}-${index}`}>
                        <TableCell className="font-medium flex gap-2 items-center">
                            <FilePreview file={file}/>
                            <span title={file.name}>{truncateFileName(file.name)}</span>
                        </TableCell>
                        <TableCell><ConvertCell file={file}/></TableCell>
                        <TableCell className="text-right">{formatFileSize(file.size)}</TableCell>
                    </TableRow>
                ))}

            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell/>
                    <TableCell className="text-right">{formatFileSize(totalSize)}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );
}
