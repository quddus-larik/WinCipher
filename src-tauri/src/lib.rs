// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64::{Engine as _, engine::general_purpose::STANDARD};
use image::ImageFormat;
use serde::Serialize;
use std::collections::HashMap;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

#[derive(Default)]
struct ConversionState {
    files: Mutex<HashMap<String, ConvertedFile>>,
}

struct ConvertedFile {
    file_name: String,
    bytes: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertedImage {
    id: String,
    file_name: String,
    size: u64,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn parse_target_format(format: &str) -> Result<(ImageFormat, &'static str), String> {
    match format.trim().to_ascii_uppercase().as_str() {
        "PNG" => Ok((ImageFormat::Png, "png")),
        "JPG" | "JPEG" | "JPG/JPEG" => Ok((ImageFormat::Jpeg, "jpg")),
        "WEBP" => Ok((ImageFormat::WebP, "webp")),
        "BMP" => Ok((ImageFormat::Bmp, "bmp")),
        "GIF" => Ok((ImageFormat::Gif, "gif")),
        "TIFF" | "TIF" => Ok((ImageFormat::Tiff, "tiff")),
        "ICO" => Ok((ImageFormat::Ico, "ico")),
        "AVIF" => Ok((ImageFormat::Avif, "avif")),
        _ => Err(format!("Unsupported target format: {format}")),
    }
}

fn output_file_name(file_name: &str, extension: &str) -> String {
    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .filter(|stem| !stem.is_empty())
        .unwrap_or("converted");

    format!("{stem}.{extension}")
}

fn unique_output_path(folder: &Path, file_name: &str) -> PathBuf {
    let candidate = folder.join(file_name);
    if !candidate.exists() {
        return candidate;
    }

    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .filter(|stem| !stem.is_empty())
        .unwrap_or("converted");
    let extension = path.extension().and_then(|extension| extension.to_str());

    for index in 1u32.. {
        let name = match extension {
            Some(extension) => format!("{stem} ({index}).{extension}"),
            None => format!("{stem} ({index})"),
        };
        let candidate = folder.join(name);

        if !candidate.exists() {
            return candidate;
        }
    }

    unreachable!()
}

#[tauri::command]
async fn convert_image(
    state: tauri::State<'_, ConversionState>,
    id: String,
    file_name: String,
    target_format: String,
    data: String,
) -> Result<ConvertedImage, String> {
    let extension = Path::new(&file_name)
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if matches!(extension.as_str(), "heic" | "heif") {
        return Err(
            "HEIC/HEIF images are not supported by the image converter yet. Convert them to JPG or PNG first."
                .to_string(),
        );
    }

    let input = STANDARD
        .decode(data)
        .map_err(|error| format!("Could not read image data: {error}"))?;
    let (format, output_extension) = parse_target_format(&target_format)?;
    let output_name = output_file_name(&file_name, output_extension);

    let bytes = tauri::async_runtime::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let image = image::load_from_memory(&input)
            .map_err(|error| format!("Could not decode image: {error}"))?;
        let mut output = Vec::new();

        image
            .write_to(&mut Cursor::new(&mut output), format)
            .map_err(|error| format!("Could not convert image: {error}"))?;

        Ok(output)
    })
    .await
    .map_err(|error| error.to_string())??;

    let size = bytes.len() as u64;

    state
        .files
        .lock()
        .map_err(|_| "The conversion store is unavailable.".to_string())?
        .insert(
            id.clone(),
            ConvertedFile {
                file_name: output_name.clone(),
                bytes,
            },
        );

    Ok(ConvertedImage {
        id,
        file_name: output_name,
        size,
    })
}

#[tauri::command]
async fn save_converted_images(
    state: tauri::State<'_, ConversionState>,
    ids: Vec<String>,
) -> Result<Option<Vec<String>>, String> {
    let files: Vec<(String, Vec<u8>)> = {
        let store = state
            .files
            .lock()
            .map_err(|_| "The conversion store is unavailable.".to_string())?;

        ids.iter()
            .filter_map(|id| {
                store
                    .get(id)
                    .map(|file| (file.file_name.clone(), file.bytes.clone()))
            })
            .collect()
    };

    if files.is_empty() {
        return Ok(Some(Vec::new()));
    }

    let saved_paths =
        tauri::async_runtime::spawn_blocking(move || -> Result<Option<Vec<String>>, String> {
            let Some(folder) = rfd::FileDialog::new()
                .set_title("Select output folder")
                .pick_folder()
            else {
                return Ok(None);
            };

            let mut saved_paths = Vec::with_capacity(files.len());

            for (file_name, bytes) in files {
                let path = unique_output_path(&folder, &file_name);

                std::fs::write(&path, bytes)
                    .map_err(|error| format!("Could not save {}: {error}", path.display()))?;

                saved_paths.push(path.to_string_lossy().to_string());
            }

            Ok(Some(saved_paths))
        })
        .await
        .map_err(|error| error.to_string())??;

    Ok(saved_paths)
}

#[tauri::command]
fn discard_converted_image(state: tauri::State<'_, ConversionState>, id: String) {
    if let Ok(mut files) = state.files.lock() {
        files.remove(&id);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ConversionState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            convert_image,
            save_converted_images,
            discard_converted_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
