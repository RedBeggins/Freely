lines = open('src-tauri/src/api.rs', 'r').readlines()  
lines[292] = lines[292].replace('let (license_key, instance_id, _) = get_stored_credentials(app).await?;' , 'let _selected_model = get_stored_credentials(app).await?;')   
