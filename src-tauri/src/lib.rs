use tauri::{Manager, PhysicalPosition, Position};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let monitor_pos = monitor.position();
                    let monitor_size = monitor.size();

                    if let Ok(window_size) = window.outer_size() {
                        let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
                        let y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;
                        let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}