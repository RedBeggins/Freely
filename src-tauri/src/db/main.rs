use tauri_plugin_sql::{Migration, MigrationKind};

/// Returns all database migrations
pub fn migrations() -> Vec<Migration> {
    vec![
        // Migration 1: Create system_prompts table with indexes and triggers
        Migration {
            version: 1,
            description: "create_system_prompts_table",
            sql: include_str!("migrations/system-prompts.sql"),
            kind: MigrationKind::Up,
        },
        // Migration 2: Create chat history tables (conversations and messages)
        Migration {
            version: 2,
            description: "create_chat_history_tables",
            sql: include_str!("migrations/chat-history.sql"),
            kind: MigrationKind::Up,
        },
        // Migration 3: Add optional sources to messages
        Migration {
            version: 3,
            description: "add_web_sources_to_messages",
            sql: include_str!("migrations/web-sources.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
