import {conversionFilesData} from "@/config/data";

const imageFileExtensions = new Set([
    "png", "jpg", "jpeg", "jfif", "webp", "heic", "heif",
    "gif", "bmp", "tif", "tiff", "svg", "avif", "ico",
]);

const supportedTargetFormats = new Set([
    "PNG", "JPG/JPEG", "WEBP", "BMP", "GIF", "TIFF", "ICO", "AVIF",
]);

const imageConversions = conversionFilesData.conversions.image;

export function getFileExtension(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

export function isImageFile(file: File) {
    return file.type.startsWith("image/") || imageFileExtensions.has(getFileExtension(file.name));
}

export function getImageFormat(file: File) {
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

export function getImageConversionOptions(sourceFormat: string) {
    return (imageConversions.find(
        (conversion) => conversion.source_format === sourceFormat,
    )?.possible_conversions ?? []).filter((format) => supportedTargetFormats.has(format));
}
