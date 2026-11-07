import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,TableFooter} from "@/components/ui/table";

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

export function FileListTable({files}: FileListTableProps) {
    return (
        <Table aria-label="Uploaded files">
            <TableHeader>
                <TableHead isRowHeader>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead  className="text-right">Size</TableHead>
            </TableHeader>
            <TableBody>
                {files.map((file, index) => (
                    <TableRow key={`${file.name}-${file.lastModified}-${index}`}>
                        <TableCell className="font-medium "><span title={file.name}>{truncateFileName(file.name)}</span></TableCell>
                        <TableCell>{getFileType(file)}</TableCell>
                        <TableCell  className="text-right">{formatFileSize(file.size)}</TableCell>
                    </TableRow>
                ))}

            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell/>
                    <TableCell className="text-right">$2,500.00</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );
}
