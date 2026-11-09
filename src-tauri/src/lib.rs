// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use base64::{Engine as _, engine::general_purpose::STANDARD};
use flacenc::component::BitRepr;
use flacenc::error::Verify;
use image::ImageFormat;
use serde::Serialize;
use std::collections::HashMap;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use symphonia::core::codecs::audio::AudioDecoderOptions;
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::probe::Hint;
use symphonia::core::formats::{FormatOptions, TrackType};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;

#[derive(Default)]
struct ConversionState {
    files: Mutex<HashMap<String, StoredFile>>,
}

struct StoredFile {
    file_name: String,
    bytes: Vec<u8>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertedFile {
    id: String,
    file_name: String,
    size: u64,
}

struct DecodedAudio {
    samples: Vec<f32>,
    sample_rate: u32,
    channels: usize,
}

enum AudioTargetFormat {
    Wav,
    Flac,
    Mp3,
    Aac,
    M4a,
    Aiff,
}

impl AudioTargetFormat {
    fn extension(&self) -> &'static str {
        match self {
            Self::Wav => "wav",
            Self::Flac => "flac",
            Self::Mp3 => "mp3",
            Self::Aac => "aac",
            Self::M4a => "m4a",
            Self::Aiff => "aiff",
        }
    }
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

fn parse_audio_target(format: &str) -> Result<AudioTargetFormat, String> {
    match format.trim().to_ascii_uppercase().as_str() {
        "WAV" => Ok(AudioTargetFormat::Wav),
        "FLAC" => Ok(AudioTargetFormat::Flac),
        "MP3" => Ok(AudioTargetFormat::Mp3),
        "AAC" => Ok(AudioTargetFormat::Aac),
        "M4A" | "MP4A" => Ok(AudioTargetFormat::M4a),
        "AIFF" | "AIF" => Ok(AudioTargetFormat::Aiff),
        _ => Err(format!("Unsupported audio output format: {format}")),
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

fn decode_audio(file_name: &str, data: Vec<u8>) -> Result<DecodedAudio, String> {
    let source = MediaSourceStream::new(Box::new(Cursor::new(data)), Default::default());
    let mut hint = Hint::new();

    if let Some(extension) = Path::new(file_name)
        .extension()
        .and_then(|extension| extension.to_str())
    {
        hint.with_extension(extension);
    }

    let mut format = symphonia::default::get_probe()
        .probe(
            &hint,
            source,
            FormatOptions::default(),
            MetadataOptions::default(),
        )
        .map_err(|error| format!("Could not read the audio file: {error}"))?;

    let track = format
        .default_track(TrackType::Audio)
        .ok_or_else(|| "No audio track was found in this file.".to_string())?;
    let track_id = track.id;
    let codec_params = track
        .codec_params
        .as_ref()
        .and_then(|params| params.audio())
        .ok_or_else(|| "The audio track uses an unsupported codec.".to_string())?;

    let mut decoder = symphonia::default::get_codecs()
        .make_audio_decoder(codec_params, &AudioDecoderOptions::default())
        .map_err(|error| format!("Unsupported audio codec: {error}"))?;

    let mut samples: Vec<f32> = Vec::new();
    let mut sample_rate = 0;
    let mut channels = 0;

    loop {
        let packet = match format.next_packet() {
            Ok(Some(packet)) => packet,
            // Chained streams are outside the scope of the converter. Treat the end of the
            // first stream as the end of the file.
            Ok(None) | Err(SymphoniaError::ResetRequired) => break,
            Err(error) => return Err(format!("Could not read the audio file: {error}")),
        };

        if packet.track_id != track_id {
            continue;
        }

        match decoder.decode(&packet) {
            Ok(audio) => {
                if sample_rate == 0 {
                    sample_rate = audio.spec().rate();
                    channels = audio.spec().channels().count();
                }

                let start = samples.len();
                samples.resize(start + audio.samples_interleaved(), 0.0);
                audio.copy_to_slice_interleaved(&mut samples[start..]);
            }
            Err(SymphoniaError::DecodeError(_)) | Err(SymphoniaError::IoError(_)) => continue,
            Err(error) => return Err(format!("Could not decode the audio file: {error}")),
        }
    }

    if sample_rate == 0 || channels == 0 || samples.is_empty() {
        return Err("The audio file did not contain any decodable samples.".to_string());
    }

    // Only keep complete frames so the encoders always receive channel-interleaved frames.
    let frame_count = samples.len() / channels;
    samples.truncate(frame_count * channels);

    Ok(DecodedAudio {
        samples,
        sample_rate,
        channels,
    })
}

fn sample_to_i16(sample: f32) -> i16 {
    (sample.clamp(-1.0, 1.0) * i16::MAX as f32).round() as i16
}

fn encode_wav(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    let spec = hound::WavSpec {
        channels: u16::try_from(audio.channels)
            .map_err(|_| "WAV output supports at most 65535 channels.".to_string())?,
        sample_rate: audio.sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());

    {
        let mut writer = hound::WavWriter::new(&mut cursor, spec)
            .map_err(|error| format!("Could not create the WAV file: {error}"))?;

        for &sample in &audio.samples {
            writer
                .write_sample(sample_to_i16(sample))
                .map_err(|error| format!("Could not encode the WAV file: {error}"))?;
        }

        writer
            .finalize()
            .map_err(|error| format!("Could not finish the WAV file: {error}"))?;
    }

    Ok(cursor.into_inner())
}

fn flac_block_size(frame_count: usize) -> usize {
    const MIN_BLOCK_SIZE: usize = 32;
    const MAX_BLOCK_SIZE: usize = 4096;

    if frame_count < MIN_BLOCK_SIZE {
        return MIN_BLOCK_SIZE;
    }

    // Symphonia's FLAC probe rejects streams whose final block is shorter than the
    // configured block size. Prefer a block size that divides the stream exactly.
    for size in (MIN_BLOCK_SIZE..=MAX_BLOCK_SIZE).rev() {
        if frame_count % size == 0 {
            return size;
        }
    }

    MAX_BLOCK_SIZE
}

fn encode_flac(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    if audio.channels == 0 || audio.channels > 8 {
        return Err("FLAC output supports between 1 and 8 channels.".to_string());
    }

    let frame_count = audio.samples.len() / audio.channels;
    let block_size = flac_block_size(frame_count);
    let padded_frame_count = frame_count.div_ceil(block_size) * block_size;

    let mut config = flacenc::config::Encoder::default();
    config.block_size = block_size;
    let config = config
        .into_verified()
        .map_err(|error| format!("Could not configure the FLAC encoder: {error:?}"))?;

    let mut samples: Vec<i32> = audio
        .samples
        .iter()
        .map(|&sample| sample_to_i16(sample) as i32)
        .collect();
    samples.resize(padded_frame_count * audio.channels, 0);

    let source = flacenc::source::MemSource::from_samples(
        &samples,
        audio.channels,
        16,
        audio.sample_rate as usize,
    );

    let stream = flacenc::encode_with_fixed_block_size(&config, source, config.block_size)
        .map_err(|error| format!("Could not encode the FLAC file: {error:?}"))?;

    let mut sink = flacenc::bitsink::ByteSink::new();
    stream
        .write(&mut sink)
        .map_err(|error| format!("Could not write the FLAC file: {error:?}"))?;

    Ok(sink.as_slice().to_vec())
}

fn aac_bitrate(channels: usize) -> u32 {
    (channels as u32)
        .saturating_mul(64_000)
        .clamp(64_000, 512_000)
}

fn encode_mp3(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    if !matches!(audio.channels, 1 | 2) {
        return Err(format!(
            "MP3 output supports mono or stereo audio, not {} channels.",
            audio.channels
        ));
    }

    if !matches!(
        audio.sample_rate,
        8_000 | 11_025 | 12_000 | 16_000 | 22_050 | 24_000 | 32_000 | 44_100 | 48_000
    ) {
        return Err(format!(
            "MP3 output does not support a {} Hz sample rate.",
            audio.sample_rate
        ));
    }

    let channels = u16::try_from(audio.channels)
        .map_err(|_| "MP3 output supports at most 65535 channels.".to_string())?;
    let samples: Vec<i16> = audio
        .samples
        .iter()
        .map(|&sample| sample_to_i16(sample))
        .collect();
    let bitrate_kbps = if audio.channels == 1 { 128 } else { 192 };
    let mut encoder = rusty_mp3::Mp3Encoder::new(rusty_mp3::Mp3EncoderConfig {
        bitrate_kbps,
        vbr_quality: None,
    });

    encoder
        .push_pcm_s16(&samples, channels, audio.sample_rate)
        .map_err(|error| format!("Could not encode the MP3 file: {error:?}"))?;
    encoder.finish();

    let mut output = Vec::new();

    loop {
        match encoder.next_packet() {
            Ok(packet) => output.extend_from_slice(&packet),
            Err(rusty_mp3::Error::Eof) | Err(rusty_mp3::Error::Again) => break,
            Err(error) => return Err(format!("Could not encode the MP3 file: {error:?}")),
        }
    }

    Ok(output)
}

fn encode_aac(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    const AAC_SAMPLE_RATES: [u32; 12] = [
        96_000, 88_200, 64_000, 48_000, 44_100, 32_000, 24_000, 22_050, 16_000, 12_000, 11_025,
        8_000,
    ];

    if !AAC_SAMPLE_RATES.contains(&audio.sample_rate) {
        return Err(format!(
            "AAC output does not support a {} Hz sample rate.",
            audio.sample_rate
        ));
    }

    if !matches!(audio.channels, 1..=6 | 8) {
        return Err(format!(
            "AAC output does not support {} channels.",
            audio.channels
        ));
    }

    let channels = u8::try_from(audio.channels)
        .map_err(|_| "AAC output supports at most 255 channels.".to_string())?;
    let samples: Vec<i16> = audio
        .samples
        .iter()
        .map(|&sample| sample_to_i16(sample))
        .collect();
    let mut encoder = oxideav_aac::encoder::StreamEncoder::new(
        oxideav_aac::encoder::EncoderConfig {
            sample_rate: audio.sample_rate,
            channels,
            bitrate: aac_bitrate(audio.channels),
        },
    )
    .map_err(|error| format!("Could not configure the AAC encoder: {error:?}"))?;

    encoder
        .encode_all(&samples)
        .map_err(|error| format!("Could not encode the AAC file: {error:?}"))
}

fn mp4_sample_freq_index(sample_rate: u32) -> Result<mp4::SampleFreqIndex, String> {
    match sample_rate {
        96_000 => Ok(mp4::SampleFreqIndex::Freq96000),
        88_200 => Ok(mp4::SampleFreqIndex::Freq88200),
        64_000 => Ok(mp4::SampleFreqIndex::Freq64000),
        48_000 => Ok(mp4::SampleFreqIndex::Freq48000),
        44_100 => Ok(mp4::SampleFreqIndex::Freq44100),
        32_000 => Ok(mp4::SampleFreqIndex::Freq32000),
        24_000 => Ok(mp4::SampleFreqIndex::Freq24000),
        22_050 => Ok(mp4::SampleFreqIndex::Freq22050),
        16_000 => Ok(mp4::SampleFreqIndex::Freq16000),
        12_000 => Ok(mp4::SampleFreqIndex::Freq12000),
        11_025 => Ok(mp4::SampleFreqIndex::Freq11025),
        8_000 => Ok(mp4::SampleFreqIndex::Freq8000),
        7_350 => Ok(mp4::SampleFreqIndex::Freq7350),
        _ => Err(format!(
            "M4A output does not support a {sample_rate} Hz sample rate."
        )),
    }
}

fn mp4_channel_config(channels: usize) -> Result<mp4::ChannelConfig, String> {
    match channels {
        1 => Ok(mp4::ChannelConfig::Mono),
        2 => Ok(mp4::ChannelConfig::Stereo),
        3 => Ok(mp4::ChannelConfig::Three),
        4 => Ok(mp4::ChannelConfig::Four),
        5 => Ok(mp4::ChannelConfig::Five),
        6 => Ok(mp4::ChannelConfig::FiveOne),
        8 => Ok(mp4::ChannelConfig::SevenOne),
        _ => Err(format!("M4A output does not support {channels} channels.")),
    }
}

fn find_m4a_esds(output: &[u8]) -> Option<(usize, usize)> {
    fn walk(data: &[u8], start: usize, end: usize) -> Option<(usize, usize)> {
        let mut position = start;

        while position + 8 <= end {
            let size = u32::from_be_bytes(data[position..position + 4].try_into().ok()?) as usize;
            let next = position.checked_add(size)?;

            if size < 8 || next > end {
                return None;
            }

            let name = &data[position + 4..position + 8];

            if name == b"esds" {
                return Some((position, next));
            }

            let is_container = name == b"moov"
                || name == b"trak"
                || name == b"mdia"
                || name == b"minf"
                || name == b"stbl";
            let child_start = if is_container {
                Some(position + 8)
            } else if name == b"stsd" {
                Some(position + 16)
            } else if name == b"mp4a" {
                Some(position + 36)
            } else {
                None
            };

            if let Some(child_start) = child_start {
                if let Some(found) = walk(data, child_start, next) {
                    return Some(found);
                }
            }

            position = next;
        }

        None
    }

    walk(output, 0, output.len())
}

fn fix_m4a_esds_sl_config(output: &mut [u8]) {
    // `mp4` 0.14 writes the SLConfigDescriptor body but declares its length as
    // zero. Symphonia trusts the declared length and reads one byte past the
    // descriptor. Correct the length so the generated M4A is standards-compliant.
    let Some((_, box_end)) = find_m4a_esds(output) else {
        return;
    };

    if box_end < 3 || box_end > output.len() {
        return;
    }

    if output[box_end - 3..box_end] == [0x06, 0x00, 0x00] {
        output[box_end - 2] = 0x01;
    }
}

fn encode_m4a(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    let aac = encode_aac(audio)?;
    let payloads = oxideav_aac::latm_writer::strip_adts(&aac);

    if payloads.is_empty() {
        return Err("The AAC encoder did not produce any frames for the M4A file.".to_string());
    }

    let freq_index = mp4_sample_freq_index(audio.sample_rate)?;
    let chan_conf = mp4_channel_config(audio.channels)?;
    let aac_config = mp4::AacConfig {
        bitrate: aac_bitrate(audio.channels),
        profile: mp4::AudioObjectType::AacLowComplexity,
        freq_index,
        chan_conf,
    };
    let track_config = mp4::TrackConfig {
        track_type: mp4::TrackType::Audio,
        timescale: audio.sample_rate,
        language: "und".to_string(),
        media_conf: mp4::MediaConfig::AacConfig(aac_config),
    };
    let mp4_config = mp4::Mp4Config {
        major_brand: "M4A "
            .parse()
            .map_err(|_| "Could not configure the M4A container.".to_string())?,
        minor_version: 512,
        compatible_brands: vec![
            "M4A "
                .parse()
                .map_err(|_| "Could not configure the M4A container.".to_string())?,
            "isom"
                .parse()
                .map_err(|_| "Could not configure the M4A container.".to_string())?,
            "mp42"
                .parse()
                .map_err(|_| "Could not configure the M4A container.".to_string())?,
        ],
        timescale: 1000,
    };

    let mut writer = mp4::Mp4Writer::write_start(Cursor::new(Vec::new()), &mp4_config)
        .map_err(|error| format!("Could not create the M4A file: {error}"))?;
    writer
        .add_track(&track_config)
        .map_err(|error| format!("Could not write the M4A track: {error}"))?;

    for (index, payload) in payloads.into_iter().enumerate() {
        let sample = mp4::Mp4Sample {
            start_time: index as u64 * 1024,
            duration: 1024,
            rendering_offset: 0,
            is_sync: true,
            bytes: mp4::Bytes::from(payload),
        };
        writer
            .write_sample(1, &sample)
            .map_err(|error| format!("Could not write the M4A audio: {error}"))?;
    }

    writer
        .write_end()
        .map_err(|error| format!("Could not finish the M4A file: {error}"))?;

    let mut output = writer.into_writer().into_inner();
    fix_m4a_esds_sl_config(&mut output);
    Ok(output)
}

fn extended_sample_rate(sample_rate: u32) -> [u8; 10] {
    let exponent = 31 - sample_rate.leading_zeros();
    let mantissa = (sample_rate as u64) << (63 - exponent);
    let exponent_bits = (exponent + 16_383) as u16;
    let mut output = [0u8; 10];

    output[0] = (exponent_bits >> 8) as u8;
    output[1] = exponent_bits as u8;
    output[2..].copy_from_slice(&mantissa.to_be_bytes());
    output
}

fn encode_aiff(audio: &DecodedAudio) -> Result<Vec<u8>, String> {
    if audio.channels == 0 {
        return Err("AIFF output requires at least one channel.".to_string());
    }
    if audio.sample_rate == 0 {
        return Err("AIFF output requires a positive sample rate.".to_string());
    }

    let channels = u16::try_from(audio.channels)
        .map_err(|_| "AIFF output supports at most 65535 channels.".to_string())?;
    let frame_count = audio.samples.len() / audio.channels;
    let data_len = frame_count
        .checked_mul(audio.channels)
        .and_then(|count| count.checked_mul(2))
        .ok_or_else(|| "The AIFF output is too large.".to_string())?;
    let data_len_u32 =
        u32::try_from(data_len).map_err(|_| "The AIFF output is too large.".to_string())?;
    let frame_count =
        u32::try_from(frame_count).map_err(|_| "The AIFF output is too large.".to_string())?;
    let form_size = 46u32
        .checked_add(data_len_u32)
        .ok_or_else(|| "The AIFF output is too large.".to_string())?;
    let ssnd_size = 8u32
        .checked_add(data_len_u32)
        .ok_or_else(|| "The AIFF output is too large.".to_string())?;

    let mut output = Vec::with_capacity(54 + data_len);
    output.extend_from_slice(b"FORM");
    output.extend_from_slice(&form_size.to_be_bytes());
    output.extend_from_slice(b"AIFF");
    output.extend_from_slice(b"COMM");
    output.extend_from_slice(&18u32.to_be_bytes());
    output.extend_from_slice(&channels.to_be_bytes());
    output.extend_from_slice(&frame_count.to_be_bytes());
    output.extend_from_slice(&16u16.to_be_bytes());
    output.extend_from_slice(&extended_sample_rate(audio.sample_rate));
    output.extend_from_slice(b"SSND");
    output.extend_from_slice(&ssnd_size.to_be_bytes());
    output.extend_from_slice(&0u32.to_be_bytes());
    output.extend_from_slice(&0u32.to_be_bytes());

    for &sample in &audio.samples {
        output.extend_from_slice(&sample_to_i16(sample).to_be_bytes());
    }

    Ok(output)
}

#[tauri::command]
async fn convert_image(
    state: tauri::State<'_, ConversionState>,
    id: String,
    file_name: String,
    target_format: String,
    data: String,
) -> Result<ConvertedFile, String> {
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
            StoredFile {
                file_name: output_name.clone(),
                bytes,
            },
        );

    Ok(ConvertedFile {
        id,
        file_name: output_name,
        size,
    })
}

#[tauri::command]
async fn convert_audio(
    state: tauri::State<'_, ConversionState>,
    id: String,
    file_name: String,
    target_format: String,
    data: String,
) -> Result<ConvertedFile, String> {
    let input = STANDARD
        .decode(data)
        .map_err(|error| format!("Could not read the audio data: {error}"))?;
    let target = parse_audio_target(&target_format)?;
    let output_name = output_file_name(&file_name, target.extension());

    let bytes = tauri::async_runtime::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let audio = decode_audio(&file_name, input)?;

        match target {
            AudioTargetFormat::Wav => encode_wav(&audio),
            AudioTargetFormat::Flac => encode_flac(&audio),
            AudioTargetFormat::Mp3 => encode_mp3(&audio),
            AudioTargetFormat::Aac => encode_aac(&audio),
            AudioTargetFormat::M4a => encode_m4a(&audio),
            AudioTargetFormat::Aiff => encode_aiff(&audio),
        }
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
            StoredFile {
                file_name: output_name.clone(),
                bytes,
            },
        );

    Ok(ConvertedFile {
        id,
        file_name: output_name,
        size,
    })
}

#[tauri::command]
async fn save_converted_files(
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
fn discard_converted_file(state: tauri::State<'_, ConversionState>, id: String) {
    if let Ok(mut files) = state.files.lock() {
        files.remove(&id);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(ConversionState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            convert_image,
            convert_audio,
            save_converted_files,
            discard_converted_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{
        DecodedAudio, decode_audio, encode_aac, encode_aiff, encode_flac, encode_m4a, encode_mp3,
        encode_wav,
    };

    #[test]
    fn audio_round_trips_through_all_encoders() {
        let sample_rate = 44_100;
        let channels = 2;
        let frame_count = 4_410;
        let mut samples = Vec::with_capacity(frame_count * channels);

        for frame in 0..frame_count {
            let value = ((frame as f32 / sample_rate as f32) * 440.0 * std::f32::consts::TAU).sin()
                * 0.25;

            samples.push(value);
            samples.push(value);
        }

        let audio = DecodedAudio {
            samples,
            sample_rate,
            channels,
        };

        let wav = encode_wav(&audio).expect("encode wav");
        let decoded_wav = decode_audio("test.wav", wav).expect("decode wav");

        assert_eq!(decoded_wav.sample_rate, sample_rate);
        assert_eq!(decoded_wav.channels, channels);
        assert_eq!(decoded_wav.samples.len(), frame_count * channels);

        let flac = encode_flac(&decoded_wav).expect("encode flac");
        let decoded_flac = decode_audio("test.flac", flac).expect("decode flac");

        assert_eq!(decoded_flac.sample_rate, sample_rate);
        assert_eq!(decoded_flac.channels, channels);
        assert_eq!(decoded_flac.samples.len(), frame_count * channels);

        let mp3 = encode_mp3(&audio).expect("encode mp3");
        let decoded_mp3 = decode_audio("test.mp3", mp3).expect("decode mp3");

        assert_eq!(decoded_mp3.sample_rate, sample_rate);
        assert_eq!(decoded_mp3.channels, channels);
        assert!(!decoded_mp3.samples.is_empty());

        let aac = encode_aac(&audio).expect("encode aac");
        let decoded_aac = decode_audio("test.aac", aac).expect("decode aac");

        assert_eq!(decoded_aac.sample_rate, sample_rate);
        assert_eq!(decoded_aac.channels, channels);
        assert!(!decoded_aac.samples.is_empty());

        let m4a = encode_m4a(&audio).expect("encode m4a");
        let decoded_m4a = decode_audio("test.m4a", m4a).expect("decode m4a");

        assert_eq!(decoded_m4a.sample_rate, sample_rate);
        assert_eq!(decoded_m4a.channels, channels);
        assert!(!decoded_m4a.samples.is_empty());

        let aiff = encode_aiff(&audio).expect("encode aiff");
        let decoded_aiff = decode_audio("test.aiff", aiff).expect("decode aiff");

        assert_eq!(decoded_aiff.sample_rate, sample_rate);
        assert_eq!(decoded_aiff.channels, channels);
        assert_eq!(decoded_aiff.samples.len(), frame_count * channels);
    }
}
