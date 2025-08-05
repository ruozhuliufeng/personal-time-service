use tauri::{Manager, Window};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_click_through(window: Window, enabled: bool) -> Result<(), String> {
    window.set_ignore_cursor_events(enabled).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_window_opacity(window: Window, opacity: f64) -> Result<(), String> {
    window.set_opacity(opacity).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(window: Window, enabled: bool) -> Result<(), String> {
    window.set_always_on_top(enabled).map_err(|e| e.to_string())
}

#[tauri::command]
async fn send_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    let notification = app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .build()
        .map_err(|e| e.to_string())?;
    
    notification.show().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            set_click_through,
            set_window_opacity,
            set_always_on_top,
            send_notification
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // Set initial window properties
            window.set_ignore_cursor_events(true).ok();
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
