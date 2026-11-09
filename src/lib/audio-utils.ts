import {conversionFilesData} from "@/config/data";
import {getFileExtension, isAudioFile} from "@/lib/file-utils";

export {isAudioFile};

const supportedTargetFormats = new Set(["WAV", "FLAC", "MP3", "AAC", "M4A", "AIFF"]);

const audioConversions = conversionFilesData.conversions.audio;

const audioFormatAliases: Record<string, string> = {
    mp3: "MP3",
    wav: "WAV",
    wave: "WAV",
    flac: "FLAC",
    aac: "AAC",
    m4a: "M4A",
    mp4a: "M4A",
    ogg: "OGG",
    oga: "OGG",
    aiff: "AIFF",
    aif: "AIFF",
    aifc: "AIFF",
    caf: "CAF",
};

export function getAudioFormat(file: File) {
    if (!isAudioFile(file)) return null;

    const extension = getFileExtension(file.name);
    const extensionFormat = audioFormatAliases[extension];

    if (extensionFormat) return extensionFormat;

    const mimeSubtype = file.type.split("/")[1]?.split(";")[0]?.split("+")[0];

    if (!mimeSubtype) return null;

    if (mimeSubtype === "mpeg") return "MP3";
    if (mimeSubtype === "wav" || mimeSubtype === "wave" || mimeSubtype === "x-wav") return "WAV";
    if (mimeSubtype === "flac" || mimeSubtype === "x-flac") return "FLAC";
    if (mimeSubtype === "mp4" || mimeSubtype === "x-m4a") return "M4A";
    if (mimeSubtype === "ogg") return "OGG";
    if (mimeSubtype === "aiff" || mimeSubtype === "x-aiff") return "AIFF";
    if (mimeSubtype === "caf" || mimeSubtype === "x-caf") return "CAF";

    return mimeSubtype.toUpperCase();
}

export function getAudioConversionOptions(sourceFormat: string) {
    const conversions = audioConversions.find(
        (conversion) => conversion.source_format === sourceFormat,
    )?.possible_conversions ?? [];

    return conversions.filter(
        (format) => supportedTargetFormats.has(format) && format !== sourceFormat,
    );
}
