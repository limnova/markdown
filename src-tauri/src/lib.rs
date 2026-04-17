mod documents;
mod workspace;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            workspace::load_workspace,
            workspace::list_workspace_tree,
            documents::open_document,
            documents::save_document,
            documents::create_workspace_item,
            documents::rename_workspace_item,
            documents::move_workspace_item,
            documents::delete_workspace_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
