use serde::{Deserialize, Serialize};
use tauri::command;
use std::process::Command;
use crate::database::{get_printer_config_db_path, save_printer_config, get_default_printer_config, log_printer_action};
use crate::models::{PrinterConfig, PrinterLog};

#[derive(Debug, Serialize, Deserialize)]
pub struct TerminalCommand {
    pub command: String,
    pub os: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TerminalOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub port: String,
    pub is_default: bool,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintTestRequest {
    pub printer_name: String,
    pub paper_size: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintTicketRequest {
    pub printer_name: String,
    pub paper_size: String,
    pub business_name: String,
    pub items: Vec<TicketItem>,
    pub total: f64,
    pub tax: f64,
    pub footer_text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TicketItem {
    pub name: String,
    pub quantity: i32,
    pub price: f64,
    pub subtotal: f64,
}

/// Execute any terminal command and return the result
#[command]
pub fn execute_terminal_command(command: String) -> Result<TerminalOutput, String> {
    let output = if cfg!(target_os = "windows") {
        Command::new("powershell")
            .args(&["-Command", &command])
            .output()
    } else {
        Command::new("bash")
            .args(&["-c", &command])
            .output()
    };

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(-1);
            
            Ok(TerminalOutput {
                success: output.status.success(),
                stdout,
                stderr,
                exit_code,
            })
        }
        Err(e) => Err(format!("Failed to execute command: {}", e))
    }
}

/// Get list of available printers using native OS commands
#[command]
pub fn get_printers() -> Result<Vec<PrinterInfo>, String> {
    if cfg!(target_os = "windows") {
        // Windows: Use PowerShell Get-Printer
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                "Get-Printer | Select-Object Name, Port, PrinterStatus, Default | ConvertTo-Json"
            ])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

        if output.status.success() {
            let json_output = String::from_utf8_lossy(&output.stdout);
            
            // Parse the JSON output from PowerShell
            match serde_json::from_str::<Vec<serde_json::Value>>(&json_output) {
                Ok(printers_json) => {
                    let mut printers = Vec::new();
                    
                    for printer in printers_json {
                        if let (Some(name), Some(port), Some(status), Some(is_default)) = (
                            printer.get("Name").and_then(|v| v.as_str()),
                            printer.get("Port").and_then(|v| v.as_str()),
                            printer.get("PrinterStatus").and_then(|v| v.as_str()),
                            printer.get("Default").and_then(|v| v.as_bool())
                        ) {
                            printers.push(PrinterInfo {
                                name: name.to_string(),
                                port: port.to_string(),
                                is_default: is_default,
                                status: status.to_string(),
                            });
                        }
                    }
                    
                    Ok(printers)
                }
                Err(_) => Err("Failed to parse PowerShell output".to_string())
            }
        } else {
            Err("PowerShell command failed".to_string())
        }
    } else if cfg!(target_os = "linux") {
        // Linux: Use CUPS lpstat
        let output = Command::new("lpstat")
            .args(&["-p"])
            .output()
            .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut printers = Vec::new();
            
            for line in stdout.lines() {
                if line.starts_with("printer") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let name = parts[1].to_string();
                        let status = if line.contains("idle") { "Ready" } else { "Busy" }.to_string();
                        
                        printers.push(PrinterInfo {
                            name,
                            port: "CUPS".to_string(),
                            is_default: false, // We'll check this separately
                            status,
                        });
                    }
                }
            }
            
            // Check default printer
            if let Ok(default_output) = Command::new("lpstat").args(&["-d"]).output() {
                if default_output.status.success() {
                    let default_name = String::from_utf8_lossy(&default_output.stdout);
                    if let Some(default) = default_name.lines().next() {
                        if let Some(name) = default.split(':').nth(1) {
                            let default_name = name.trim();
                            for printer in &mut printers {
                                if printer.name == default_name {
                                    printer.is_default = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            Ok(printers)
        } else {
            Err("lpstat command failed".to_string())
        }
    } else if cfg!(target_os = "macos") {
        // macOS: Use CUPS lpstat (same as Linux)
        let output = Command::new("lpstat")
            .args(&["-p"])
            .output()
            .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut printers = Vec::new();
            
            for line in stdout.lines() {
                if line.starts_with("printer") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let name = parts[1].to_string();
                        let status = if line.contains("idle") { "Ready" } else { "Busy" }.to_string();
                        
                        printers.push(PrinterInfo {
                            name,
                            port: "CUPS".to_string(),
                            is_default: false,
                            status,
                        });
                    }
                }
            }
            
            // Check default printer
            if let Ok(default_output) = Command::new("lpstat").args(&["-d"]).output() {
                if default_output.status.success() {
                    let default_name = String::from_utf8_lossy(&default_output.stdout);
                    if let Some(default) = default_name.lines().next() {
                        if let Some(name) = default.split(':').nth(1) {
                            let default_name = name.trim();
                            for printer in &mut printers {
                                if printer.name == default_name {
                                    printer.is_default = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            Ok(printers)
        } else {
            Err("lpstat command failed".to_string())
        }
    } else {
        Err("Unsupported operating system".to_string())
    }
}

/// Print a test page using native OS printing
#[command]
pub fn print_test_page(request: PrintTestRequest) -> Result<String, String> {
    if cfg!(target_os = "windows") {
        // Windows: PowerShell printing
        let command = format!(
            "Add-Type -AssemblyName System.Drawing; $printDoc = New-Object System.Drawing.Printing.PrintDocument; $printDoc.PrinterSettings.PrinterName = '{}'; $printDoc.PrintController = New-Object System.Drawing.Printing.StandardPrintController; $printDoc.PrintPage += {{ $e = $args[1]; $e.Graphics.DrawString('TEST PAGE - {}', New-Object System.Drawing.Font('Arial', 12), New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black), 10, 10); }}; $printDoc.Print(); $printDoc.Dispose()",
            request.printer_name, request.content
        );
        
        let output = Command::new("powershell")
            .args(&["-Command", &command])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;
            
        if output.status.success() {
            Ok(format!("Test page sent to printer '{}' successfully!", request.printer_name))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("PowerShell printing failed: {}", error))
        }
    } else if cfg!(target_os = "linux") || cfg!(target_os = "macos") {
        // Linux/macOS: Create temporary file and print with lp/lpr
        let temp_content = format!(
            "=== TEST PAGE ===\n\n\
             Printer: {}\n\
             Paper Size: {}\n\
             Content: {}\n\n\
             This is a test page to verify printer configuration.\n\
             If you can see this, your printer is working correctly!\n\n\
             === END TEST ===\n",
            request.printer_name, request.paper_size, request.content
        );
        
        // Write to temporary file
        let temp_file = format!("/tmp/test_page_{}.txt", chrono::Utc::now().timestamp());
        std::fs::write(&temp_file, temp_content)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;
        
        // Print using lp (Linux) or lpr (macOS)
        let print_command = if cfg!(target_os = "linux") { "lp" } else { "lpr" };
        let output = Command::new(print_command)
            .args(&["-d", &request.printer_name, &temp_file])
            .output()
            .map_err(|e| format!("Failed to execute {}: {}", print_command, e))?;
        
        // Clean up temp file
        let _ = std::fs::remove_file(&temp_file);
        
        if output.status.success() {
            Ok(format!("Test page sent to printer '{}' successfully!", request.printer_name))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("{} printing failed: {}", print_command, error))
        }
    } else {
        Err("Unsupported operating system".to_string())
    }
}

/// Print a ticket/receipt using native OS printing
#[command]
pub fn print_ticket(request: PrintTicketRequest) -> Result<String, String> {
    // Format ticket content
    let mut content = String::new();
    content.push_str(&format!("{}\n", "=".repeat(40)));
    content.push_str(&format!("{}\n", request.business_name));
    content.push_str(&format!("{}\n\n", "=".repeat(40)));
    
    // Add items
    for item in &request.items {
        content.push_str(&format!(
            "{} x{}  ${:.2}  ${:.2}\n",
            item.name, item.quantity, item.price, item.subtotal
        ));
    }
    
    content.push_str(&format!("{}\n", "-".repeat(40)));
    content.push_str(&format!("Subtotal: ${:.2}\n", request.total));
    content.push_str(&format!("Tax: ${:.2}\n", request.tax));
    content.push_str(&format!("TOTAL: ${:.2}\n", request.total + request.tax));
    content.push_str(&format!("{}\n", "=".repeat(40)));
    content.push_str(&format!("{}\n", request.footer_text));
    content.push_str(&format!("{}\n", "=".repeat(40)));
    
    if cfg!(target_os = "windows") {
        // Windows: PowerShell printing
        let command = format!(
            "Add-Type -AssemblyName System.Drawing; $printDoc = New-Object System.Drawing.Printing.PrintDocument; $printDoc.PrinterSettings.PrinterName = '{}'; $printDoc.PrintController = New-Object System.Drawing.Printing.StandardPrintController; $printDoc.PrintPage += {{ $e = $args[1]; $e.Graphics.DrawString('{}', New-Object System.Drawing.Font('Courier New', 10), New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black), 10, 10); }}; $printDoc.Print(); $printDoc.Dispose()",
            request.printer_name, content.replace("'", "''")
        );
        
        let output = Command::new("powershell")
            .args(&["-Command", &command])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;
            
        if output.status.success() {
            Ok(format!("Ticket sent to printer '{}' successfully!", request.printer_name))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("PowerShell printing failed: {}", error))
        }
    } else if cfg!(target_os = "linux") || cfg!(target_os = "macos") {
        // Linux/macOS: Create temporary file and print
        let temp_file = format!("/tmp/ticket_{}.txt", chrono::Utc::now().timestamp());
        std::fs::write(&temp_file, content)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;
        
        let print_command = if cfg!(target_os = "linux") { "lp" } else { "lpr" };
        let output = Command::new(print_command)
            .args(&["-d", &request.printer_name, &temp_file])
            .output()
            .map_err(|e| format!("Failed to execute {}: {}", print_command, e))?;
        
        // Clean up temp file
        let _ = std::fs::remove_file(&temp_file);
        
        if output.status.success() {
            Ok(format!("Ticket sent to printer '{}' successfully!", request.printer_name))
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("{} printing failed: {}", print_command, error))
        }
    } else {
        Err("Unsupported operating system".to_string())
    }
}

/// Get default printer using native OS commands
#[command]
pub fn get_default_printer() -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                "Get-Printer | Where-Object {$_.Default -eq $true} | Select-Object -ExpandProperty Name"
            ])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

        if output.status.success() {
            let printer_name = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if printer_name.is_empty() {
                Ok("Microsoft Print to PDF".to_string())
            } else {
                Ok(printer_name)
            }
        } else {
            Ok("Microsoft Print to PDF".to_string())
        }
    } else if cfg!(target_os = "linux") || cfg!(target_os = "macos") {
        let output = Command::new("lpstat")
            .args(&["-d"])
            .output()
            .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(line) = stdout.lines().next() {
                if let Some(name) = line.split(':').nth(1) {
                    Ok(name.trim().to_string())
                } else {
                    Ok("No default printer".to_string())
                }
            } else {
                Ok("No default printer".to_string())
            }
        } else {
            Ok("No default printer".to_string())
        }
    } else {
        Err("Unsupported operating system".to_string())
    }
}

/// Get printer status using native OS commands
#[command]
pub fn get_printer_status(printer_name: String) -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                &format!("Get-Printer -Name '{}' | Select-Object -ExpandProperty PrinterStatus", printer_name)
            ])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

        if output.status.success() {
            let status = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if status.is_empty() {
                Ok("Ready".to_string())
            } else {
                Ok(status)
            }
        } else {
            Ok("Ready".to_string())
        }
    } else if cfg!(target_os = "linux") || cfg!(target_os = "macos") {
        let output = Command::new("lpstat")
            .args(&["-p", &printer_name])
            .output()
            .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("idle") {
                Ok("Ready".to_string())
            } else if stdout.contains("processing") {
                Ok("Processing".to_string())
            } else {
                Ok("Unknown".to_string())
            }
        } else {
            Ok("Unknown".to_string())
        }
    } else {
        Err("Unsupported operating system".to_string())
    }
}

/// Save printer configuration to database
#[command]
pub fn save_printer_to_database(printer_name: String, port: Option<String>, driver: Option<String>) -> Result<String, String> {
    let db_path = get_printer_config_db_path()
        .map_err(|e| format!("Failed to get database path: {}", e))?;
    
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    let mut config = PrinterConfig::new(printer_name.clone(), port, driver);
    config.set_as_default();
    
    save_printer_config(&conn, &config)
        .map_err(|e| format!("Failed to save printer config: {}", e))?;
    
    // Log the action
    let log = PrinterLog::new(config.id.clone(), printer_name.clone(), "save_config".to_string(), true);
    let _ = log_printer_action(&conn, &log);
    
    Ok(format!("Printer '{}' saved successfully to database!", printer_name))
}

/// Get saved printer configuration from database
#[command]
pub fn get_saved_printer_config() -> Result<Option<PrinterConfig>, String> {
    let db_path = get_printer_config_db_path()
        .map_err(|e| format!("Failed to get database path: {}", e))?;
    
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database path: {}", e))?;
    
    get_default_printer_config(&conn)
        .map_err(|e| format!("Failed to get default printer config: {}", e))
}

/// Remove printer configuration from database
#[command]
pub fn remove_printer_from_database() -> Result<String, String> {
    let db_path = get_printer_config_db_path()
        .map_err(|e| format!("Failed to get database path: {}", e))?;
    
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // First remove all printer logs (due to FOREIGN KEY constraint)
    conn.execute("DELETE FROM printer_logs", [])
        .map_err(|e| format!("Failed to remove printer logs: {}", e))?;
    
    // Then remove all printer configs
    conn.execute("DELETE FROM printer_configs", [])
        .map_err(|e| format!("Failed to remove printer configs: {}", e))?;
    
    Ok("All printer configurations and logs removed successfully!".to_string())
}

/// Print directly to TCP port 9100 - ONE FUNCTION THAT WORKS
#[command]
pub fn print_to_tcp_port(printer_name: String) -> Result<String, String> {
    if cfg!(target_os = "windows") {
        // Simple PowerShell command that sends directly to TCP port 9100
        let tcp_command = format!(
            "try {{ \
                 $tcp = New-Object System.Net.Sockets.TcpClient; \
                 $tcp.Connect('127.0.0.1', 9100); \
                 if ($tcp.Connected) {{ \
                     $stream = $tcp.GetStream(); \
                     $data = [System.Text.Encoding]::ASCII.GetBytes('=== TEST TICKET ===\nPrinter: {}\nDate: {}\nPort: 9100\n=== END ===\n'); \
                     $stream.Write($data, 0, $data.Length); \
                     $stream.Flush(); \
                     $tcp.Close(); \
                     Write-Host 'Ticket sent to TCP port 9100 successfully'; \
                 }} else {{ \
                     Write-Error 'Failed to connect to TCP port 9100'; \
                 }} \
             }} catch {{ \
                 Write-Error ('TCP Error: ' + $_.Exception.Message); \
             }}",
            printer_name.replace("'", "''"),
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
        );
        
        let output = Command::new("powershell")
            .args(&["-Command", &tcp_command])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;
            
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("Ticket sent to TCP port 9100 successfully") {
                Ok(format!("Ticket sent to TCP port 9100 for printer '{}' successfully!", printer_name))
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("TCP printing failed: {}", stderr))
            }
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("TCP printing failed: {}", stderr))
        }
    } else {
        Err("TCP printing only supported on Windows".to_string())
    }
}

/// Smart printing - automatically detects printer type and adapts the command
#[command]
pub fn print_smart_ticket(printer_name: String) -> Result<String, String> {
    if cfg!(target_os = "windows") {
        // First, get printer details to understand its type
        let info_command = format!(
            "try {{ \
                 $printer = Get-Printer -Name '{}' -ErrorAction Stop; \
                 $details = @{{ \
                     Name = $printer.Name; \
                     Port = $printer.PortName; \
                     Status = $printer.PrinterStatus; \
                     Driver = $printer.DriverName; \
                     Type = $printer.PrinterType; \
                 }}; \
                 $details | ConvertTo-Json -Depth 2; \
             }} catch {{ \
                 Write-Error ('Error: ' + $_.Exception.Message); \
             }}",
            printer_name.replace("'", "''")
        );
        
        let info_output = Command::new("powershell")
            .args(&["-Command", &info_command])
            .output()
            .map_err(|e| format!("Failed to get printer info: {}", e))?;
            
        if !info_output.status.success() {
            let stderr = String::from_utf8_lossy(&info_output.stderr);
            return Err(format!("Failed to get printer info: {}", stderr));
        }
        
        let printer_info = String::from_utf8_lossy(&info_output.stdout);
        println!("🔍 DEBUG: Printer info: {}", printer_info);
        
        // Now create the appropriate print command based on printer type
        let print_command = if printer_info.contains("TCP") || printer_info.contains("9100") || printer_info.contains("IP") {
            // Network printer - use TCP/IP
            format!(
                "try {{ \
                     $tcp = New-Object System.Net.Sockets.TcpClient; \
                     $tcp.Connect('127.0.0.1', 9100); \
                     if ($tcp.Connected) {{ \
                         $stream = $tcp.GetStream(); \
                         $data = [System.Text.Encoding]::ASCII.GetBytes('=== TEST TICKET ===\nPrinter: {}\nDate: {}\nType: Network TCP/IP\nPort: 9100\n=== END ===\n'); \
                         $stream.Write($data, 0, $data.Length); \
                         $stream.Flush(); \
                         $tcp.Close(); \
                         Write-Host 'Network ticket sent successfully'; \
                     }} else {{ \
                         Write-Error 'Failed to connect to TCP port 9100'; \
                     }} \
                 }} catch {{ \
                     Write-Error ('Network Error: ' + $_.Exception.Message); \
                 }}",
                printer_name.replace("'", "''"),
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
            )
        } else if printer_info.contains("USB") || printer_info.contains("COM") || printer_info.contains("LPT") {
            // Local printer - use standard Windows printing
            format!(
                "try {{ \
                     '=== TEST TICKET ===' | Out-Printer -Name '{}'; \
                     'Printer: {}' | Out-Printer -Name '{}'; \
                     'Date: {}' | Out-Printer -Name '{}'; \
                     'Type: Local USB/Serial' | Out-Printer -Name '{}'; \
                     '=== END ===' | Out-Printer -Name '{}'; \
                     Write-Host 'Local ticket sent successfully'; \
                 }} catch {{ \
                     Write-Error ('Local Error: ' + $_.Exception.Message); \
                 }}",
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''")
            )
        } else {
            // Unknown type - try standard printing first
            format!(
                "try {{ \
                     '=== TEST TICKET ===' | Out-Printer -Name '{}'; \
                     'Printer: {}' | Out-Printer -Name '{}'; \
                     'Date: {}' | Out-Printer -Name '{}'; \
                     'Type: Auto-detected' | Out-Printer -Name '{}'; \
                     '=== END ===' | Out-Printer -Name '{}'; \
                     Write-Host 'Auto-detected ticket sent successfully'; \
                 }} catch {{ \
                     Write-Error ('Auto Error: ' + $_.Exception.Message); \
                 }}",
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''"),
                printer_name.replace("'", "''")
            )
        };
        
        println!("🔍 DEBUG: Using print command for printer type");
        let output = Command::new("powershell")
            .args(&["-Command", &print_command])
            .output()
            .map_err(|e| format!("Failed to execute print command: {}", e))?;
            
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("successfully") {
                Ok(format!("Test ticket sent to printer '{}' successfully!\n\n🔧 PowerShell command used:\n{}", printer_name, print_command))
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Smart printing failed: {}", stderr))
            }
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            Err(format!("Smart printing failed. Error: {}, Output: {}", stderr, stdout))
        }
    } else {
        Err("Smart printing only supported on Windows".to_string())
    }
}
