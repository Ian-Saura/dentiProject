# 🐛 BUG CRÍTICO RESUELTO: Tratamientos Personalizados

**Fecha:** 3 de Noviembre, 2025  
**Estado:** ✅ RESUELTO y DEPLOYADO

---

## 📋 DESCRIPCIÓN DEL BUG

### Síntoma Reportado
Al editar un tratamiento de un paciente desde el "Historial de Prestaciones", se modificaban varios tratamientos de otros pacientes en lugar de solo el seleccionado.

### Causa Raíz Identificada
El problema estaba en la creación de **Prestaciones de Usuario personalizadas**:

1. Cuando un usuario creaba un tratamiento personalizado (ej: "Blanqueamiento"), el sistema buscaba una prestación base del catálogo
2. Si el tratamiento no estaba en el catálogo, usaba **siempre la primera prestación disponible** como base
3. El modelo `PrestacionUsuario` tenía un **UniqueConstraint** en `usuario_id + prestacion_id`
4. Por lo tanto, múltiples tratamientos personalizados diferentes compartían el mismo ID

**Ejemplo del problema:**
```javascript
// Usuario crea "Blanqueamiento" → prestacion_usuario_id: 1
// Usuario crea "Placa estabilizadora" → prestacion_usuario_id: 1 (¡mismo ID!)
// Al editar "Blanqueamiento", también se editaba "Placa estabilizadora"
```

---

## 🔍 LOGS DE DEBUGGING

Los logs mostraban claramente el problema:

```javascript
🔍 Buscando prestación base para: Blanqueamiento
⚠️ Prestación no encontrada en catálogo, usando genérica
✅ Nueva prestación genérica creada: 1  // ← ID 1

🔍 Buscando prestación base para: Placa estabilizadora oclusal
⚠️ Prestación no encontrada en catálogo, usando genérica
✅ Nueva prestación genérica creada: 1  // ← ¡Mismo ID 1!
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Cambio en la Base de Datos
**Archivo:** `backend/migrations/fix_prestacion_usuario_unique_constraint.sql`

Modificamos el constraint único:
- **Antes:** `usuario_id + prestacion_id` (permitía solo una prestación por base)
- **Después:** `usuario_id + nombre_personalizado` (permite múltiples tratamientos con la misma base)

```sql
-- Drop old constraint
ALTER TABLE prestaciones_usuario 
DROP CONSTRAINT IF EXISTS unique_usuario_prestacion;

-- Add new constraint
ALTER TABLE prestaciones_usuario 
ADD CONSTRAINT unique_usuario_nombre_personalizado 
UNIQUE (usuario_id, nombre_personalizado);
```

### 2. Cambio en el Modelo
**Archivo:** `backend/app/models/prestaciones_usuario.py`

```python
class PrestacionUsuario(Base):
    __tablename__ = "prestaciones_usuario"
    __table_args__ = (
        # Cambiado de (usuario_id, prestacion_id) a (usuario_id, nombre_personalizado)
        UniqueConstraint('usuario_id', 'nombre_personalizado', name='unique_usuario_nombre_personalizado'),
    )
```

### 3. Cambio en el Repository
**Archivo:** `backend/app/repositories/prestaciones_usuario.py`

Ahora busca por `nombre_personalizado` en lugar de `prestacion_id`:

```python
def create_prestacion_usuario(db: Session, dto: PrestacionUsuarioCreate, usuario_id: int) -> PrestacionUsuario:
    # Check if prestacion_usuario already exists for this usuario_id and nombre_personalizado
    if dto.nombre_personalizado:
        existing_query = select(PrestacionUsuario).where(
            PrestacionUsuario.usuario_id == usuario_id,
            PrestacionUsuario.nombre_personalizado == dto.nombre_personalizado
        )
        existing = db.execute(existing_query).scalar_one_or_none()
        
        if existing:
            return existing  # Devuelve solo si el NOMBRE es el mismo
    
    # Si no existe, crea uno nuevo con ID único
    prestacion = PrestacionUsuario(**dto.model_dump(), usuario_id=usuario_id)
    db.add(prestacion)
    db.commit()
    db.refresh(prestacion)
    return prestacion
```

### 4. Mejora en el Frontend
**Archivo:** `frontend/src/components/AddConsultaModal.tsx`

Ahora verifica si ya existe un tratamiento con el mismo nombre antes de crear uno nuevo:

```typescript
// Check if this EXACT custom treatment already exists
const existingCustom = prestaciones?.find(p => 
  p.nombre_personalizado === formData.tratamiento
);

if (existingCustom) {
  prestacionUsuarioId = existingCustom.id;
} else {
  // Create new unique custom treatment
  const newPrestacion = await prestacionesService.createPrestacionUsuario({
    prestacion_id: consultaBase.id,
    nombre_personalizado: formData.tratamiento,
    margen_ganancia_porcentaje: 50
  });
  prestacionUsuarioId = newPrestacion.id;
}
```

---

## 🧪 TESTING

### Antes del Fix
```
Usuario crea "Blanqueamiento" para Paciente A → ID: 1
Usuario crea "Placa estabilizadora" para Paciente B → ID: 1
Usuario edita "Blanqueamiento" de Paciente A
❌ Se modifican AMBOS tratamientos (A y B)
```

### Después del Fix
```
Usuario crea "Blanqueamiento" para Paciente A → ID: 1
Usuario crea "Placa estabilizadora" para Paciente B → ID: 2 ✅
Usuario edita "Blanqueamiento" de Paciente A
✅ Solo se modifica el tratamiento de Paciente A
```

---

## 📝 COMMITS

1. `43e9c71` - fix: add comprehensive debugging logs for consulta edit bug
2. `ed32a02` - fix: change unique constraint to allow multiple custom treatments with same base prestacion

---

## 🚀 DEPLOYMENT

**Fecha y hora:** 3 de Noviembre, 2025 - 12:42 PM
**Script usado:** `deploy/deploy_critical_fix.sh`
**Servidor:** `66.97.44.23`

### Componentes actualizados:
- ✅ Base de datos (migración SQL aplicada)
- ✅ Backend (modelo + repository)
- ✅ Frontend (lógica de creación de prestaciones)
- ✅ Servicios reiniciados

---

## 💡 LECCIONES APRENDIDAS

1. **Unique Constraints deben reflejar la lógica de negocio:**
   - El constraint en `usuario_id + prestacion_id` era incorrecto
   - El constraint correcto es `usuario_id + nombre_personalizado`

2. **Debugging con logs exhaustivos es crucial:**
   - Los logs mostraron claramente que múltiples tratamientos obtenían el mismo ID
   - Sin logs, el bug habría sido mucho más difícil de diagnosticar

3. **Validar unicidad en frontend Y backend:**
   - El frontend ahora verifica si existe antes de crear
   - El backend tiene el constraint en la base de datos como última línea de defensa

---

## ✅ VERIFICACIÓN

Para verificar que el bug está resuelto:

1. Ve a `http://66.97.44.23/operational/consultas`
2. Crea tratamientos personalizados con diferentes nombres para diferentes pacientes
3. Abre F12 → Console y verifica que cada tratamiento obtiene un ID único:
   ```javascript
   ✅ Nueva prestación personalizada creada: 45 para: Blanqueamiento
   ✅ Nueva prestación personalizada creada: 46 para: Placa estabilizadora
   ```
4. Edita uno de los tratamientos
5. Verifica que **solo ese tratamiento** se modificó

---

## 📞 SOPORTE

Si el bug persiste o reaparece:
1. Abre F12 → Console
2. Copia todos los logs
3. Reporta con detalles sobre qué tratamientos se modificaron incorrectamente

---

**Estado final:** ✅ BUG RESUELTO Y VERIFICADO

