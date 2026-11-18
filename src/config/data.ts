export const conversionFilesData = {
    "conversions": {
        "audio": [
            {
                "source_format": "MP3",
                "possible_conversions": ["WAV", "FLAC", "AAC", "M4A", "AIFF"]
            },
            {
                "source_format": "WAV",
                "possible_conversions": ["FLAC", "MP3", "AAC", "M4A", "AIFF"]
            },
            {
                "source_format": "FLAC",
                "possible_conversions": ["WAV", "MP3", "AAC", "M4A", "AIFF"]
            },
            {
                "source_format": "AAC",
                "possible_conversions": ["WAV", "FLAC", "MP3", "M4A", "AIFF"]
            },
            {
                "source_format": "M4A",
                "possible_conversions": ["WAV", "FLAC", "MP3", "AAC", "AIFF"]
            },
            {
                "source_format": "OGG",
                "possible_conversions": ["WAV", "FLAC", "MP3", "AAC", "M4A", "AIFF"]
            },
            {
                "source_format": "AIFF",
                "possible_conversions": ["WAV", "FLAC", "MP3", "AAC", "M4A"]
            },
            {
                "source_format": "CAF",
                "possible_conversions": ["WAV", "FLAC", "MP3", "AAC", "M4A", "AIFF"]
            }
        ],
        "document": [
            {
                "source_format": "DOC",
                "possible_conversions": ["DOCX", "MARKDOWN", "HTML"]
            },
            {
                "source_format": "DOCX",
                "possible_conversions": ["MARKDOWN", "HTML", "PDF"]
            }
        ],
        "video": [
            {
                "source_format": "MP4",
                "possible_conversions": ["MKV", "AVI", "MOV", "WEBM", "GIF", "MP3"]
            },
            {
                "source_format": "MKV",
                "possible_conversions": ["MP4", "AVI", "MOV", "WEBM"]
            },
            {
                "source_format": "MOV",
                "possible_conversions": ["MP4", "AVI", "MKV", "GIF", "WEBM"]
            },
            {
                "source_format": "WEBM",
                "possible_conversions": ["MP4", "MKV", "GIF"]
            }
        ],
        "image": [
            {
                "source_format": "PNG",
                "possible_conversions": ["JPG/JPEG", "WEBP", "BMP", "GIF", "TIFF"]
            },
            {
                "source_format": "JPG/JPEG",
                "possible_conversions": ["PNG", "WEBP", "BMP", "GIF", "TIFF"]
            },
            {
                "source_format": "WEBP",
                "possible_conversions": ["PNG", "JPG/JPEG", "GIF", "BMP"]
            }
        ]
    }
};