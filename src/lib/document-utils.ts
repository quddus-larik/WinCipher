import {conversionFilesData} from "@/config/data";
import {getFileExtension, isDocumentFile} from "@/lib/file-utils";

export {isDocumentFile};

const supportedTargetFormats = new Set(["DOCX", "MARKDOWN", "HTML", "PDF"]);

const documentConversions = conversionFilesData.conversions.document;

const documentFormatAliases: Record<string, string> = {
    doc: "DOC",
    docx: "DOCX",
};

export function getDocumentFormat(file: File) {
    if (!isDocumentFile(file)) return null;

    const extension = getFileExtension(file.name);
    const extensionFormat = documentFormatAliases[extension];

    if (extensionFormat) return extensionFormat;

    if (file.type === "application/msword") return "DOC";
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return "DOCX";
    }

    return null;
}

export function getDocumentConversionOptions(sourceFormat: string) {
    const conversions = documentConversions.find(
        (conversion) => conversion.source_format === sourceFormat,
    )?.possible_conversions ?? [];

    return conversions.filter(
        (format) => supportedTargetFormats.has(format) && format !== sourceFormat,
    );
}
