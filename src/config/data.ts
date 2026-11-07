const conversionFilesData = {
    "conversions": {
        "audio": [
            {
                "source_format": "MP3",
                "possible_conversions": ["WAV", "AAC", "FLAC", "OGG", "M4A", "WMA"]
            },
            {
                "source_format": "WAV",
                "possible_conversions": ["MP3", "AAC", "FLAC", "OGG", "M4A"]
            },
            {
                "source_format": "FLAC",
                "possible_conversions": ["MP3", "WAV", "AAC", "OGG", "M4A"]
            },
            {
                "source_format": "AAC",
                "possible_conversions": ["MP3", "WAV", "M4A", "OGG"]
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
                "possible_conversions": ["JPG/JPEG", "WEBP", "BMP", "GIF", "TIFF", "PDF"]
            },
            {
                "source_format": "JPG/JPEG",
                "possible_conversions": ["PNG", "WEBP", "BMP", "GIF", "TIFF", "PDF"]
            },
            {
                "source_format": "WEBP",
                "possible_conversions": ["PNG", "JPG/JPEG", "GIF", "BMP"]
            },
            {
                "source_format": "HEIC",
                "possible_conversions": ["JPG/JPEG", "PNG", "WEBP"]
            }
        ]
    }
};