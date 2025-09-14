// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod models;
mod providers;
mod commands {
    pub mod ai_config;
    pub mod business;
    pub mod carts;
    pub mod categories;
    pub mod logs;
    pub mod menu;
    pub mod orders;
    pub mod planner;
    pub mod products;
    pub mod security;
    pub mod tables;
    pub mod terminal;
    pub mod masterstocks;
    pub mod sms;
}

use tauri::Manager;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tauri::Builder::default()
        // Native printing implementation
        .setup(|app| {
            // Initialize database in project root
            let db_path = database::get_db_path().map_err(|e| e.to_string())?;
            database::init_database(&db_path)?;

            // Initialize logs database
            let logs_db_path = database::get_logs_db_path().map_err(|e| e.to_string())?;
            database::init_logs_database(&logs_db_path)?;

            // Initialize security database
            database::init_security_database(&logs_db_path)?;

            // Initialize printer configuration database
            let printer_config_db_path = database::get_printer_config_db_path().map_err(|e| e.to_string())?;
            database::init_printer_config_database(&printer_config_db_path)?;

            // Initialize business database
            database::init_business_database()?;

            // Initialize MasterStocks database
            database::init_masterstock_database().map_err(|e| e.to_string())?;

            // Initialize SMS database
            database::init_sms_database().map_err(|e| e.to_string())?;

            // Initialize AI config database
            database::init_ai_config_database().map_err(|e| e.to_string())?;

            // Set up window
            let _window = app
                .get_webview_window("main")
                .ok_or("Main window not found")?;
            #[cfg(target_os = "macos")]
            _window.set_title("Zikiro");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // AI Config commands
            commands::ai_config::get_ai_config,
            commands::ai_config::save_ai_config,
            commands::ai_config::test_ai_config,
            commands::ai_config::delete_ai_config,
            // Business commands
            commands::business::get_business_info,
            commands::business::save_business_info,
            commands::business::get_tax_settings,
            commands::business::save_tax_settings,
            commands::business::get_user_preferences,
            commands::business::save_user_preferences,
            commands::business::get_system_config,
            commands::business::save_system_config,
            // Products commands
            commands::products::get_products,
            commands::products::create_product,
            commands::products::update_product,
            commands::products::delete_product,
            commands::categories::get_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::tables::get_tables,
            commands::tables::get_table_by_id_command,
            commands::tables::create_table,
            commands::tables::update_table_command,
            commands::tables::delete_table_command,
            commands::tables::get_next_table_number_command,
            commands::tables::check_table_number,
            // Reservation commands
            commands::tables::create_reservation,
            commands::tables::get_reservations_by_date,
            commands::tables::get_today_reservations,
            commands::tables::update_reservation_status,
            commands::tables::delete_reservation,
            commands::tables::get_reservations_by_table,
            commands::carts::get_table_cart_command,
            commands::carts::add_item_to_cart,
            commands::carts::update_cart_item,
            commands::carts::remove_item_from_cart,
            commands::carts::clear_table_cart_command,
            commands::carts::get_all_table_carts_command,
            // Orders commands
            commands::orders::create_order_from_cart,
            commands::orders::get_all_orders,
            commands::orders::get_kitchen_orders,
            commands::orders::update_order_status,
            commands::orders::delete_order,
            commands::orders::get_order_by_table,
            commands::orders::update_order_items_command,
            commands::orders::cancel_order_item,
            // Trash commands
            commands::orders::get_trash_orders,
            commands::orders::move_order_to_trash,
            commands::orders::restore_order_from_trash,
            commands::orders::delete_order_permanently,
            commands::orders::clear_trash,
            // Planner commands
            commands::planner::get_planner_layouts,
            commands::planner::get_planner_layout_by_id_command,
            commands::planner::create_planner_layout,
            commands::planner::update_planner_layout_command,
            commands::planner::delete_planner_layout_command,
            commands::planner::get_planner_layout_with_items_command,
            commands::planner::get_planner_items_by_layout_id_command,
            commands::planner::create_planner_item,
            commands::planner::update_planner_item_command,
            commands::planner::delete_planner_item_command,
            commands::planner::get_planner_catalog_items,
            commands::planner::create_planner_catalog_item,
            commands::planner::sync_planner_layout_with_tables,
            commands::planner::import_tables_to_planner_layout,
            // Menu Analysis commands
            commands::menu::analyze_menu_image,
            commands::menu::import_menu_items,
            // Logs commands
            commands::logs::create_log_entry,
            commands::logs::get_logs_command,
            commands::logs::get_logs_with_filter_command,
            commands::logs::get_financial_logs_command,
            commands::logs::get_logs_by_category_command,
            commands::logs::delete_old_logs_command,
            commands::logs::get_logs_count_command,
            commands::logs::log_sale_event,
            commands::logs::log_table_status_change,
            commands::logs::log_product_event,
            // Security commands
            commands::security::init_security_system,
            commands::security::create_secure_log_entry,
            commands::security::get_secure_logs_command,
            commands::security::create_app_clock,
            commands::security::get_app_clock_command,
            commands::security::update_app_clock,
            commands::security::detect_anomalies,
            commands::security::get_anomalies_command,
            commands::security::get_unresolved_anomalies_command,
            commands::security::resolve_anomaly_command,
            commands::security::generate_compliance_report,
            commands::security::get_security_config_command,
            commands::security::save_security_config_command,
            // Terminal-based printing commands
            commands::terminal::execute_terminal_command,
            commands::terminal::get_printers,
            commands::terminal::print_test_page,
            commands::terminal::print_ticket,
            commands::terminal::get_default_printer,
            commands::terminal::get_printer_status,
            commands::terminal::print_to_tcp_port,
            commands::terminal::print_smart_ticket,
            commands::terminal::save_printer_to_database,
            commands::terminal::get_saved_printer_config,
            commands::terminal::remove_printer_from_database,
            // MasterStocks commands
            commands::masterstocks::init_masterstocks_database,
            commands::masterstocks::get_ingredients,
            commands::masterstocks::create_ingredient,
            commands::masterstocks::update_ingredient_command,
            commands::masterstocks::delete_ingredient_command,
            commands::masterstocks::update_stock_quantity,
            commands::masterstocks::get_suppliers,
            commands::masterstocks::create_supplier,
            commands::masterstocks::get_stock_alerts,
            commands::masterstocks::mark_alert_as_read_command,
                commands::masterstocks::get_stock_movements,
                commands::masterstocks::analyze_invoice_image,
                commands::masterstocks::import_invoice_data,
            // SMS commands
            commands::sms::send_sms,
            commands::sms::get_sms_messages,
            commands::sms::get_sms_message_by_id,
            commands::sms::get_sms_templates,
            commands::sms::create_sms_template,
            commands::sms::update_sms_template,
            commands::sms::delete_sms_template,
            commands::sms::get_sms_contacts,
            commands::sms::create_sms_contact,
            commands::sms::update_sms_contact,
            commands::sms::delete_sms_contact,
            commands::sms::get_sms_config,
            commands::sms::update_sms_config,
            commands::sms::get_sms_conversations,
            commands::sms::get_sms_conversation_messages,
            commands::sms::test_sms_gateway_android,
            commands::sms::test_infobip,
            // New provider configuration commands
            commands::sms::get_provider_selection,
            commands::sms::update_provider_selection,
            commands::sms::get_sms_gateway_android_config,
            commands::sms::update_sms_gateway_android_config,
            commands::sms::get_infobip_config,
            commands::sms::update_infobip_config,
            commands::sms::get_sim800_900_config,
            commands::sms::update_sim800_900_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
