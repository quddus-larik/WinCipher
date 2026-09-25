use tauri::{Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

#[tauri::command]
fn set_ignore_mouse_events(window: WebviewWindow, ignore: bool) {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_LAYERED, WS_EX_TRANSPARENT,
        };

        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                let current_style = GetWindowLongW(hwnd.0 as _, GWL_EXSTYLE);
                let transparent_flag = WS_EX_TRANSPARENT as i32;
                let layered_flag = WS_EX_LAYERED as i32;

                let new_style = if ignore {
                    current_style | transparent_flag | layered_flag
                } else {
                    current_style & !transparent_flag
                };

                SetWindowLongW(hwnd.0 as _, GWL_EXSTYLE, new_style);
            }
        }
    }
}

#[tauri::command]
fn set_sidebar_expanded(window: WebviewWindow, expanded: bool) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let monitor_height = monitor.size().height;

        // Expanded: 240px width | Collapsed: 12px edge trigger strip
        let width = if expanded { 240 } else { 12 };
        let height = 300; // Widget panel height

        let y = (monitor_height as i32 - height) / 2;

        let _ = window.set_size(PhysicalSize::new(width, height as u32));
        let _ = window.set_position(PhysicalPosition::new(0, y));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            set_ignore_mouse_events,
            set_sidebar_expanded
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // Initialize as collapsed (12px wide edge trigger)
                set_sidebar_expanded(window.clone(), false);

                #[cfg(target_os = "windows")]
                set_ignore_mouse_events(window, false);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}