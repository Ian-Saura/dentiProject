"""
CSV Import endpoint for production backend
This shows how CSV data is stored PER USER in the MySQL database
"""

@app.post("/v1/import")
async def import_csv(
    file: UploadFile = File(...),
    col_paciente: str = Form(...),
    col_tratamiento: str = Form(...),
    col_monto: str = Form(...),
    col_fecha: str = Form(None),
    col_medio_pago: str = Form(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    🎯 CSV IMPORT - STORES DATA PER USER IN DATABASE
    
    This endpoint:
    1. ✅ Gets the CURRENT AUTHENTICATED USER from JWT token
    2. ✅ Processes CSV data with normalization
    3. ✅ Creates/finds PATIENTS for this specific user
    4. ✅ Creates CONSULTATIONS linked to this user
    5. ✅ Stores everything in MySQL database with proper relationships
    
    Data isolation: Each user only sees their own imported data!
    """
    try:
        print(f"🔄 CSV Import started for user: {current_user.username} (ID: {current_user.id})")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Try different encodings
        encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
        df = None
        encoding_used = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(io.StringIO(contents.decode(encoding)))
                encoding_used = encoding
                break
            except (UnicodeDecodeError, pd.errors.EmptyDataError):
                continue
        
        if df is None:
            return {"error": "Could not read CSV file with any encoding", "migrados": 0, "errores": 0, "total_ars": 0}
        
        # Validate required columns exist
        required_cols = [col_paciente, col_tratamiento, col_monto]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {
                "error": f"Missing required columns: {', '.join(missing_cols)}", 
                "migrados": 0, "errores": 0, "total_ars": 0
            }
        
        # Process and normalize data
        consultas_importadas = 0
        errores = 0
        total_ars = 0
        
        # 🔑 KEY: Get or create default prestacion_usuario for THIS SPECIFIC USER
        default_prestacion_usuario = db.query(PrestacionUsuario).filter(
            PrestacionUsuario.usuario_id == current_user.id  # 👈 USER-SPECIFIC
        ).first()
        
        if not default_prestacion_usuario:
            # Create a default prestacion_usuario FOR THIS USER
            consulta_prestacion = db.query(Prestacion).filter(Prestacion.codigo == "CONS001").first()
            if consulta_prestacion:
                default_prestacion_usuario = PrestacionUsuario(
                    usuario_id=current_user.id,  # 👈 USER-SPECIFIC
                    prestacion_id=consulta_prestacion.id,
                    nombre_personalizado="Consulta General",
                    margen_ganancia_porcentaje=40.00
                )
                db.add(default_prestacion_usuario)
                db.commit()
                db.refresh(default_prestacion_usuario)
        
        for index, row in df.iterrows():
            try:
                # Normalize patient name
                paciente_raw = str(row[col_paciente]).strip() if pd.notna(row[col_paciente]) else ''
                if not paciente_raw:
                    errores += 1
                    continue
                
                # Split patient name properly
                paciente_parts = paciente_raw.split()
                paciente_nombre = paciente_parts[0] if paciente_parts else 'Paciente'
                paciente_apellido = ' '.join(paciente_parts[1:]) if len(paciente_parts) > 1 else ''
                
                # 🔑 KEY: Get or create patient FOR THIS SPECIFIC USER
                paciente = db.query(Paciente).filter(
                    Paciente.usuario_id == current_user.id,  # 👈 USER-SPECIFIC
                    Paciente.nombre == paciente_nombre,
                    Paciente.apellido == paciente_apellido
                ).first()
                
                if not paciente:
                    paciente = Paciente(
                        usuario_id=current_user.id,  # 👈 USER-SPECIFIC
                        nombre=paciente_nombre,
                        apellido=paciente_apellido,
                        email=f"{paciente_nombre.lower()}@imported.com",
                        activo=True
                    )
                    db.add(paciente)
                    db.commit()
                    db.refresh(paciente)
                    print(f"📝 Created new patient: {paciente_nombre} {paciente_apellido} for user {current_user.username}")
                
                # Normalize treatment
                tratamiento_raw = str(row[col_tratamiento]).strip() if pd.notna(row[col_tratamiento]) else 'Consulta'
                tratamiento_normalizado = normalize_treatment_name(tratamiento_raw)
                
                # Normalize amount
                monto_raw = row[col_monto]
                monto_normalizado = extraer_monto_numerico(monto_raw)
                if monto_normalizado <= 0:
                    errores += 1
                    continue
                
                # Normalize date
                if col_fecha and col_fecha in df.columns and pd.notna(row[col_fecha]):
                    fecha_normalizada = normalizar_fecha_flexible(row[col_fecha])
                else:
                    fecha_normalizada = datetime.now().date()
                
                # Normalize payment method
                if col_medio_pago and col_medio_pago in df.columns and pd.notna(row[col_medio_pago]):
                    medio_pago_normalizado = normalizar_medio_pago(row[col_medio_pago])
                else:
                    medio_pago_normalizado = 'efectivo'
                
                # 🔑 KEY: Create consultation record IN DATABASE FOR THIS USER
                consulta = Consulta(
                    usuario_id=current_user.id,  # 👈 USER-SPECIFIC
                    paciente_id=paciente.id,     # 👈 Patient belongs to this user
                    prestacion_usuario_id=default_prestacion_usuario.id,  # 👈 Service belongs to this user
                    fecha_consulta=fecha_normalizada,
                    monto_ars=round(monto_normalizado, 0),
                    medio_pago=medio_pago_normalizado,
                    estado='completada',
                    observaciones=f"Importado desde CSV: {tratamiento_normalizado}"
                )
                
                db.add(consulta)
                consultas_importadas += 1
                total_ars += monto_normalizado
                
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                errores += 1
                continue
        
        # 💾 Commit all changes to database
        db.commit()
        
        print(f"✅ CSV Import completed for user {current_user.username}: {consultas_importadas} consultations imported")
        
        return {
            "migrados": consultas_importadas,
            "errores": errores,
            "total_ars": round(total_ars, 0),
            "message": f"Successfully imported {consultas_importadas} consultations to database for user {current_user.username}",
            "encoding_used": encoding_used,
            "user_id": current_user.id,  # 👈 Shows which user the data belongs to
            "user_name": current_user.username
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Import error for user {current_user.username}: {e}")
        return {
            "error": f"Import failed: {str(e)}",
            "migrados": 0,
            "errores": 0,
            "total_ars": 0
        }
