const imageFileExtensions = new Set([
    "png", "jpg", "jpeg", "jfif", "webp", "heic", "heif",
    "gif", "bmp", "tif", "tiff", "svg", "avif", "ico",
]);

const audioFileExtensions = new Set([
    "mp3", "wav", "wave", "flac", "aac", "m4a",
    "ogg", "oga", "aiff", "aif", "aifc", "caf",
]);

const documentFileExtensions = new Set(["doc", "docx"]);

export function getFileExtension(fileName: string) {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

export function isImageFile(file: File) {
    return file.type.startsWith("image/") || imageFileExtensions.has(getFileExtension(file.name));
}

export function isAudioFile(file: File) {
    return file.type.startsWith("audio/") || audioFileExtensions.has(getFileExtension(file.name));
}

export function isDocumentFile(file: File) {
    return file.type === "application/msword"
        || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        || documentFileExtensions.has(getFileExtension(file.name));
}

export function isSupportedFile(file: File) {
    return isImageFile(file) || isAudioFile(file) || isDocumentFile(file);
}
