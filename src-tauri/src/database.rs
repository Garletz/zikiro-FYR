use rusqlite::{Connection, Result, params};
use crate::models::*;
use crate::commands::business::init_business_db;
use std::path::Path;
use tracing::info;
use chrono::{DateTime, Utc};
use uuid::Uuid;

pub fn init_database(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            tax_rate_id TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Migration: Remplacer tax_rate par tax_rate_id si nécessaire
    let _ = conn.execute(
        "ALTER TABLE categories ADD COLUMN tax_rate_id TEXT",
        [],
    );

    conn.execute(
        "CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            cost REAL NOT NULL,
            category_id TEXT NOT NULL,
            barcode TEXT,
            sku TEXT,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            min_stock INTEGER NOT NULL DEFAULT 0,
            image_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )",
        [],
    )?;



    conn.execute(
        "CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            number INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL DEFAULT 4,
            status TEXT NOT NULL DEFAULT 'free',
            position_x INTEGER NOT NULL DEFAULT 100,
            position_y INTEGER NOT NULL DEFAULT 100,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS table_carts (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL UNIQUE,
            items TEXT NOT NULL,
            total_amount REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (table_id) REFERENCES tables (id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Table des réservations
    conn.execute(
        "CREATE TABLE IF NOT EXISTS table_reservations (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            customer_email TEXT,
            reservation_date TEXT NOT NULL,
            reservation_time TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 120,
            party_size INTEGER NOT NULL,
            special_requests TEXT,
            status TEXT NOT NULL DEFAULT 'confirmed',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (table_id) REFERENCES tables (id) ON DELETE CASCADE
        )",
        [],
    )?;



    // ===== PLANNER MODULE TABLES =====
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS planner_layouts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            room_size_width REAL NOT NULL,
            room_size_height REAL NOT NULL,
            room_size_depth REAL NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS planner_items (
            id TEXT PRIMARY KEY,
            layout_id TEXT NOT NULL,
            object_type TEXT NOT NULL,
            name TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            position_z REAL NOT NULL,
            size_width REAL NOT NULL,
            size_height REAL NOT NULL,
            size_depth REAL NOT NULL,
            rotation REAL NOT NULL,
            color TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (layout_id) REFERENCES planner_layouts (id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS planner_catalog_items (
            id TEXT PRIMARY KEY,
            object_type TEXT NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            size_width REAL NOT NULL,
            size_height REAL NOT NULL,
            size_depth REAL NOT NULL,
            color TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Insert default catalog items if none exist
    let catalog_count: i32 = conn.query_row("SELECT COUNT(*) FROM planner_catalog_items", [], |row| row.get(0))?;
    if catalog_count == 0 {
        insert_default_catalog_items(&conn)?;
        info!("Default planner catalog items created");
    }

    // Insert default category if none exists
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM categories", [], |row| row.get(0))?;
    if count == 0 {
        let default_category = Category::new("Général".to_string());
        insert_category(&conn, &default_category)?;
        info!("Default category created");
    }

    // Initialize orders table
    init_orders_table(&conn)?;

    info!("Database initialized successfully");
    Ok(())
}

pub fn init_ai_config_database() -> Result<()> {
    let db_path = get_business_db_path().map_err(|e| rusqlite::Error::SqliteFailure(
        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_IOERR), 
        Some(format!("Failed to get business DB path: {}", e))
    ))?;
    let conn = Connection::open(&db_path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ai_config (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            api_key TEXT NOT NULL,
            api_url TEXT NOT NULL,
            model TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;
    
    info!("AI config database initialized");
    Ok(())
}

// Table CRUD operations
pub fn insert_table(conn: &Connection, table: &Table) -> Result<()> {
    
    conn.execute(
        "INSERT INTO tables (id, number, name, capacity, status, position_x, position_y, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            table.id,
            table.number,
            table.name,
            table.capacity,
            table.status.to_string(),
            table.position_x,
            table.position_y,
            table.created_at.to_rfc3339(),
            table.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_tables(conn: &Connection) -> Result<Vec<Table>> {
    let mut stmt = conn.prepare(
        "SELECT id, number, name, capacity, status, position_x, position_y, created_at, updated_at 
         FROM tables ORDER BY number"
    )?;
    
    let table_iter = stmt.query_map([], |row| {
        let status_str: String = row.get(4)?;
        let status = match status_str.as_str() {
            "free" => TableStatus::Free,
            "occupied" => TableStatus::Occupied,
            "reserved" => TableStatus::Reserved,
            "cleaning" => TableStatus::Cleaning,
            _ => {
                // Unknown status in database, using default 'free' status
                TableStatus::Free
            },
        };
        
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        
        Ok(Table {
            id: row.get(0)?,
            number: row.get(1)?,
            name: row.get(2)?,
            capacity: row.get(3)?,
            status,
            position_x: row.get(5)?,
            position_y: row.get(6)?,

            created_at,
            updated_at,
        })
    })?;
    
    let mut tables = Vec::new();
    for table in table_iter {
        tables.push(table?);
    }
    Ok(tables)
}

pub fn get_next_table_number(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare("SELECT MAX(number) FROM tables")?;
    let max_number: Option<i32> = stmt.query_row([], |row| row.get(0))?;
    Ok(max_number.unwrap_or(0) + 1)
}

pub fn is_table_number_taken(conn: &Connection, number: i32, exclude_id: Option<&str>) -> Result<bool> {
    let sql = if let Some(_id) = exclude_id {
        "SELECT COUNT(*) FROM tables WHERE number = ? AND id != ?"
    } else {
        "SELECT COUNT(*) FROM tables WHERE number = ?"
    };
    
    let mut stmt = conn.prepare(sql)?;
    let count: i32 = if let Some(id) = exclude_id {
        stmt.query_row(params![number, id], |row| row.get(0))?
    } else {
        stmt.query_row(params![number], |row| row.get(0))?
    };
    
    Ok(count > 0)
}

pub fn get_table_by_id(conn: &Connection, id: &str) -> Result<Option<Table>> {
    let mut stmt = conn.prepare(
        "SELECT id, number, name, capacity, status, position_x, position_y, created_at, updated_at 
         FROM tables WHERE id = ?"
    )?;
    
    let mut table_iter = stmt.query_map([id], |row| {
        let status_str: String = row.get(4)?;
        let status = match status_str.as_str() {
            "free" => TableStatus::Free,
            "occupied" => TableStatus::Occupied,
            "reserved" => TableStatus::Reserved,
            "cleaning" => TableStatus::Cleaning,
            _ => TableStatus::Free,
        };
        
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        
        Ok(Table {
            id: row.get(0)?,
            number: row.get(1)?,
            name: row.get(2)?,
            capacity: row.get(3)?,
            status,
            position_x: row.get(5)?,
            position_y: row.get(6)?,

            created_at,
            updated_at,
        })
    })?;
    
    Ok(table_iter.next().transpose()?)
}

pub fn update_table(conn: &Connection, id: &str, table: &UpdateTableRequest) -> Result<()> {
    let updated_at = Utc::now().to_rfc3339();
    
    // Construire la requête SQL dynamiquement
    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref status) = table.status {
        set_clauses.push("status = ?");
        params.push(Box::new(status.to_string()));
    }
    
    if let Some(number) = table.number {
        set_clauses.push("number = ?");
        params.push(Box::new(number));
    }
    
    if let Some(ref name) = table.name {
        set_clauses.push("name = ?");
        params.push(Box::new(name.clone()));
    }
    
    if let Some(capacity) = table.capacity {
        set_clauses.push("capacity = ?");
        params.push(Box::new(capacity));
    }
    
    if let Some(position_x) = table.position_x {
        set_clauses.push("position_x = ?");
        params.push(Box::new(position_x));
    }
    
    if let Some(position_y) = table.position_y {
        set_clauses.push("position_y = ?");
        params.push(Box::new(position_y));
    }
    

    
    // Toujours mettre à jour updated_at
    set_clauses.push("updated_at = ?");
    params.push(Box::new(updated_at));
    
    // Ajouter l'ID pour la clause WHERE
    params.push(Box::new(id.to_string()));
    
    if !set_clauses.is_empty() {
        let sql = format!(
            "UPDATE tables SET {} WHERE id = ?",
            set_clauses.join(", ")
        );
        
        info!("Executing SQL: {}", sql);
        
        // Convertir les paramètres en rusqlite::Params
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let result = conn.execute(&sql, rusqlite::params_from_iter(param_refs));
        match &result {
            Ok(rows_affected) => info!("Table update successful, {} rows affected", rows_affected),
            Err(e) => info!("Table update failed: {}", e),
        }
        result?;
    }
    
    Ok(())
}

pub fn delete_table(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM tables WHERE id = ?", [id])?;
    Ok(())
}

// Table Cart operations
pub fn get_table_cart(conn: &Connection, table_id: &str) -> Result<Option<TableCart>> {
    let mut stmt = conn.prepare(
        "SELECT id, table_id, items, total_amount, created_at, updated_at 
         FROM table_carts WHERE table_id = ?"
    )?;
    
    let mut cart_iter = stmt.query_map([table_id], |row| {
        let items_json: String = row.get(2)?;
        let items: Vec<CartItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(4)?;
        let updated_at_str: String = row.get(5)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid created_at date".to_string()))?
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid updated_at date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(TableCart {
            id: row.get(0)?,
            table_id: row.get(1)?,
            items,
            total_amount: row.get(3)?,
            created_at,
            updated_at,
        })
    })?;
    
    Ok(cart_iter.next().transpose()?)
}

pub fn save_table_cart(conn: &Connection, cart: &TableCart) -> Result<()> {
    let items_json = serde_json::to_string(&cart.items)
        .map_err(|_| rusqlite::Error::InvalidParameterName("JSON serialization failed".to_string()))?;
    
    conn.execute(
        "INSERT OR REPLACE INTO table_carts (id, table_id, items, total_amount, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            cart.id,
            cart.table_id,
            items_json,
            cart.total_amount,
            cart.created_at.to_rfc3339(),
            cart.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn clear_table_cart(conn: &Connection, table_id: &str) -> Result<()> {
    conn.execute("DELETE FROM table_carts WHERE table_id = ?", [table_id])?;
    Ok(())
}

pub fn get_all_table_carts(conn: &Connection) -> Result<Vec<TableCart>> {
    let mut stmt = conn.prepare(
        "SELECT id, table_id, items, total_amount, created_at, updated_at 
         FROM table_carts ORDER BY updated_at DESC"
    )?;
    
    let cart_iter = stmt.query_map([], |row| {
        let items_json: String = row.get(2)?;
        let items: Vec<CartItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(4)?;
        let updated_at_str: String = row.get(5)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid created_at date".to_string()))?
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid updated_at date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(TableCart {
            id: row.get(0)?,
            table_id: row.get(1)?,
            items,
            total_amount: row.get(3)?,
            created_at,
            updated_at,
        })
    })?;
    
    let mut carts = Vec::new();
    for cart in cart_iter {
        carts.push(cart?);
    }
    Ok(carts)
}

pub fn get_connection(db_path: &Path) -> Result<Connection> {
    Connection::open(db_path)
}

pub fn get_db_path() -> std::io::Result<std::path::PathBuf> {
    // Get the current executable path
    let exe_path = std::env::current_exe()?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().unwrap() // target/debug
        .parent().unwrap() // target
        .parent().unwrap() // src-tauri
        .parent().unwrap(); // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    
    Ok(data_dir.join("pos.db"))
}

pub fn get_logs_db_path() -> std::io::Result<std::path::PathBuf> {
    // Get the current executable path
    let exe_path = std::env::current_exe()?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().unwrap() // target/debug
        .parent().unwrap() // target
        .parent().unwrap() // src-tauri
        .parent().unwrap(); // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    
    Ok(data_dir.join("logs.db"))
}

pub fn get_business_db_path() -> std::io::Result<std::path::PathBuf> {
    // Get the current executable path
    let exe_path = std::env::current_exe()?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().unwrap() // target/debug
        .parent().unwrap() // target
        .parent().unwrap() // src-tauri
        .parent().unwrap(); // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    
    Ok(data_dir.join("business.db"))
}

pub fn init_business_database() -> Result<()> {
    let db_path = get_business_db_path().map_err(|e| rusqlite::Error::SqliteFailure(
        rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_IOERR),
        Some(format!("Failed to get business db path: {}", e))
    ))?;
    
    init_business_db(db_path.to_str().unwrap())
}

pub fn get_printer_config_db_path() -> std::io::Result<std::path::PathBuf> {
    // Get the current executable path
    let exe_path = std::env::current_exe()?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().unwrap() // target/debug
        .parent().unwrap() // target
        .parent().unwrap() // src-tauri
        .parent().unwrap(); // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    
    Ok(data_dir.join("printerconfig.db"))
}

// Category operations
pub fn insert_category(conn: &Connection, category: &Category) -> Result<()> {
    conn.execute(
        "INSERT INTO categories (id, name, description, color, tax_rate_id, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            category.id,
            category.name,
            category.description,
            category.color,
            category.tax_rate_id,
            category.is_active,
            category.created_at.to_rfc3339(),
            category.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_categories(conn: &Connection) -> Result<Vec<Category>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, color, tax_rate_id, is_active, created_at, updated_at
         FROM categories WHERE is_active = 1 ORDER BY name"
    )?;
    
    let category_iter = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            color: row.get(3)?,
            tax_rate_id: row.get(4)?,
            is_active: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut categories = Vec::new();
    for category in category_iter {
        categories.push(category?);
    }
    Ok(categories)
}

pub fn update_category(conn: &Connection, id: &str, category: &Category) -> Result<()> {
    conn.execute(
        "UPDATE categories SET name = ?1, description = ?2, color = ?3, tax_rate_id = ?4, is_active = ?5, updated_at = ?6
         WHERE id = ?7",
        params![
            category.name,
            category.description,
            category.color,
            category.tax_rate_id,
            category.is_active,
            Utc::now().to_rfc3339(),
            id,
        ],
    )?;
    Ok(())
}

pub fn delete_category(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("UPDATE categories SET is_active = 0 WHERE id = ?1", params![id])?;
    Ok(())
}

// Product operations
pub fn insert_product(conn: &Connection, product: &Product) -> Result<()> {
    conn.execute(
        "INSERT INTO products (id, name, description, price, cost, category_id, barcode, sku, 
         stock_quantity, min_stock, image_url, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            product.id,
            product.name,
            product.description,
            product.price,
            product.cost,
            product.category_id,
            product.barcode,
            product.sku,
            product.stock_quantity,
            product.min_stock,
            product.image_url,
            product.is_active,
            product.created_at.to_rfc3339(),
            product.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_products(conn: &Connection) -> Result<Vec<Product>> {
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.description, p.price, p.cost, p.category_id, p.barcode, p.sku,
                p.stock_quantity, p.min_stock, p.image_url, p.is_active, p.created_at, p.updated_at,
                c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = 1 ORDER BY p.name"
    )?;
    
    let product_iter = stmt.query_map([], |row| {
        Ok(Product {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            price: row.get(3)?,
            cost: row.get(4)?,
            category_id: row.get(5)?,
            barcode: row.get(6)?,
            sku: row.get(7)?,
            stock_quantity: row.get(8)?,
            min_stock: row.get(9)?,
            image_url: row.get(10)?,
            is_active: row.get(11)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(13)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut products = Vec::new();
    for product in product_iter {
        products.push(product?);
    }
    Ok(products)
}

pub fn get_product_by_id(conn: &Connection, id: &str) -> Result<Option<Product>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, price, cost, category_id, barcode, sku,
                stock_quantity, min_stock, image_url, is_active, created_at, updated_at
         FROM products WHERE id = ?1 AND is_active = 1"
    )?;
    
    let mut rows = stmt.query(params![id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(Product {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            price: row.get(3)?,
            cost: row.get(4)?,
            category_id: row.get(5)?,
            barcode: row.get(6)?,
            sku: row.get(7)?,
            stock_quantity: row.get(8)?,
            min_stock: row.get(9)?,
            image_url: row.get(10)?,
            is_active: row.get(11)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(13)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn update_product(conn: &Connection, id: &str, product: &Product) -> Result<()> {
    conn.execute(
        "UPDATE products SET name = ?1, description = ?2, price = ?3, cost = ?4, category_id = ?5,
         barcode = ?6, sku = ?7, stock_quantity = ?8, min_stock = ?9, image_url = ?10, 
         is_active = ?11, updated_at = ?12 WHERE id = ?13",
        params![
            product.name,
            product.description,
            product.price,
            product.cost,
            product.category_id,
            product.barcode,
            product.sku,
            product.stock_quantity,
            product.min_stock,
            product.image_url,
            product.is_active,
            Utc::now().to_rfc3339(),
            id,
        ],
    )?;
    Ok(())
}

pub fn delete_product(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("UPDATE products SET is_active = 0 WHERE id = ?1", params![id])?;
    Ok(())
}

// ===== PLANNER MODULE DATABASE FUNCTIONS =====

fn insert_default_catalog_items(conn: &Connection) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    
    // Tables
    let table_items = vec![
        ("Table ronde 4 places", "table", "🍽️", 80.0, 80.0, 80.0, "#8B4513", "Tables"),
        ("Table ronde 6 places", "table", "🍽️", 100.0, 100.0, 80.0, "#8B4513", "Tables"),
        ("Table ronde 8 places", "table", "🍽️", 120.0, 120.0, 80.0, "#8B4513", "Tables"),
        ("Table rectangulaire 4 places", "table", "🍽️", 120.0, 80.0, 80.0, "#8B4513", "Tables"),
        ("Table rectangulaire 6 places", "table", "🍽️", 150.0, 90.0, 80.0, "#8B4513", "Tables"),
        ("Table rectangulaire 8 places", "table", "🍽️", 180.0, 100.0, 80.0, "#8B4513", "Tables"),
    ];
    
    // Chairs
    let chair_items = vec![
        ("Chaise standard", "chair", "🪑", 50.0, 50.0, 90.0, "#654321", "Chaises"),
        ("Chaise haute", "chair", "🪑", 50.0, 50.0, 120.0, "#654321", "Chaises"),
        ("Tabouret", "chair", "🪑", 40.0, 40.0, 75.0, "#654321", "Chaises"),
    ];
    
    // Other items
    let other_items = vec![
        ("Comptoir", "bar", "🍺", 200.0, 60.0, 110.0, "#8B4513", "Bar"),
        ("Cuisine", "kitchen", "👨‍🍳", 300.0, 200.0, 250.0, "#696969", "Cuisine"),
        ("Toilettes", "bathroom", "🚻", 150.0, 100.0, 250.0, "#87CEEB", "Sanitaires"),
        ("Entrée", "entrance", "🚪", 120.0, 80.0, 250.0, "#D3D3D3", "Entrée"),
        ("Mur", "wall", "🧱", 100.0, 20.0, 250.0, "#A9A9A9", "Murs"),
        ("Décoration", "decoration", "🎨", 50.0, 50.0, 50.0, "#FFD700", "Décoration"),
    ];
    
    let all_items = [table_items, chair_items, other_items].concat();
    
    for (name, object_type, icon, width, height, depth, color, category) in all_items {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO planner_catalog_items (id, object_type, name, icon, size_width, size_height, size_depth, color, category, description, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                id,
                object_type,
                name,
                icon,
                width,
                height,
                depth,
                color,
                category,
                None::<String>,
                now,
                now,
            ],
        )?;
    }
    
    Ok(())
}

// Planner Layout operations
pub fn insert_planner_layout(conn: &Connection, layout: &PlannerLayout) -> Result<()> {
    conn.execute(
        "INSERT INTO planner_layouts (id, name, room_size_width, room_size_height, room_size_depth, metadata, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            layout.id,
            layout.name,
            layout.room_size.width,
            layout.room_size.height,
            layout.room_size.depth,
            layout.metadata,
            layout.created_at.to_rfc3339(),
            layout.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_planner_layouts(conn: &Connection) -> Result<Vec<PlannerLayout>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, room_size_width, room_size_height, room_size_depth, metadata, created_at, updated_at
         FROM planner_layouts ORDER BY updated_at DESC"
    )?;
    
    let layout_iter = stmt.query_map([], |row| {
        let room_size = RoomSize {
            width: row.get(2)?,
            height: row.get(3)?,
            depth: row.get(4)?,
        };
        
        let created_at_str: String = row.get(6)?;
        let updated_at_str: String = row.get(7)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        
        Ok(PlannerLayout {
            id: row.get(0)?,
            name: row.get(1)?,
            room_size,
            metadata: row.get(5)?,
            created_at,
            updated_at,
        })
    })?;
    
    let mut layouts = Vec::new();
    for layout in layout_iter {
        layouts.push(layout?);
    }
    Ok(layouts)
}

pub fn get_planner_layout_by_id(conn: &Connection, id: &str) -> Result<Option<PlannerLayout>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, room_size_width, room_size_height, room_size_depth, metadata, created_at, updated_at
         FROM planner_layouts WHERE id = ?"
    )?;
    
    let mut layout_iter = stmt.query_map([id], |row| {
        let room_size = RoomSize {
            width: row.get(2)?,
            height: row.get(3)?,
            depth: row.get(4)?,
        };
        
        let created_at_str: String = row.get(6)?;
        let updated_at_str: String = row.get(7)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        
        Ok(PlannerLayout {
            id: row.get(0)?,
            name: row.get(1)?,
            room_size,
            metadata: row.get(5)?,
            created_at,
            updated_at,
        })
    })?;
    
    Ok(layout_iter.next().transpose()?)
}

pub fn update_planner_layout(conn: &Connection, id: &str, layout: &UpdatePlannerLayoutRequest) -> Result<()> {
    let updated_at = Utc::now().to_rfc3339();
    
    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref name) = layout.name {
        set_clauses.push("name = ?");
        params.push(Box::new(name.clone()));
    }
    
    if let Some(ref room_size) = layout.room_size {
        set_clauses.push("room_size_width = ?");
        params.push(Box::new(room_size.width));
        set_clauses.push("room_size_height = ?");
        params.push(Box::new(room_size.height));
        set_clauses.push("room_size_depth = ?");
        params.push(Box::new(room_size.depth));
    }
    
    if let Some(ref metadata) = layout.metadata {
        set_clauses.push("metadata = ?");
        params.push(Box::new(metadata.clone()));
    }
    
    set_clauses.push("updated_at = ?");
    params.push(Box::new(updated_at));
    
    params.push(Box::new(id.to_string()));
    
    if !set_clauses.is_empty() {
        let sql = format!(
            "UPDATE planner_layouts SET {} WHERE id = ?",
            set_clauses.join(", ")
        );
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, rusqlite::params_from_iter(param_refs))?;
    }
    
    Ok(())
}

pub fn delete_planner_layout(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM planner_layouts WHERE id = ?", [id])?;
    Ok(())
}

// Planner Item operations
pub fn insert_planner_item(conn: &Connection, item: &PlannerItem) -> Result<()> {
    conn.execute(
        "INSERT INTO planner_items (id, layout_id, object_type, name, position_x, position_y, position_z, 
         size_width, size_height, size_depth, rotation, color, metadata, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            item.id,
            item.layout_id,
            item.object_type.to_string(),
            item.name,
            item.position.x,
            item.position.y,
            item.position.z,
            item.size.width,
            item.size.height,
            item.size.depth,
            item.rotation,
            item.color,
            item.metadata,
            item.created_at.to_rfc3339(),
            item.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_planner_items_by_layout_id(conn: &Connection, layout_id: &str) -> Result<Vec<PlannerItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, layout_id, object_type, name, position_x, position_y, position_z,
                size_width, size_height, size_depth, rotation, color, metadata, created_at, updated_at
         FROM planner_items WHERE layout_id = ? ORDER BY created_at"
    )?;
    
    let item_iter = stmt.query_map([layout_id], |row| {
        let object_type_str: String = row.get(2)?;
        let object_type = match object_type_str.as_str() {
            "table" => ObjectType::Table,
            "chair" => ObjectType::Chair,
            "bar" => ObjectType::Bar,
            "kitchen" => ObjectType::Kitchen,
            "bathroom" => ObjectType::Bathroom,
            "entrance" => ObjectType::Entrance,
            "wall" => ObjectType::Wall,
            "decoration" => ObjectType::Decoration,
            "test" => ObjectType::Test,
            _ => ObjectType::Table, // Default fallback
        };
        
        let position = Position {
            x: row.get(4)?,
            y: row.get(5)?,
            z: row.get(6)?,
        };
        
        let size = Size {
            width: row.get(7)?,
            height: row.get(8)?,
            depth: row.get(9)?,
        };
        
        let created_at_str: String = row.get(13)?;
        let updated_at_str: String = row.get(14)?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .unwrap_or_else(|_| Utc::now().into())
            .with_timezone(&Utc);
        
        Ok(PlannerItem {
            id: row.get(0)?,
            layout_id: row.get(1)?,
            object_type,
            name: row.get(3)?,
            position,
            size,
            rotation: row.get(10)?,
            color: row.get(11)?,
            metadata: row.get(12)?,
            created_at,
            updated_at,
        })
    })?;
    
    let mut items = Vec::new();
    for item in item_iter {
        items.push(item?);
    }
    Ok(items)
}

pub fn update_planner_item(conn: &Connection, id: &str, item: &UpdatePlannerItemRequest) -> Result<()> {
    let updated_at = Utc::now().to_rfc3339();
    
    let mut set_clauses = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref name) = item.name {
        set_clauses.push("name = ?");
        params.push(Box::new(name.clone()));
    }
    
    if let Some(ref position) = item.position {
        set_clauses.push("position_x = ?");
        params.push(Box::new(position.x));
        set_clauses.push("position_y = ?");
        params.push(Box::new(position.y));
        set_clauses.push("position_z = ?");
        params.push(Box::new(position.z));
    }
    
    if let Some(ref size) = item.size {
        set_clauses.push("size_width = ?");
        params.push(Box::new(size.width));
        set_clauses.push("size_height = ?");
        params.push(Box::new(size.height));
        set_clauses.push("size_depth = ?");
        params.push(Box::new(size.depth));
    }
    
    if let Some(rotation) = item.rotation {
        set_clauses.push("rotation = ?");
        params.push(Box::new(rotation));
    }
    
    if let Some(ref color) = item.color {
        set_clauses.push("color = ?");
        params.push(Box::new(color.clone()));
    }
    
    if let Some(ref metadata) = item.metadata {
        set_clauses.push("metadata = ?");
        params.push(Box::new(metadata.clone()));
    }
    

    
    set_clauses.push("updated_at = ?");
    params.push(Box::new(updated_at));
    
    params.push(Box::new(id.to_string()));
    
    if !set_clauses.is_empty() {
        let sql = format!(
            "UPDATE planner_items SET {} WHERE id = ?",
            set_clauses.join(", ")
        );
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, rusqlite::params_from_iter(param_refs))?;
    }
    
    Ok(())
}

pub fn delete_planner_item(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM planner_items WHERE id = ?", [id])?;
    Ok(())
}

// Catalog Item operations
pub fn get_all_catalog_items(conn: &Connection) -> Result<Vec<CatalogItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, object_type, name, icon, size_width, size_height, size_depth, color, category, description, created_at, updated_at
         FROM planner_catalog_items ORDER BY category, name"
    )?;
    
    let item_iter = stmt.query_map([], |row| {
        let object_type_str: String = row.get(1)?;
        let object_type = match object_type_str.as_str() {
            "table" => ObjectType::Table,
            "chair" => ObjectType::Chair,
            "bar" => ObjectType::Bar,
            "kitchen" => ObjectType::Kitchen,
            "bathroom" => ObjectType::Bathroom,
            "entrance" => ObjectType::Entrance,
            "wall" => ObjectType::Wall,
            "decoration" => ObjectType::Decoration,
            "test" => ObjectType::Test,
            _ => ObjectType::Table, // Default fallback
        };
        
        let size = Size {
            width: row.get(4)?,
            height: row.get(5)?,
            depth: row.get(6)?,
        };
        
        Ok(CatalogItem {
            id: row.get(0)?,
            object_type,
            name: row.get(2)?,
            icon: row.get(3)?,
            size,
            color: row.get(7)?,
            category: row.get(8)?,
            description: row.get(9)?,
        })
    })?;
    
    let mut items = Vec::new();
    for item in item_iter {
        items.push(item?);
    }
    Ok(items)
}

pub fn insert_catalog_item(conn: &Connection, item: &CatalogItem) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    
    conn.execute(
        "INSERT INTO planner_catalog_items (id, object_type, name, icon, size_width, size_height, size_depth, color, category, description, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            id,
            item.object_type.to_string(),
            item.name,
            item.icon,
            item.size.width,
            item.size.height,
            item.size.depth,
            item.color,
            item.category,
            item.description,
            now,
            now,
        ],
    )?;
    Ok(())
}

// Utility function to get layout with all its items
pub fn get_planner_layout_with_items(conn: &Connection, layout_id: &str) -> Result<Option<PlannerLayoutWithItems>> {
    if let Some(layout) = get_planner_layout_by_id(conn, layout_id)? {
        let items = get_planner_items_by_layout_id(conn, layout_id)?;
        Ok(Some(PlannerLayoutWithItems { layout, items }))
    } else {
        Ok(None)
    }
}

// ===== ORDERS MODULE DATABASE FUNCTIONS =====

pub fn init_orders_table(conn: &Connection) -> Result<()> {
    // Créer la table seulement si elle n'existe pas
    conn.execute(
        "CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            table_id TEXT NOT NULL,
            table_name TEXT NOT NULL,
            items TEXT NOT NULL, -- JSON des items
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            is_deleted BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Créer les index seulement s'ils n'existent pas
    conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)", [])?;

    // Migration pour ajouter le champ is_deleted s'il n'existe pas
    migrate_orders_table(&conn)?;

    info!("Orders table initialized successfully");
    Ok(())
}

fn migrate_orders_table(conn: &Connection) -> Result<()> {
    // Vérifier si la colonne is_deleted existe
    let mut table_info = conn.prepare("PRAGMA table_info(orders)")?;
    let columns: Vec<String> = table_info.query_map([], |row| {
        Ok(row.get::<_, String>(1)?)
    })?.filter_map(|r| r.ok()).collect();
    
    if !columns.contains(&"is_deleted".to_string()) {
        info!("Adding is_deleted column to orders table");
        conn.execute("ALTER TABLE orders ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0", [])?;
    }
    
    Ok(())
}

pub fn generate_order_number(conn: &Connection) -> Result<String> {
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM orders", [], |row| row.get(0))?;
    let today = Utc::now().format("%Y%m%d").to_string();
    Ok(format!("{}{:04}", today, count + 1))
}

pub fn insert_order(conn: &Connection, order: &Order) -> Result<()> {
    let items_json = serde_json::to_string(&order.items)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    
    conn.execute(
        "INSERT INTO orders (id, order_number, table_id, table_name, items, total_amount, status, is_deleted, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            order.id,
            order.order_number,
            order.table_id,
            order.table_name,
            items_json,
            order.total_amount,
            order.status,
            order.is_deleted,
            order.created_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_orders(conn: &Connection) -> Result<Vec<Order>> {
    let mut stmt = conn.prepare(
        "SELECT id, order_number, table_id, table_name, items, total_amount, status, is_deleted, created_at
         FROM orders WHERE is_deleted = 0 ORDER BY created_at DESC"
    )?;
    
    let order_iter = stmt.query_map([], |row| {
        let items_json: String = row.get(4)?;
        let items: Vec<OrderItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(8)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(Order {
            id: row.get(0)?,
            order_number: row.get(1)?,
            table_id: row.get(2)?,
            table_name: row.get(3)?,
            items,
            total_amount: row.get(5)?,
            status: row.get(6)?,
            is_deleted: row.get(7)?,
            created_at,
        })
    })?;
    
    let mut orders = Vec::new();
    for order in order_iter {
        orders.push(order?);
    }
    Ok(orders)
}

pub fn get_orders_by_status(conn: &Connection, status: &str) -> Result<Vec<Order>> {
    let mut stmt = conn.prepare(
        "SELECT id, order_number, table_id, table_name, items, total_amount, status, is_deleted, created_at
         FROM orders WHERE status = ? AND is_deleted = 0 ORDER BY created_at DESC"
    )?;
    
    let order_iter = stmt.query_map([status], |row| {
        let items_json: String = row.get(4)?;
        let items: Vec<OrderItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(8)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(Order {
            id: row.get(0)?,
            order_number: row.get(1)?,
            table_id: row.get(2)?,
            table_name: row.get(3)?,
            items,
            total_amount: row.get(5)?,
            status: row.get(6)?,
            is_deleted: row.get(7)?,
            created_at,
        })
    })?;
    
    let mut orders = Vec::new();
    for order in order_iter {
        orders.push(order?);
    }
    Ok(orders)
}

pub fn update_order_status(conn: &Connection, order_id: &str, status: &str) -> Result<()> {
    conn.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        params![status, order_id],
    )?;
    Ok(())
}

pub fn delete_order(conn: &Connection, order_id: &str) -> Result<()> {
    conn.execute("DELETE FROM orders WHERE id = ?", [order_id])?;
    Ok(())
}

pub fn get_order_by_table_id(conn: &Connection, table_id: &str) -> Result<Option<Order>> {
    let mut stmt = conn.prepare(
        "SELECT id, order_number, table_id, table_name, items, total_amount, status, is_deleted, created_at
         FROM orders WHERE table_id = ? AND status IN ('pending', 'in_kitchen') AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1"
    )?;
    
    let mut order_iter = stmt.query_map([table_id], |row| {
        let items_json: String = row.get(4)?;
        let items: Vec<OrderItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(8)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(Order {
            id: row.get(0)?,
            order_number: row.get(1)?,
            table_id: row.get(2)?,
            table_name: row.get(3)?,
            items,
            total_amount: row.get(5)?,
            status: row.get(6)?,
            is_deleted: row.get(7)?,
            created_at,
        })
    })?;
    
    Ok(order_iter.next().transpose()?)
}

pub fn update_order_items(conn: &Connection, order_id: &str, items: &[OrderItem]) -> Result<()> {
    let items_json = serde_json::to_string(items)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    
    let total_amount: f64 = items.iter().map(|item| item.total_price).sum();
    
    conn.execute(
        "UPDATE orders SET items = ?, total_amount = ? WHERE id = ?",
        params![items_json, total_amount, order_id],
    )?;
    Ok(())
}

// ===== LOGS MODULE DATABASE FUNCTIONS =====

pub fn init_logs_database(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            log_type TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL,
            table_id TEXT,
            table_name TEXT,
            product_id TEXT,
            product_name TEXT,
            user_id TEXT,
            user_name TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    info!("Logs database initialized successfully");
    Ok(())
}

pub fn insert_log_entry(conn: &Connection, log: &LogEntry) -> Result<()> {
    conn.execute(
        "INSERT INTO logs (id, log_type, category, title, description, amount, table_id, table_name, 
         product_id, product_name, user_id, user_name, metadata, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            log.id,
            log.log_type.to_string(),
            log.category.to_string(),
            log.title,
            log.description,
            log.amount,
            log.table_id,
            log.table_name,
            log.product_id,
            log.product_name,
            log.user_id,
            log.user_name,
            log.metadata,
            log.created_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_logs(conn: &Connection, limit: Option<i32>) -> Result<Vec<LogEntry>> {
    let mut logs = Vec::new();
    
    if let Some(limit_val) = limit {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
             product_id, product_name, user_id, user_name, metadata, created_at
             FROM logs ORDER BY created_at DESC LIMIT ?"
        )?;
        
        let log_iter = stmt.query_map([limit_val], |row| parse_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
             product_id, product_name, user_id, user_name, metadata, created_at
             FROM logs ORDER BY created_at DESC"
        )?;
        
        let log_iter = stmt.query_map([], |row| parse_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    }
    
    Ok(logs)
}

pub fn get_logs_with_filter(conn: &Connection, filter: &LogFilter, limit: Option<i32>) -> Result<Vec<LogEntry>> {
    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref log_type) = filter.log_type {
        conditions.push("log_type = ?");
        params.push(Box::new(log_type.to_string()));
    }
    
    if let Some(ref category) = filter.category {
        conditions.push("category = ?");
        params.push(Box::new(category.to_string()));
    }
    
    if let Some(ref table_id) = filter.table_id {
        conditions.push("table_id = ?");
        params.push(Box::new(table_id.clone()));
    }
    
    if let Some(ref product_id) = filter.product_id {
        conditions.push("product_id = ?");
        params.push(Box::new(product_id.clone()));
    }
    
    if let Some(ref user_id) = filter.user_id {
        conditions.push("user_id = ?");
        params.push(Box::new(user_id.clone()));
    }
    
    if let Some(ref start_date) = filter.start_date {
        conditions.push("created_at >= ?");
        params.push(Box::new(start_date.to_rfc3339()));
    }
    
    if let Some(ref end_date) = filter.end_date {
        conditions.push("created_at <= ?");
        params.push(Box::new(end_date.to_rfc3339()));
    }
    
    if let Some(min_amount) = filter.min_amount {
        conditions.push("amount >= ?");
        params.push(Box::new(min_amount));
    }
    
    if let Some(max_amount) = filter.max_amount {
        conditions.push("amount <= ?");
        params.push(Box::new(max_amount));
    }
    
    let where_clause = if conditions.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };
    
    let limit_clause = if let Some(limit_val) = limit {
        format!(" LIMIT {}", limit_val)
    } else {
        "".to_string()
    };
    
    let sql = format!(
        "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
         product_id, product_name, user_id, user_name, metadata, created_at
         FROM logs {} ORDER BY created_at DESC{}",
        where_clause, limit_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    let log_iter = stmt.query_map(rusqlite::params_from_iter(param_refs), |row| parse_log_entry(row))?;
    
    let mut logs = Vec::new();
    for log in log_iter {
        logs.push(log?);
    }
    Ok(logs)
}

pub fn get_financial_logs(conn: &Connection, start_date: Option<DateTime<Utc>>, end_date: Option<DateTime<Utc>>) -> Result<Vec<LogEntry>> {
    let mut conditions = vec!["log_type = 'financial'".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref start_date) = start_date {
        conditions.push("created_at >= ?".to_string());
        params.push(Box::new(start_date.to_rfc3339()));
    }
    
    if let Some(ref end_date) = end_date {
        conditions.push("created_at <= ?".to_string());
        params.push(Box::new(end_date.to_rfc3339()));
    }
    
    let where_clause = format!("WHERE {}", conditions.join(" AND "));
    
    let sql = format!(
        "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
         product_id, product_name, user_id, user_name, metadata, created_at
         FROM logs {} ORDER BY created_at DESC",
        where_clause
    );
    
    let mut stmt = conn.prepare(&sql)?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    let log_iter = stmt.query_map(rusqlite::params_from_iter(param_refs), |row| parse_log_entry(row))?;
    
    let mut logs = Vec::new();
    for log in log_iter {
        logs.push(log?);
    }
    Ok(logs)
}

pub fn get_logs_by_category(conn: &Connection, category: &LogCategory, limit: Option<i32>) -> Result<Vec<LogEntry>> {
    let mut logs = Vec::new();
    
    if let Some(limit_val) = limit {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
             product_id, product_name, user_id, user_name, metadata, created_at
             FROM logs WHERE category = ? ORDER BY created_at DESC LIMIT ?"
        )?;
        
        let log_iter = stmt.query_map(params![category.to_string(), limit_val], |row| parse_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, table_id, table_name, 
             product_id, product_name, user_id, user_name, metadata, created_at
             FROM logs WHERE category = ? ORDER BY created_at DESC"
        )?;
        
        let log_iter = stmt.query_map(params![category.to_string()], |row| parse_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    }
    
    Ok(logs)
}

pub fn delete_old_logs(conn: &Connection, days_to_keep: i32) -> Result<usize> {
    let cutoff_date = Utc::now() - chrono::Duration::days(days_to_keep as i64);
    let result = conn.execute(
        "DELETE FROM logs WHERE created_at < ?",
        params![cutoff_date.to_rfc3339()],
    )?;
    Ok(result)
}

pub fn get_logs_count(conn: &Connection) -> Result<i32> {
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM logs", [], |row| row.get(0))?;
    Ok(count)
}

fn parse_log_entry(row: &rusqlite::Row) -> Result<LogEntry> {
    let log_type_str: String = row.get(1)?;
    let log_type = match log_type_str.as_str() {
        "financial" => LogType::Financial,
        "system" => LogType::System,
        "user" => LogType::User,
        "error" => LogType::Error,
        "warning" => LogType::Warning,
        "info" => LogType::Info,
        _ => LogType::Info, // Default fallback
    };
    
    let category_str: String = row.get(2)?;
    let category = match category_str.as_str() {
        "sale" => LogCategory::Sale,
        "refund" => LogCategory::Refund,
        "table_status" => LogCategory::TableStatus,
        "product" => LogCategory::Product,
        "category" => LogCategory::Category,
        "user" => LogCategory::User,
        "system" => LogCategory::System,
        "error" => LogCategory::Error,
        "other" => LogCategory::Other,
        _ => LogCategory::Other, // Default fallback
    };
    
    let created_at_str: String = row.get(13)?;
    let created_at = DateTime::parse_from_rfc3339(&created_at_str)
        .unwrap_or_else(|_| Utc::now().into())
        .with_timezone(&Utc);
    
    Ok(LogEntry {
        id: row.get(0)?,
        log_type,
        category,
        title: row.get(3)?,
        description: row.get(4)?,
        amount: row.get(5)?,
        table_id: row.get(6)?,
        table_name: row.get(7)?,
        product_id: row.get(8)?,
        product_name: row.get(9)?,
        user_id: row.get(10)?,
        user_name: row.get(11)?,
        metadata: row.get(12)?,
        created_at,
    })
}

// ===== SECURITY & AUDIT DATABASE FUNCTIONS =====

pub fn init_security_database(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    // Table pour les logs sécurisés
    conn.execute(
        "CREATE TABLE IF NOT EXISTS secure_logs (
            id TEXT PRIMARY KEY,
            log_type TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL,
            previous_hash TEXT,
            current_hash TEXT NOT NULL,
            app_clock INTEGER NOT NULL,
            system_clock INTEGER NOT NULL,
            session_id TEXT NOT NULL,
            user_signature TEXT NOT NULL,
            chain_index INTEGER NOT NULL,
            table_id TEXT,
            table_name TEXT,
            product_id TEXT,
            product_name TEXT,
            user_id TEXT,
            user_name TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            secure_timestamp TEXT NOT NULL
        )",
        [],
    )?;

    // Table pour l'horloge interne
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_clocks (
            session_id TEXT PRIMARY KEY,
            start_time INTEGER NOT NULL,
            total_usage_time INTEGER NOT NULL,
            last_activity INTEGER NOT NULL,
            system_start_time INTEGER NOT NULL,
            clock_signature TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Table pour les anomalies
    conn.execute(
        "CREATE TABLE IF NOT EXISTS anomalies (
            id TEXT PRIMARY KEY,
            anomaly_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            evidence TEXT NOT NULL,
            recommendations TEXT NOT NULL,
            resolved BOOLEAN NOT NULL DEFAULT 0,
            resolved_at TEXT,
            resolved_by TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Table pour les rapports de conformité
    conn.execute(
        "CREATE TABLE IF NOT EXISTS compliance_reports (
            id TEXT PRIMARY KEY,
            period_start TEXT NOT NULL,
            period_end TEXT NOT NULL,
            country_code TEXT NOT NULL,
            total_transactions INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            anomalies_count INTEGER NOT NULL,
            chain_integrity BOOLEAN NOT NULL,
            time_consistency BOOLEAN NOT NULL,
            generated_at TEXT NOT NULL,
            report_signature TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Table pour la configuration de sécurité
    conn.execute(
        "CREATE TABLE IF NOT EXISTS security_config (
            id TEXT PRIMARY KEY,
            enable_chain_validation BOOLEAN NOT NULL DEFAULT 1,
            enable_time_validation BOOLEAN NOT NULL DEFAULT 1,
            enable_anomaly_detection BOOLEAN NOT NULL DEFAULT 1,
            max_time_drift INTEGER NOT NULL DEFAULT 300,
            min_transaction_interval INTEGER NOT NULL DEFAULT 1000,
            suspicious_amount_threshold REAL NOT NULL DEFAULT 1000.0,
            compliance_country TEXT NOT NULL DEFAULT 'FR',
            retention_period INTEGER NOT NULL DEFAULT 2190,
            enable_real_time_monitoring BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    info!("Security database initialized successfully");
    Ok(())
}

pub fn insert_secure_log_entry(conn: &Connection, log: &SecureLogEntry) -> Result<()> {
    conn.execute(
        "INSERT INTO secure_logs (
            id, log_type, category, title, description, amount, previous_hash, current_hash,
            app_clock, system_clock, session_id, user_signature, chain_index,
            table_id, table_name, product_id, product_name, user_id, user_name, metadata,
            created_at, secure_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            log.id,
            log.log_type.to_string(),
            log.category.to_string(),
            log.title,
            log.description,
            log.amount,
            log.previous_hash,
            log.current_hash,
            log.app_clock,
            log.system_clock,
            log.session_id,
            log.user_signature,
            log.chain_index,
            log.table_id,
            log.table_name,
            log.product_id,
            log.product_name,
            log.user_id,
            log.user_name,
            log.metadata,
            log.created_at.to_rfc3339(),
            log.secure_timestamp,
        ],
    )?;
    Ok(())
}

pub fn get_secure_logs(conn: &Connection, limit: Option<i32>) -> Result<Vec<SecureLogEntry>> {
    let mut logs = Vec::new();
    
    if let Some(limit_val) = limit {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, previous_hash, current_hash,
             app_clock, system_clock, session_id, user_signature, chain_index,
             table_id, table_name, product_id, product_name, user_id, user_name, metadata,
             created_at, secure_timestamp
             FROM secure_logs ORDER BY chain_index ASC LIMIT ?"
        )?;
        
        let log_iter = stmt.query_map([limit_val], |row| parse_secure_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, log_type, category, title, description, amount, previous_hash, current_hash,
             app_clock, system_clock, session_id, user_signature, chain_index,
             table_id, table_name, product_id, product_name, user_id, user_name, metadata,
             created_at, secure_timestamp
             FROM secure_logs ORDER BY chain_index ASC"
        )?;
        
        let log_iter = stmt.query_map([], |row| parse_secure_log_entry(row))?;
        for log in log_iter {
            logs.push(log?);
        }
    }
    
    Ok(logs)
}

pub fn get_last_secure_log(conn: &Connection) -> Result<Option<SecureLogEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_type, category, title, description, amount, previous_hash, current_hash,
         app_clock, system_clock, session_id, user_signature, chain_index,
         table_id, table_name, product_id, product_name, user_id, user_name, metadata,
         created_at, secure_timestamp
         FROM secure_logs ORDER BY chain_index DESC LIMIT 1"
    )?;
    
    let mut log_iter = stmt.query_map([], |row| parse_secure_log_entry(row))?;
    Ok(log_iter.next().transpose()?)
}

pub fn get_next_chain_index(conn: &Connection) -> Result<i64> {
    let index: i64 = conn.query_row(
        "SELECT COALESCE(MAX(chain_index), 0) + 1 FROM secure_logs",
        [],
        |row| row.get(0)
    )?;
    Ok(index)
}

pub fn save_app_clock(conn: &Connection, clock: &AppClock) -> Result<()> {
    let now = Utc::now();
    conn.execute(
        "INSERT OR REPLACE INTO app_clocks (
            session_id, start_time, total_usage_time, last_activity, system_start_time,
            clock_signature, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            clock.session_id,
            clock.start_time,
            clock.total_usage_time,
            clock.last_activity,
            clock.system_start_time,
            clock.clock_signature,
            now.to_rfc3339(),
            now.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_app_clock(conn: &Connection, session_id: &str) -> Result<Option<AppClock>> {
    let mut stmt = conn.prepare(
        "SELECT session_id, start_time, total_usage_time, last_activity, system_start_time, clock_signature
         FROM app_clocks WHERE session_id = ?"
    )?;
    
    let mut clock_iter = stmt.query_map([session_id], |row| parse_app_clock(row))?;
    Ok(clock_iter.next().transpose()?)
}

pub fn insert_anomaly(conn: &Connection, anomaly: &Anomaly) -> Result<()> {
    let recommendations_json = serde_json::to_string(&anomaly.recommendations)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
    
    conn.execute(
        "INSERT INTO anomalies (
            id, anomaly_type, severity, description, timestamp, evidence, recommendations,
            resolved, resolved_at, resolved_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            anomaly.id,
            anomaly.anomaly_type.to_string(),
            anomaly.severity.to_string(),
            anomaly.description,
            anomaly.timestamp.to_rfc3339(),
            anomaly.evidence,
            recommendations_json,
            anomaly.resolved,
            anomaly.resolved_at.map(|t| t.to_rfc3339()),
            anomaly.resolved_by,
            anomaly.timestamp.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_anomalies(conn: &Connection, limit: Option<i32>) -> Result<Vec<Anomaly>> {
    let mut anomalies = Vec::new();
    
    if let Some(limit_val) = limit {
        let mut stmt = conn.prepare(
            "SELECT id, anomaly_type, severity, description, timestamp, evidence, recommendations,
             resolved, resolved_at, resolved_by, created_at
             FROM anomalies ORDER BY timestamp DESC LIMIT ?"
        )?;
        
        let anomaly_iter = stmt.query_map([limit_val], |row| parse_anomaly(row))?;
        for anomaly in anomaly_iter {
            anomalies.push(anomaly?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, anomaly_type, severity, description, timestamp, evidence, recommendations,
             resolved, resolved_at, resolved_by, created_at
             FROM anomalies ORDER BY timestamp DESC"
        )?;
        
        let anomaly_iter = stmt.query_map([], |row| parse_anomaly(row))?;
        for anomaly in anomaly_iter {
            anomalies.push(anomaly?);
        }
    }
    
    Ok(anomalies)
}

pub fn get_unresolved_anomalies(conn: &Connection) -> Result<Vec<Anomaly>> {
    let mut stmt = conn.prepare(
        "SELECT id, anomaly_type, severity, description, timestamp, evidence, recommendations,
         resolved, resolved_at, resolved_by, created_at
         FROM anomalies WHERE resolved = 0 ORDER BY timestamp DESC"
    )?;
    
    let anomaly_iter = stmt.query_map([], |row| parse_anomaly(row))?;
    let mut anomalies = Vec::new();
    for anomaly in anomaly_iter {
        anomalies.push(anomaly?);
    }
    
    Ok(anomalies)
}

pub fn resolve_anomaly(conn: &Connection, anomaly_id: &str, resolved_by: &str) -> Result<()> {
    let now = Utc::now();
    conn.execute(
        "UPDATE anomalies SET resolved = 1, resolved_at = ?, resolved_by = ? WHERE id = ?",
        params![now.to_rfc3339(), resolved_by, anomaly_id],
    )?;
    Ok(())
}

pub fn save_compliance_report(conn: &Connection, report: &ComplianceReport) -> Result<()> {
    conn.execute(
        "INSERT INTO compliance_reports (
            id, period_start, period_end, country_code, total_transactions, total_amount,
            anomalies_count, chain_integrity, time_consistency, generated_at, report_signature, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            report.id,
            report.period_start.to_rfc3339(),
            report.period_end.to_rfc3339(),
            report.country_code,
            report.total_transactions,
            report.total_amount,
            report.anomalies_count,
            report.chain_integrity,
            report.time_consistency,
            report.generated_at.to_rfc3339(),
            report.report_signature,
            report.generated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_security_config(conn: &Connection) -> Result<Option<SecurityConfig>> {
    let mut stmt = conn.prepare(
        "SELECT enable_chain_validation, enable_time_validation, enable_anomaly_detection,
         max_time_drift, min_transaction_interval, suspicious_amount_threshold,
         compliance_country, retention_period, enable_real_time_monitoring
         FROM security_config LIMIT 1"
    )?;
    
    let mut config_iter = stmt.query_map([], |row| parse_security_config(row))?;
    Ok(config_iter.next().transpose()?)
}

pub fn save_security_config(conn: &Connection, config: &SecurityConfig) -> Result<()> {
    let now = Utc::now();
    conn.execute(
        "INSERT OR REPLACE INTO security_config (
            id, enable_chain_validation, enable_time_validation, enable_anomaly_detection,
            max_time_drift, min_transaction_interval, suspicious_amount_threshold,
            compliance_country, retention_period, enable_real_time_monitoring, created_at, updated_at
        ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            config.enable_chain_validation,
            config.enable_time_validation,
            config.enable_anomaly_detection,
            config.max_time_drift,
            config.min_transaction_interval,
            config.suspicious_amount_threshold,
            config.compliance_country,
            config.retention_period,
            config.enable_real_time_monitoring,
            now.to_rfc3339(),
            now.to_rfc3339(),
        ],
    )?;
    Ok(())
}

// Fonctions de parsing
fn parse_secure_log_entry(row: &rusqlite::Row) -> Result<SecureLogEntry> {
    let log_type_str: String = row.get(1)?;
    let log_type = match log_type_str.as_str() {
        "Financial" => LogType::Financial,
        "System" => LogType::System,
        "User" => LogType::User,
        "Error" => LogType::Error,
        "Warning" => LogType::Warning,
        "Info" => LogType::Info,
        _ => LogType::Info,
    };
    
    let category_str: String = row.get(2)?;
    let category = match category_str.as_str() {
        "Sale" => LogCategory::Sale,
        "Refund" => LogCategory::Refund,
        "TableStatus" => LogCategory::TableStatus,
        "Product" => LogCategory::Product,
        "Category" => LogCategory::Category,
        "User" => LogCategory::User,
        "System" => LogCategory::System,
        "Error" => LogCategory::Error,
        "Other" => LogCategory::Other,
        _ => LogCategory::Other,
    };
    
    let created_at_str: String = row.get(20)?;
    let created_at = DateTime::parse_from_rfc3339(&created_at_str)
        .unwrap_or_else(|_| Utc::now().into())
        .with_timezone(&Utc);
    
    Ok(SecureLogEntry {
        id: row.get(0)?,
        log_type,
        category,
        title: row.get(3)?,
        description: row.get(4)?,
        amount: row.get(5)?,
        previous_hash: row.get(6)?,
        current_hash: row.get(7)?,
        app_clock: row.get(8)?,
        system_clock: row.get(9)?,
        session_id: row.get(10)?,
        user_signature: row.get(11)?,
        chain_index: row.get(12)?,
        table_id: row.get(13)?,
        table_name: row.get(14)?,
        product_id: row.get(15)?,
        product_name: row.get(16)?,
        user_id: row.get(17)?,
        user_name: row.get(18)?,
        metadata: row.get(19)?,
        created_at,
        secure_timestamp: row.get(21)?,
    })
}

fn parse_app_clock(row: &rusqlite::Row) -> Result<AppClock> {
    Ok(AppClock {
        session_id: row.get(0)?,
        start_time: row.get(1)?,
        total_usage_time: row.get(2)?,
        last_activity: row.get(3)?,
        system_start_time: row.get(4)?,
        clock_signature: row.get(5)?,
    })
}

fn parse_anomaly(row: &rusqlite::Row) -> Result<Anomaly> {
    let anomaly_type_str: String = row.get(1)?;
    let anomaly_type = match anomaly_type_str.as_str() {
        "time_drift" => AnomalyType::TimeDrift,
        "missing_transaction" => AnomalyType::MissingTransaction,
        "chain_break" => AnomalyType::ChainBreak,
        "suspicious_amount" => AnomalyType::SuspiciousAmount,
        "rapid_transactions" => AnomalyType::RapidTransactions,
        "user_anomaly" => AnomalyType::UserAnomaly,
        "system_tampering" => AnomalyType::SystemTampering,
        "clock_manipulation" => AnomalyType::ClockManipulation,
        _ => AnomalyType::SystemTampering,
    };
    
    let severity_str: String = row.get(2)?;
    let severity = match severity_str.as_str() {
        "low" => AnomalySeverity::Low,
        "medium" => AnomalySeverity::Medium,
        "high" => AnomalySeverity::High,
        "critical" => AnomalySeverity::Critical,
        _ => AnomalySeverity::Medium,
    };
    
    let timestamp_str: String = row.get(4)?;
    let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
        .unwrap_or_else(|_| Utc::now().into())
        .with_timezone(&Utc);
    
    let recommendations_str: String = row.get(6)?;
    let recommendations: Vec<String> = serde_json::from_str(&recommendations_str)
        .unwrap_or_else(|_| vec![]);
    
    let resolved_at_str: Option<String> = row.get(9)?;
    let resolved_at = resolved_at_str
        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Utc));
    
    Ok(Anomaly {
        id: row.get(0)?,
        anomaly_type,
        severity,
        description: row.get(3)?,
        timestamp,
        evidence: row.get(5)?,
        recommendations,
        resolved: row.get(7)?,
        resolved_at,
        resolved_by: row.get(10)?,
    })
}

fn parse_security_config(row: &rusqlite::Row) -> Result<SecurityConfig> {
    Ok(SecurityConfig {
        enable_chain_validation: row.get(0)?,
        enable_time_validation: row.get(1)?,
        enable_anomaly_detection: row.get(2)?,
        max_time_drift: row.get(3)?,
        min_transaction_interval: row.get(4)?,
        suspicious_amount_threshold: row.get(5)?,
        compliance_country: row.get(6)?,
        retention_period: row.get(7)?,
        enable_real_time_monitoring: row.get(8)?,
    })
}

// ===== FONCTIONS CORBEILLE =====

pub fn get_trash_orders(conn: &Connection) -> Result<Vec<Order>> {
    let mut stmt = conn.prepare(
        "SELECT id, order_number, table_id, table_name, items, total_amount, status, is_deleted, created_at
         FROM orders WHERE is_deleted = 1 ORDER BY created_at DESC"
    )?;
    
    let order_iter = stmt.query_map([], |row| {
        let items_json: String = row.get(4)?;
        let items: Vec<OrderItem> = serde_json::from_str(&items_json)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid JSON".to_string()))?;
        
        let created_at_str: String = row.get(8)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_| rusqlite::Error::InvalidParameterName("Invalid date".to_string()))?
            .with_timezone(&Utc);
        
        Ok(Order {
            id: row.get(0)?,
            order_number: row.get(1)?,
            table_id: row.get(2)?,
            table_name: row.get(3)?,
            items,
            total_amount: row.get(5)?,
            status: row.get(6)?,
            is_deleted: row.get(7)?,
            created_at,
        })
    })?;
    
    let mut orders = Vec::new();
    for order in order_iter {
        orders.push(order?);
    }
    Ok(orders)
}

pub fn move_order_to_trash(conn: &Connection, order_id: &str) -> Result<()> {
    conn.execute(
        "UPDATE orders SET is_deleted = 1 WHERE id = ?",
        params![order_id],
    )?;
    Ok(())
}

pub fn restore_order_from_trash(conn: &Connection, order_id: &str) -> Result<()> {
    conn.execute(
        "UPDATE orders SET is_deleted = 0 WHERE id = ?",
        params![order_id],
    )?;
    Ok(())
}

pub fn delete_order_permanently(conn: &Connection, order_id: &str) -> Result<()> {
    conn.execute("DELETE FROM orders WHERE id = ?", [order_id])?;
    Ok(())
}

pub fn clear_trash(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM orders WHERE is_deleted = 1", [])?;
    Ok(())
}

// ===== PRINTER CONFIGURATION DATABASE =====

pub fn init_printer_config_database(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;
    
    // Create printer configuration table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS printer_configs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            port TEXT,
            driver TEXT,
            status TEXT DEFAULT 'active',
            is_default BOOLEAN DEFAULT 0,
            paper_sizes TEXT, -- JSON array of supported paper sizes
            capabilities TEXT, -- JSON object of printer capabilities
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Create printer usage logs table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS printer_logs (
            id TEXT PRIMARY KEY,
            printer_id TEXT NOT NULL,
            printer_name TEXT NOT NULL,
            action TEXT NOT NULL, -- 'print', 'test', 'status_check'
            success BOOLEAN NOT NULL,
            error_message TEXT,
            metadata TEXT, -- JSON object with additional info
            created_at TEXT NOT NULL,
            FOREIGN KEY (printer_id) REFERENCES printer_configs (id)
        )",
        [],
    )?;

    Ok(())
}

// Printer configuration operations
pub fn save_printer_config(conn: &Connection, config: &PrinterConfig) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO printer_configs (id, name, port, driver, status, is_default, paper_sizes, capabilities, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            config.id,
            config.name,
            config.port,
            config.driver,
            config.status,
            config.is_default,
            serde_json::to_string(&config.paper_sizes).unwrap_or_default(),
            serde_json::to_string(&config.capabilities).unwrap_or_default(),
            config.created_at.to_rfc3339(),
            config.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}



pub fn get_default_printer_config(conn: &Connection) -> Result<Option<PrinterConfig>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, port, driver, status, is_default, paper_sizes, capabilities, created_at, updated_at
         FROM printer_configs WHERE is_default = 1 AND status = 'active' LIMIT 1"
    )?;
    
    let mut rows = stmt.query_map([], |row| {
        let paper_sizes_json: String = row.get(6)?;
        let paper_sizes: Vec<String> = serde_json::from_str(&paper_sizes_json).unwrap_or_default();
        
        let capabilities_json: String = row.get(7)?;
        let capabilities: PrinterCapabilities = serde_json::from_str(&capabilities_json).unwrap_or_default();
        
        let created_at_str: String = row.get(8)?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str).unwrap().with_timezone(&Utc);
        
        let updated_at_str: String = row.get(9)?;
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str).unwrap().with_timezone(&Utc);
        
        Ok(PrinterConfig {
            id: row.get(0)?,
            name: row.get(1)?,
            port: row.get(2)?,
            driver: row.get(3)?,
            status: row.get(4)?,
            is_default: row.get(5)?,
            paper_sizes,
            capabilities,
            created_at,
            updated_at,
        })
    })?;
    
    if let Some(row) = rows.next() {
        Ok(Some(row?))
        } else {
        Ok(None)
    }
}

pub fn log_printer_action(conn: &Connection, log: &PrinterLog) -> Result<()> {
    conn.execute(
        "INSERT INTO printer_logs (id, printer_id, printer_name, action, success, error_message, metadata, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            log.id,
            log.printer_id,
            log.printer_name,
            log.action,
            log.success,
            log.error_message,
            serde_json::to_string(&log.metadata).unwrap_or_default(),
            log.created_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

// ===== MASTER STOCKS DATABASE FUNCTIONS =====

pub fn get_masterstock_db_path() -> Result<std::path::PathBuf, String> {
    // Get the current executable path
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Could not get executable path: {}", e))?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().ok_or("Could not get parent directory")? // target/debug
        .parent().ok_or("Could not get parent directory")? // target
        .parent().ok_or("Could not get parent directory")? // src-tauri
        .parent().ok_or("Could not get parent directory")?; // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Could not create directory: {}", e))?;
    
    Ok(data_dir.join("masterstock.db"))
}

pub fn init_masterstock_database() -> Result<(), String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    // Create ingredients table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS ingredients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            current_stock REAL NOT NULL DEFAULT 0,
            min_stock REAL NOT NULL DEFAULT 0,
            max_stock REAL NOT NULL DEFAULT 0,
            cost_per_unit REAL NOT NULL DEFAULT 0,
            supplier_id TEXT,
            barcode TEXT,
            image_url TEXT,
            expiration_date TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create suppliers table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            payment_terms TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create invoices table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL,
            supplier_id TEXT NOT NULL,
            supplier_name TEXT NOT NULL,
            invoice_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            image_url TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create invoice_items table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            ingredient_id TEXT,
            ingredient_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            expiration_date TEXT,
            barcode TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id),
            FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create stock_movements table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_movements (
            id TEXT PRIMARY KEY,
            ingredient_id TEXT NOT NULL,
            movement_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            reason TEXT NOT NULL,
            reference_id TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create stock_alerts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_alerts (
            id TEXT PRIMARY KEY,
            ingredient_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ingredients_supplier ON ingredients(supplier_id)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ingredients_barcode ON ingredients(barcode)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_alerts_ingredient ON stock_alerts(ingredient_id)", []).map_err(|e| e.to_string())?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_stock_alerts_read ON stock_alerts(is_read)", []).map_err(|e| e.to_string())?;

    info!("MasterStocks database initialized successfully");
    Ok(())
}

// Ingredients functions
pub fn insert_ingredient(conn: &Connection, ingredient: &Ingredient) -> Result<()> {
    conn.execute(
        "INSERT INTO ingredients (id, name, description, category, unit, current_stock, min_stock, max_stock, cost_per_unit, supplier_id, barcode, image_url, expiration_date, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            ingredient.id,
            ingredient.name,
            ingredient.description,
            ingredient.category,
            ingredient.unit,
            ingredient.current_stock,
            ingredient.min_stock,
            ingredient.max_stock,
            ingredient.cost_per_unit,
            ingredient.supplier_id,
            ingredient.barcode,
            ingredient.image_url,
            ingredient.expiration_date.map(|d| d.to_rfc3339()),
            ingredient.is_active,
            ingredient.created_at.to_rfc3339(),
            ingredient.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_ingredients(conn: &Connection) -> Result<Vec<Ingredient>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, category, unit, current_stock, min_stock, max_stock, cost_per_unit, supplier_id, barcode, image_url, expiration_date, is_active, created_at, updated_at FROM ingredients ORDER BY name"
    )?;
    
    let ingredient_iter = stmt.query_map([], |row| {
        Ok(Ingredient {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            category: row.get(3)?,
            unit: row.get(4)?,
            current_stock: row.get(5)?,
            min_stock: row.get(6)?,
            max_stock: row.get(7)?,
            cost_per_unit: row.get(8)?,
            supplier_id: row.get(9)?,
            barcode: row.get(10)?,
            image_url: row.get(11)?,
            expiration_date: row.get::<_, Option<String>>(12)?
                .map(|s| DateTime::parse_from_rfc3339(&s).map(|dt| dt.with_timezone(&Utc)))
                .transpose()
                .map_err(|_e| rusqlite::Error::InvalidColumnType(12, "expiration_date".to_string(), rusqlite::types::Type::Text))?,
            is_active: row.get(13)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut ingredients = Vec::new();
    for ingredient in ingredient_iter {
        ingredients.push(ingredient?);
    }
    Ok(ingredients)
}

pub fn get_ingredient_by_id(conn: &Connection, id: &str) -> Result<Option<Ingredient>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, category, unit, current_stock, min_stock, max_stock, cost_per_unit, supplier_id, barcode, image_url, expiration_date, is_active, created_at, updated_at FROM ingredients WHERE id = ?"
    )?;
    
    let mut rows = stmt.query_map([id], |row| {
        Ok(Ingredient {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            category: row.get(3)?,
            unit: row.get(4)?,
            current_stock: row.get(5)?,
            min_stock: row.get(6)?,
            max_stock: row.get(7)?,
            cost_per_unit: row.get(8)?,
            supplier_id: row.get(9)?,
            barcode: row.get(10)?,
            image_url: row.get(11)?,
            expiration_date: row.get::<_, Option<String>>(12)?
                .map(|s| DateTime::parse_from_rfc3339(&s).map(|dt| dt.with_timezone(&Utc)))
                .transpose()
                .map_err(|_e| rusqlite::Error::InvalidColumnType(12, "expiration_date".to_string(), rusqlite::types::Type::Text))?,
            is_active: row.get(13)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?).unwrap().with_timezone(&Utc),
        })
    })?;

    if let Some(row) = rows.next() {
        Ok(Some(row?))
    } else {
        Ok(None)
    }
}

pub fn update_ingredient(conn: &Connection, id: &str, ingredient: &Ingredient) -> Result<()> {
    conn.execute(
        "UPDATE ingredients SET name = ?2, description = ?3, category = ?4, unit = ?5, current_stock = ?6, min_stock = ?7, max_stock = ?8, cost_per_unit = ?9, supplier_id = ?10, barcode = ?11, image_url = ?12, expiration_date = ?13, is_active = ?14, updated_at = ?15 WHERE id = ?1",
        params![
            id,
            ingredient.name,
            ingredient.description,
            ingredient.category,
            ingredient.unit,
            ingredient.current_stock,
            ingredient.min_stock,
            ingredient.max_stock,
            ingredient.cost_per_unit,
            ingredient.supplier_id,
            ingredient.barcode,
            ingredient.image_url,
            ingredient.expiration_date.map(|d| d.to_rfc3339()),
            ingredient.is_active,
            ingredient.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn delete_ingredient(conn: &mut Connection, id: &str) -> Result<()> {
    // Start transaction to ensure all deletions succeed or none
    let tx = conn.transaction()?;
    
    // Delete all related records first
    tx.execute("DELETE FROM stock_movements WHERE ingredient_id = ?", [id])?;
    tx.execute("DELETE FROM stock_alerts WHERE ingredient_id = ?", [id])?;
    tx.execute("DELETE FROM invoice_items WHERE ingredient_id = ?", [id])?;
    
    // Finally delete the ingredient
    tx.execute("DELETE FROM ingredients WHERE id = ?", [id])?;
    
    // Commit the transaction
    tx.commit()?;
    Ok(())
}

// Suppliers functions
pub fn insert_supplier(conn: &Connection, supplier: &Supplier) -> Result<()> {
    conn.execute(
        "INSERT INTO suppliers (id, name, contact_person, email, phone, address, payment_terms, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            supplier.id,
            supplier.name,
            supplier.contact_person,
            supplier.email,
            supplier.phone,
            supplier.address,
            supplier.payment_terms,
            supplier.is_active,
            supplier.created_at.to_rfc3339(),
            supplier.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_all_suppliers(conn: &Connection) -> Result<Vec<Supplier>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, contact_person, email, phone, address, payment_terms, is_active, created_at, updated_at FROM suppliers ORDER BY name"
    )?;
    
    let supplier_iter = stmt.query_map([], |row| {
        Ok(Supplier {
            id: row.get(0)?,
            name: row.get(1)?,
            contact_person: row.get(2)?,
            email: row.get(3)?,
            phone: row.get(4)?,
            address: row.get(5)?,
            payment_terms: row.get(6)?,
            is_active: row.get(7)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut suppliers = Vec::new();
    for supplier in supplier_iter {
        suppliers.push(supplier?);
    }
    Ok(suppliers)
}


// Stock movements functions
pub fn insert_stock_movement(conn: &Connection, movement: &StockMovement) -> Result<()> {
    conn.execute(
        "INSERT INTO stock_movements (id, ingredient_id, movement_type, quantity, unit, reason, reference_id, created_by, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            movement.id,
            movement.ingredient_id,
            movement.movement_type.to_string(),
            movement.quantity,
            movement.unit,
            movement.reason,
            movement.reference_id,
            movement.created_by,
            movement.created_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_stock_movements_by_ingredient(conn: &Connection, ingredient_id: &str) -> Result<Vec<StockMovement>> {
    let mut stmt = conn.prepare(
        "SELECT id, ingredient_id, movement_type, quantity, unit, reason, reference_id, created_by, created_at FROM stock_movements WHERE ingredient_id = ? ORDER BY created_at DESC"
    )?;
    
    let movement_iter = stmt.query_map([ingredient_id], |row| {
        let movement_type_str: String = row.get(2)?;
        let movement_type = match movement_type_str.as_str() {
            "in" => StockMovementType::In,
            "out" => StockMovementType::Out,
            "adjustment" => StockMovementType::Adjustment,
            "expired" => StockMovementType::Expired,
            _ => StockMovementType::Adjustment,
        };

        Ok(StockMovement {
            id: row.get(0)?,
            ingredient_id: row.get(1)?,
            movement_type,
            quantity: row.get(3)?,
            unit: row.get(4)?,
            reason: row.get(5)?,
            reference_id: row.get(6)?,
            created_by: row.get(7)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut movements = Vec::new();
    for movement in movement_iter {
        movements.push(movement?);
    }
    Ok(movements)
}

// Stock alerts functions
pub fn insert_stock_alert(conn: &Connection, alert: &StockAlert) -> Result<()> {
    conn.execute(
        "INSERT INTO stock_alerts (id, ingredient_id, alert_type, message, is_read, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            alert.id,
            alert.ingredient_id,
            alert.alert_type.to_string(),
            alert.message,
            alert.is_read,
            alert.created_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_unread_stock_alerts(conn: &Connection) -> Result<Vec<StockAlert>> {
    let mut stmt = conn.prepare(
        "SELECT id, ingredient_id, alert_type, message, is_read, created_at FROM stock_alerts WHERE is_read = 0 ORDER BY created_at DESC"
    )?;
    
    let alert_iter = stmt.query_map([], |row| {
        let alert_type_str: String = row.get(2)?;
        let alert_type = match alert_type_str.as_str() {
            "low_stock" => StockAlertType::LowStock,
            "out_of_stock" => StockAlertType::OutOfStock,
            "expiring_soon" => StockAlertType::ExpiringSoon,
            "expired" => StockAlertType::Expired,
            _ => StockAlertType::LowStock,
        };

        Ok(StockAlert {
            id: row.get(0)?,
            ingredient_id: row.get(1)?,
            alert_type,
            message: row.get(3)?,
            is_read: row.get(4)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut alerts = Vec::new();
    for alert in alert_iter {
        alerts.push(alert?);
    }
    Ok(alerts)
}

pub fn mark_alert_as_read(conn: &Connection, alert_id: &str) -> Result<()> {
    conn.execute("UPDATE stock_alerts SET is_read = 1 WHERE id = ?", [alert_id])?;
    Ok(())
}

// ===== SMS DATABASE FUNCTIONS =====

pub fn get_sms_db_path() -> std::io::Result<std::path::PathBuf> {
    // Get the current executable path
    let exe_path = std::env::current_exe()?;
    // Navigate to project root: exe -> target/debug -> src-tauri -> project_root
    let project_root = exe_path
        .parent().unwrap() // target/debug
        .parent().unwrap() // target
        .parent().unwrap() // src-tauri
        .parent().unwrap(); // project_root
    
    let data_dir = project_root.join("data");
    std::fs::create_dir_all(&data_dir)?;
    
    Ok(data_dir.join("sms.db"))
}

pub fn init_sms_database() -> Result<(), String> {
    let db_path = get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    // Create SMS messages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_messages (
            id TEXT PRIMARY KEY,
            phone_number TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            sent_at TEXT,
            delivered_at TEXT,
            error_message TEXT,
            template_id TEXT,
            ticket_id TEXT,
            order_id TEXT,
            table_id TEXT,
            customer_name TEXT,
            provider TEXT NOT NULL DEFAULT 'none',
            cost REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SMS templates table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            variables TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            category TEXT NOT NULL DEFAULT 'general',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SMS contacts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL UNIQUE,
            email TEXT,
            company TEXT,
            tags TEXT,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_contact TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SMS configuration table (legacy - kept for compatibility)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_config (
            id INTEGER PRIMARY KEY,
            provider TEXT NOT NULL DEFAULT 'none',
            api_key TEXT,
            api_secret TEXT,
            sender_name TEXT,
            webhook_url TEXT,
            sim_port TEXT,
            sim_baud_rate INTEGER DEFAULT 9600,
            is_enabled BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SMS Gateway Android configuration table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_gateway_android_config (
            id INTEGER PRIMARY KEY,
            device_ip TEXT NOT NULL,
            port INTEGER NOT NULL DEFAULT 8080,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create Infobip configuration table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS infobip_config (
            id INTEGER PRIMARY KEY,
            api_key TEXT NOT NULL,
            base_url TEXT NOT NULL,
            sender_name TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SIM 800/900 configuration table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sim800_900_config (
            id INTEGER PRIMARY KEY,
            port TEXT NOT NULL,
            baud_rate INTEGER NOT NULL DEFAULT 9600,
            pin_code TEXT,
            is_enabled BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create provider selection table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS provider_selection (
            id INTEGER PRIMARY KEY,
            default_provider TEXT NOT NULL DEFAULT 'none',
            simulation_mode BOOLEAN NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Create SMS conversations table (for chat-like interface)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sms_conversations (
            id TEXT PRIMARY KEY,
            contact_id TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            last_message TEXT,
            last_message_at TEXT,
            unread_count INTEGER NOT NULL DEFAULT 0,
            is_archived BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (contact_id) REFERENCES sms_contacts (id)
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Clean up duplicate templates first
    conn.execute(
        "DELETE FROM sms_templates WHERE id NOT IN (
            SELECT MIN(id) FROM sms_templates GROUP BY name
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Insert default templates only if they don't exist
    let now = chrono::Utc::now().to_rfc3339();
    let default_templates = vec![
        ("order_ready", "Order Ready", "Your order #{order_number} is ready for pickup! Thank you.", "order"),
        ("payment_received", "Payment Received", "Payment of {total_amount}€ received successfully. Thank you!", "payment"),
    ];

    for (_template_key, name, content, category) in default_templates {
        // Check if template already exists by name
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM sms_templates WHERE name = ?").map_err(|e| e.to_string())?;
        let count: i64 = stmt.query_row([name], |row| row.get(0)).map_err(|e| e.to_string())?;
        
        if count == 0 {
            let template_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO sms_templates (id, name, content, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                [&template_id, name, content, category, &now, &now],
            ).map_err(|e| e.to_string())?;
        }
    }

    // Insert default configuration
    conn.execute(
        "INSERT OR IGNORE INTO sms_config (id, provider, is_enabled, created_at, updated_at) VALUES (1, 'none', 0, ?, ?)",
        [&now, &now],
    ).map_err(|e| e.to_string())?;

    info!("SMS database initialized successfully");
    Ok(())
}

// SMS Database Functions
pub fn insert_sms_message(conn: &Connection, message: &SMSMessage) -> Result<()> {
    conn.execute(
        "INSERT INTO sms_messages (id, phone_number, message, status, sent_at, delivered_at, error_message, template_id, ticket_id, order_id, table_id, customer_name, provider, cost, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            message.id,
            message.phone_number,
            message.message,
            serde_json::to_string(&message.status).unwrap(),
            message.sent_at.map(|d| d.to_rfc3339()),
            message.delivered_at.map(|d| d.to_rfc3339()),
            message.error_message,
            message.template_id,
            message.ticket_id,
            message.order_id,
            message.table_id,
            message.customer_name,
            serde_json::to_string(&message.provider).unwrap(),
            message.cost,
            message.created_at.to_rfc3339(),
            message.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn get_sms_messages(conn: &Connection, limit: Option<i32>) -> Result<Vec<SMSMessage>> {
    let query = if let Some(limit) = limit {
        format!("SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT {}", limit)
    } else {
        "SELECT * FROM sms_messages ORDER BY created_at DESC".to_string()
    };
    
    let mut stmt = conn.prepare(&query)?;
    let message_iter = stmt.query_map([], |row| {
        Ok(SMSMessage {
            id: row.get(0)?,
            phone_number: row.get(1)?,
            message: row.get(2)?,
            status: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(SMSStatus::Pending),
            sent_at: row.get::<_, Option<String>>(4)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            delivered_at: row.get::<_, Option<String>>(5)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            error_message: row.get(6)?,
            template_id: row.get(7)?,
            ticket_id: row.get(8)?,
            order_id: row.get(9)?,
            table_id: row.get(10)?,
            customer_name: row.get(11)?,
            provider: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or(SMSProvider::None),
            cost: row.get(13)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message?);
    }
    Ok(messages)
}

pub fn get_sms_message_by_id(conn: &Connection, id: &str) -> Result<Option<SMSMessage>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_messages WHERE id = ?")?;
    let mut rows = stmt.query([id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(SMSMessage {
            id: row.get(0)?,
            phone_number: row.get(1)?,
            message: row.get(2)?,
            status: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(SMSStatus::Pending),
            sent_at: row.get::<_, Option<String>>(4)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            delivered_at: row.get::<_, Option<String>>(5)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            error_message: row.get(6)?,
            template_id: row.get(7)?,
            ticket_id: row.get(8)?,
            order_id: row.get(9)?,
            table_id: row.get(10)?,
            customer_name: row.get(11)?,
            provider: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or(SMSProvider::None),
            cost: row.get(13)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn update_sms_message(conn: &Connection, message: &SMSMessage) -> Result<()> {
    conn.execute(
        "UPDATE sms_messages SET status = ?, sent_at = ?, delivered_at = ?, error_message = ?, provider = ?, cost = ?, updated_at = ? WHERE id = ?",
        params![
            serde_json::to_string(&message.status).unwrap(),
            message.sent_at.map(|d| d.to_rfc3339()),
            message.delivered_at.map(|d| d.to_rfc3339()),
            message.error_message,
            serde_json::to_string(&message.provider).unwrap(),
            message.cost,
            message.updated_at.to_rfc3339(),
            message.id
        ],
    )?;
    Ok(())
}

pub fn insert_sms_template(conn: &Connection, template: &SMSTemplate) -> Result<()> {
    conn.execute(
        "INSERT INTO sms_templates (id, name, content, variables, is_active, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            template.id,
            template.name,
            template.content,
            template.variables.as_ref().map(|v| serde_json::to_string(v).unwrap()),
            template.is_active,
            template.category,
            template.created_at.to_rfc3339(),
            template.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn get_sms_templates(conn: &Connection) -> Result<Vec<SMSTemplate>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_templates ORDER BY created_at DESC")?;
    let template_iter = stmt.query_map([], |row| {
        Ok(SMSTemplate {
            id: row.get(0)?,
            name: row.get(1)?,
            content: row.get(2)?,
            variables: row.get::<_, Option<String>>(3)?.map(|s| serde_json::from_str(&s).unwrap()),
            is_active: row.get(4)?,
            category: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut templates = Vec::new();
    for template in template_iter {
        templates.push(template?);
    }
    Ok(templates)
}

pub fn get_sms_template_by_id(conn: &Connection, id: &str) -> Result<Option<SMSTemplate>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_templates WHERE id = ?")?;
    let mut rows = stmt.query([id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(SMSTemplate {
            id: row.get(0)?,
            name: row.get(1)?,
            content: row.get(2)?,
            variables: row.get::<_, Option<String>>(3)?.map(|s| serde_json::from_str(&s).unwrap()),
            is_active: row.get(4)?,
            category: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn update_sms_template(conn: &Connection, id: &str, template: &SMSTemplate) -> Result<()> {
    conn.execute(
        "UPDATE sms_templates SET name = ?, content = ?, variables = ?, is_active = ?, category = ?, updated_at = ? WHERE id = ?",
        params![
            template.name,
            template.content,
            template.variables.as_ref().map(|v| serde_json::to_string(v).unwrap()),
            template.is_active,
            template.category,
            template.updated_at.to_rfc3339(),
            id
        ],
    )?;
    Ok(())
}

pub fn delete_sms_template(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM sms_templates WHERE id = ?", [id])?;
    Ok(())
}

pub fn insert_sms_contact(conn: &Connection, contact: &SMSContact) -> Result<()> {
    conn.execute(
        "INSERT INTO sms_contacts (id, name, phone_number, email, company, tags, is_active, last_contact, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            contact.id,
            contact.name,
            contact.phone_number,
            contact.email,
            contact.company,
            contact.tags.as_ref().map(|t| serde_json::to_string(t).unwrap()),
            contact.is_active,
            contact.last_contact.map(|d| d.to_rfc3339()),
            contact.created_at.to_rfc3339(),
            contact.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn get_sms_contacts(conn: &Connection) -> Result<Vec<SMSContact>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_contacts ORDER BY name ASC")?;
    let contact_iter = stmt.query_map([], |row| {
        Ok(SMSContact {
            id: row.get(0)?,
            name: row.get(1)?,
            phone_number: row.get(2)?,
            email: row.get(3)?,
            company: row.get(4)?,
            tags: row.get::<_, Option<String>>(5)?.map(|s| serde_json::from_str(&s).unwrap()),
            is_active: row.get(6)?,
            last_contact: row.get::<_, Option<String>>(7)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut contacts = Vec::new();
    for contact in contact_iter {
        contacts.push(contact?);
    }
    Ok(contacts)
}

pub fn get_sms_contact_by_id(conn: &Connection, id: &str) -> Result<Option<SMSContact>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_contacts WHERE id = ?")?;
    let mut rows = stmt.query([id])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(SMSContact {
            id: row.get(0)?,
            name: row.get(1)?,
            phone_number: row.get(2)?,
            email: row.get(3)?,
            company: row.get(4)?,
            tags: row.get::<_, Option<String>>(5)?.map(|s| serde_json::from_str(&s).unwrap()),
            is_active: row.get(6)?,
            last_contact: row.get::<_, Option<String>>(7)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn update_sms_contact(conn: &Connection, id: &str, contact: &SMSContact) -> Result<()> {
    conn.execute(
        "UPDATE sms_contacts SET name = ?, phone_number = ?, email = ?, company = ?, tags = ?, is_active = ?, last_contact = ?, updated_at = ? WHERE id = ?",
        params![
            contact.name,
            contact.phone_number,
            contact.email,
            contact.company,
            contact.tags.as_ref().map(|t| serde_json::to_string(t).unwrap()),
            contact.is_active,
            contact.last_contact.map(|d| d.to_rfc3339()),
            contact.updated_at.to_rfc3339(),
            id
        ],
    )?;
    Ok(())
}

pub fn delete_sms_contact(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM sms_contacts WHERE id = ?", [id])?;
    Ok(())
}

pub fn get_sms_config(conn: &Connection) -> Result<SMSConfig> {
    let mut stmt = conn.prepare("SELECT * FROM sms_config WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(SMSConfig {
            id: row.get(0)?,
            provider: serde_json::from_str(&row.get::<_, String>(1)?).unwrap_or(SMSProvider::None),
            api_key: row.get(2)?,
            api_secret: row.get(3)?,
            sender_name: row.get(4)?,
            webhook_url: row.get(5)?,
            sim_port: row.get(6)?,
            sim_baud_rate: row.get(7)?,
            is_enabled: row.get(8)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?).unwrap().with_timezone(&Utc),
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_sms_config(conn: &Connection, config: &SMSConfig) -> Result<()> {
    conn.execute(
        "UPDATE sms_config SET provider = ?, api_key = ?, api_secret = ?, sender_name = ?, webhook_url = ?, sim_port = ?, sim_baud_rate = ?, is_enabled = ?, updated_at = ? WHERE id = ?",
        params![
            serde_json::to_string(&config.provider).unwrap(),
            config.api_key,
            config.api_secret,
            config.sender_name,
            config.webhook_url,
            config.sim_port,
            config.sim_baud_rate,
            config.is_enabled,
            config.updated_at.to_rfc3339(),
            config.id
        ],
    )?;
    Ok(())
}

// ===== NEW PROVIDER CONFIGURATION FUNCTIONS =====

// Provider Selection
pub fn get_provider_selection(conn: &Connection) -> Result<ProviderSelection> {
    let mut stmt = conn.prepare("SELECT * FROM provider_selection WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(ProviderSelection {
            id: row.get(0)?,
            default_provider: row.get(1)?,
            simulation_mode: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?).unwrap().with_timezone(&Utc),
        })
    } else {
        // Create default provider selection if it doesn't exist
        let now = chrono::Utc::now();
        let default_selection = ProviderSelection {
            id: 1,
            default_provider: "none".to_string(),
            simulation_mode: true,
            created_at: now,
            updated_at: now,
        };
        insert_provider_selection(conn, &default_selection)?;
        Ok(default_selection)
    }
}

pub fn insert_provider_selection(conn: &Connection, selection: &ProviderSelection) -> Result<()> {
    conn.execute(
        "INSERT INTO provider_selection (id, default_provider, simulation_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        params![
            selection.id,
            selection.default_provider,
            selection.simulation_mode,
            selection.created_at.to_rfc3339(),
            selection.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn update_provider_selection(conn: &Connection, selection: &ProviderSelection) -> Result<()> {
    conn.execute(
        "UPDATE provider_selection SET default_provider = ?, simulation_mode = ?, updated_at = ? WHERE id = ?",
        params![
            selection.default_provider,
            selection.simulation_mode,
            selection.updated_at.to_rfc3339(),
            selection.id
        ],
    )?;
    Ok(())
}

// SMS Gateway Android Configuration
pub fn get_sms_gateway_android_config(conn: &Connection) -> Result<Option<SMSGatewayAndroidConfig>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_gateway_android_config WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(SMSGatewayAndroidConfig {
            id: row.get(0)?,
            device_ip: row.get(1)?,
            port: row.get(2)?,
            username: row.get(3)?,
            password: row.get(4)?,
            is_enabled: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn insert_sms_gateway_android_config(conn: &Connection, config: &SMSGatewayAndroidConfig) -> Result<()> {
    conn.execute(
        "INSERT INTO sms_gateway_android_config (id, device_ip, port, username, password, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            config.id,
            config.device_ip,
            config.port,
            config.username,
            config.password,
            config.is_enabled,
            config.created_at.to_rfc3339(),
            config.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn update_sms_gateway_android_config(conn: &Connection, config: &SMSGatewayAndroidConfig) -> Result<()> {
    conn.execute(
        "UPDATE sms_gateway_android_config SET device_ip = ?, port = ?, username = ?, password = ?, is_enabled = ?, updated_at = ? WHERE id = ?",
        params![
            config.device_ip,
            config.port,
            config.username,
            config.password,
            config.is_enabled,
            config.updated_at.to_rfc3339(),
            config.id
        ],
    )?;
    Ok(())
}

// Infobip Configuration
pub fn get_infobip_config(conn: &Connection) -> Result<Option<InfobipConfig>> {
    let mut stmt = conn.prepare("SELECT * FROM infobip_config WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(InfobipConfig {
            id: row.get(0)?,
            api_key: row.get(1)?,
            base_url: row.get(2)?,
            sender_name: row.get(3)?,
            is_enabled: row.get(4)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn insert_infobip_config(conn: &Connection, config: &InfobipConfig) -> Result<()> {
    conn.execute(
        "INSERT INTO infobip_config (id, api_key, base_url, sender_name, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params![
            config.id,
            config.api_key,
            config.base_url,
            config.sender_name,
            config.is_enabled,
            config.created_at.to_rfc3339(),
            config.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn update_infobip_config(conn: &Connection, config: &InfobipConfig) -> Result<()> {
    conn.execute(
        "UPDATE infobip_config SET api_key = ?, base_url = ?, sender_name = ?, is_enabled = ?, updated_at = ? WHERE id = ?",
        params![
            config.api_key,
            config.base_url,
            config.sender_name,
            config.is_enabled,
            config.updated_at.to_rfc3339(),
            config.id
        ],
    )?;
    Ok(())
}

// SIM 800/900 Configuration
pub fn get_sim800_900_config(conn: &Connection) -> Result<Option<SIM800900Config>> {
    let mut stmt = conn.prepare("SELECT * FROM sim800_900_config WHERE id = 1")?;
    let mut rows = stmt.query([])?;
    
    if let Some(row) = rows.next()? {
        Ok(Some(SIM800900Config {
            id: row.get(0)?,
            port: row.get(1)?,
            baud_rate: row.get(2)?,
            pin_code: row.get(3)?,
            is_enabled: row.get(4)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
        }))
    } else {
        Ok(None)
    }
}

pub fn insert_sim800_900_config(conn: &Connection, config: &SIM800900Config) -> Result<()> {
    conn.execute(
        "INSERT INTO sim800_900_config (id, port, baud_rate, pin_code, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params![
            config.id,
            config.port,
            config.baud_rate,
            config.pin_code,
            config.is_enabled,
            config.created_at.to_rfc3339(),
            config.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn update_sim800_900_config(conn: &Connection, config: &SIM800900Config) -> Result<()> {
    conn.execute(
        "UPDATE sim800_900_config SET port = ?, baud_rate = ?, pin_code = ?, is_enabled = ?, updated_at = ? WHERE id = ?",
        params![
            config.port,
            config.baud_rate,
            config.pin_code,
            config.is_enabled,
            config.updated_at.to_rfc3339(),
            config.id
        ],
    )?;
    Ok(())
}

pub fn get_sms_conversations(conn: &Connection) -> Result<Vec<SMSConversation>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_conversations ORDER BY last_message_at DESC")?;
    let conversation_iter = stmt.query_map([], |row| {
        Ok(SMSConversation {
            id: row.get(0)?,
            contact_id: row.get(1)?,
            phone_number: row.get(2)?,
            last_message: row.get(3)?,
            last_message_at: row.get::<_, Option<String>>(4)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            unread_count: row.get(5)?,
            is_archived: row.get(6)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut conversations = Vec::new();
    for conversation in conversation_iter {
        conversations.push(conversation?);
    }
    Ok(conversations)
}

pub fn get_sms_conversation_messages(conn: &Connection, conversation_id: &str) -> Result<Vec<SMSMessage>> {
    let mut stmt = conn.prepare("SELECT * FROM sms_messages WHERE phone_number = (SELECT phone_number FROM sms_conversations WHERE id = ?) ORDER BY created_at ASC")?;
    let message_iter = stmt.query_map([conversation_id], |row| {
        Ok(SMSMessage {
            id: row.get(0)?,
            phone_number: row.get(1)?,
            message: row.get(2)?,
            status: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(SMSStatus::Pending),
            sent_at: row.get::<_, Option<String>>(4)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            delivered_at: row.get::<_, Option<String>>(5)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
            error_message: row.get(6)?,
            template_id: row.get(7)?,
            ticket_id: row.get(8)?,
            order_id: row.get(9)?,
            table_id: row.get(10)?,
            customer_name: row.get(11)?,
            provider: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or(SMSProvider::None),
            cost: row.get(13)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message?);
    }
    Ok(messages)
}

// ===== RESERVATION FUNCTIONS =====

pub fn insert_reservation(conn: &Connection, reservation: &TableReservation) -> Result<()> {
    conn.execute(
        "INSERT INTO table_reservations (id, table_id, customer_name, customer_phone, customer_email, reservation_date, reservation_time, duration_minutes, party_size, special_requests, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            reservation.id,
            reservation.table_id,
            reservation.customer_name,
            reservation.customer_phone,
            reservation.customer_email,
            reservation.reservation_date,
            reservation.reservation_time,
            reservation.duration_minutes,
            reservation.party_size,
            reservation.special_requests,
            reservation.status.to_string(),
            reservation.created_at.to_rfc3339(),
            reservation.updated_at.to_rfc3339()
        ],
    )?;
    Ok(())
}

pub fn get_reservations_by_date(conn: &Connection, date: &str) -> Result<Vec<TableReservation>> {
    let mut stmt = conn.prepare("SELECT * FROM table_reservations WHERE reservation_date = ? ORDER BY reservation_time ASC")?;
    let reservation_iter = stmt.query_map([date], |row| {
        Ok(TableReservation {
            id: row.get(0)?,
            table_id: row.get(1)?,
            customer_name: row.get(2)?,
            customer_phone: row.get(3)?,
            customer_email: row.get(4)?,
            reservation_date: row.get(5)?,
            reservation_time: row.get(6)?,
            duration_minutes: row.get(7)?,
            party_size: row.get(8)?,
            special_requests: row.get(9)?,
            status: match row.get::<_, String>(10)?.as_str() {
                "confirmed" => ReservationStatus::Confirmed,
                "cancelled" => ReservationStatus::Cancelled,
                "completed" => ReservationStatus::Completed,
                "no_show" => ReservationStatus::NoShow,
                _ => ReservationStatus::Confirmed,
            },
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut reservations = Vec::new();
    for reservation in reservation_iter {
        reservations.push(reservation?);
    }
    Ok(reservations)
}

pub fn update_reservation_status(conn: &Connection, id: &str, status: ReservationStatus) -> Result<()> {
    let now = Utc::now();
    conn.execute(
        "UPDATE table_reservations SET status = ?, updated_at = ? WHERE id = ?",
        params![status.to_string(), now.to_rfc3339(), id],
    )?;
    Ok(())
}

pub fn delete_reservation(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM table_reservations WHERE id = ?", [id])?;
    Ok(())
}

pub fn get_reservations_by_table(conn: &Connection, table_id: &str) -> Result<Vec<TableReservation>> {
    let mut stmt = conn.prepare("SELECT * FROM table_reservations WHERE table_id = ? ORDER BY reservation_date ASC, reservation_time ASC")?;
    let reservation_iter = stmt.query_map([table_id], |row| {
        Ok(TableReservation {
            id: row.get(0)?,
            table_id: row.get(1)?,
            customer_name: row.get(2)?,
            customer_phone: row.get(3)?,
            customer_email: row.get(4)?,
            reservation_date: row.get(5)?,
            reservation_time: row.get(6)?,
            duration_minutes: row.get(7)?,
            party_size: row.get(8)?,
            special_requests: row.get(9)?,
            status: match row.get::<_, String>(10)?.as_str() {
                "confirmed" => ReservationStatus::Confirmed,
                "cancelled" => ReservationStatus::Cancelled,
                "completed" => ReservationStatus::Completed,
                "no_show" => ReservationStatus::NoShow,
                _ => ReservationStatus::Confirmed,
            },
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?).unwrap().with_timezone(&Utc),
        })
    })?;

    let mut reservations = Vec::new();
    for reservation in reservation_iter {
        reservations.push(reservation?);
    }
    Ok(reservations)
}