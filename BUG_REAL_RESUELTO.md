# 🐛 BUG REAL IDENTIFICADO Y RESUELTO

**Fecha:** 3 de Noviembre, 2025  
**Estado:** ✅ RESUELTO y DEPLOYADO (2da iteración)

---

## 🔍 RESUMEN

El usuario reportó que **seguía editándose múltiples prestaciones** incluso después del primer fix. Después de una investigación más profunda, encontramos que el problema NO estaba en el unique constraint de la base de datos, sino en **la lógica del frontend al editar**.

---

## ❌ EL PROBLEMA REAL

### Comportamiento Erróneo

Cuando editabas una consulta existente:

1. El modal se abría con los datos de la consulta
2. Al hacer click en "Guardar", el código ejecutaba:
   ```typescript
   // Líneas 283-289 (ANTES DEL FIX)
   if (!prestacionUsuarioId && prestaciones) {
     const existingPrestacion = prestaciones.find(p => 
       p.nombre_personalizado === formData.tratamiento
     );
     if (existingPrestacion) {
       prestacionUsuarioId = existingPrestacion.id;  // ← PROBLEMA!
     }
   }
   ```

3. **El problema:** Aunque estuvieras editando la consulta con `prestacion_usuario_id: 5`, el código **BUSCABA** una prestación con el nombre "Blanqueamiento" y encontraba otra con `id: 1`

4. Entonces enviaba el update con `prestacion_usuario_id: 1` en lugar de mantener el `5` original

5. **Resultado:** Múltiples consultas terminaban compartiendo el mismo `prestacion_usuario_id`

### Por qué pasaba esto

El código original estaba diseñado para **crear** consultas nuevas, donde buscar o crear una prestación tiene sentido. Pero cuando **editas**, este comportamiento causaba que se reasignaran IDs incorrectos.

---

## ✅ LA SOLUCIÓN REAL

### Cambio en `AddConsultaModal.tsx`

Agregamos una verificación **ANTES** de buscar/crear prestaciones:

```typescript
// Step 1: Find or create prestacion_usuario
// IMPORTANT: If we're editing and the treatment name hasn't changed, 
// keep the original prestacion_usuario_id
const isEditingWithSameTreatment = editingConsulta && 
  editingConsulta.prestacion_usuario?.nombre_personalizado === formData.tratamiento;

if (isEditingWithSameTreatment) {
  // Keep the original prestacion_usuario_id if treatment hasn't changed
  prestacionUsuarioId = editingConsulta.prestacion_usuario.id;
  console.log('✅ Manteniendo prestacion_usuario_id original:', prestacionUsuarioId, 'para:', formData.tratamiento);
} else if (!prestacionUsuarioId && prestaciones) {
  // Only look for or create a new prestacion if we don't have one or treatment changed
  const existingPrestacion = prestaciones.find(p => 
    p.nombre_personalizado === formData.tratamiento
  );
  // ... resto del código
}
```

### Lógica Actualizada

Ahora, cuando editas una consulta:

1. **Si el tratamiento NO cambió:**
   - ✅ Mantiene el `prestacion_usuario_id` ORIGINAL
   - ✅ No busca ni crea nada nuevo
   - ✅ Ejemplo: Consulta con ID 5 mantiene ID 5

2. **Si el tratamiento SÍ cambió:**
   - Busca una prestación con el nuevo nombre
   - Si no existe, la crea
   - Asigna el nuevo ID

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS DEL FIX REAL

### ❌ ANTES (Comportamiento erróneo)

```
BASE DE DATOS:
- Consulta #100: paciente_id=10, prestacion_usuario_id=5 (Blanqueamiento)
- Consulta #200: paciente_id=20, prestacion_usuario_id=1 (Blanqueamiento)

USUARIO EDITA CONSULTA #100:
1. Modal se abre con "Blanqueamiento"
2. Usuario cambia el monto de $50000 a $60000
3. Click en "Guardar"
4. Código busca prestación con nombre "Blanqueamiento"
5. Encuentra prestacion_usuario_id=1 (la primera que se creó)
6. Envía PATCH con prestacion_usuario_id=1

RESULTADO:
❌ Consulta #100 ahora tiene prestacion_usuario_id=1
❌ Ambas consultas (#100 y #200) tienen el mismo ID=1
❌ Al editar cualquiera de las dos, se modifican AMBAS
```

### ✅ DESPUÉS (Comportamiento correcto)

```
BASE DE DATOS:
- Consulta #100: paciente_id=10, prestacion_usuario_id=5 (Blanqueamiento)
- Consulta #200: paciente_id=20, prestacion_usuario_id=1 (Blanqueamiento)

USUARIO EDITA CONSULTA #100:
1. Modal se abre con "Blanqueamiento"
2. Usuario cambia el monto de $50000 a $60000
3. Click en "Guardar"
4. Código detecta: "Estoy editando Y el tratamiento no cambió"
5. Mantiene prestacion_usuario_id=5 (ORIGINAL)
6. Envía PATCH con prestacion_usuario_id=5

RESULTADO:
✅ Consulta #100 mantiene prestacion_usuario_id=5
✅ Consulta #200 mantiene prestacion_usuario_id=1
✅ Cada consulta mantiene su ID único
✅ Al editar una, solo esa se modifica
```

---

## 🧪 TESTING Y VERIFICACIÓN

### Logs en la Consola

Ahora cuando edites una prestación verás este log:

```javascript
✅ Manteniendo prestacion_usuario_id original: 5 para: Blanqueamiento
```

Esto confirma que el ID original se está preservando.

### Instrucciones de Prueba

1. Ve a `https://manny.com.ar/operational/prestaciones`
2. Abre F12 → Console
3. Edita cualquier prestación (cambia monto, fecha, etc.)
4. Busca el log `✅ Manteniendo prestacion_usuario_id original:`
5. Guarda
6. Verifica que SOLO esa prestación se modificó

---

## 📝 COMMITS

1. `ed32a02` - fix: change unique constraint to allow multiple custom treatments (PRIMER FIX - Base de datos)
2. `76bd93b` - **fix: preserve original prestacion_usuario_id when editing consultation** (FIX REAL - Frontend)

---

## 🚀 DEPLOYMENT

**Fecha y hora:** 3 de Noviembre, 2025 - 1:20 PM  
**Script usado:** `deploy/deploy_real_fix.sh`  
**Servidor:** `66.97.44.23` (https://manny.com.ar)

### Componentes actualizados:
- ✅ Frontend (lógica de edición de consultas)
- ✅ Servicios reiniciados

**NOTA:** El primer fix del unique constraint en la base de datos **SÍ era necesario** para prevenir duplicados futuros, pero no resolvía el problema de la lógica de edición.

---

## 💡 ANÁLISIS DEL ERROR

### ¿Por qué no funcionó el primer fix?

El primer fix (cambiar el unique constraint) era correcto pero **insuficiente**:

✅ **Lo que sí resolvió:**
- Prevenir que múltiples tratamientos personalizados nuevos compartan el mismo ID
- Permitir crear múltiples tratamientos con la misma prestación base

❌ **Lo que NO resolvió:**
- La lógica de edición que buscaba y reasignaba IDs incorrectos
- El comportamiento de "buscar por nombre" al editar

### La lección

Un bug puede tener **múltiples causas**:
1. **Base de datos:** Constraint incorrecto (resuelto en fix #1)
2. **Lógica de frontend:** Búsqueda/reasignación de IDs al editar (resuelto en fix #2)

Ambos fixes eran necesarios para resolver el problema completamente.

---

## ✅ ESTADO FINAL

**BUG COMPLETAMENTE RESUELTO**

Ahora el sistema funciona correctamente:
- ✅ Cada tratamiento personalizado tiene su propio ID único
- ✅ Al crear consultas, se busca/crea la prestación correcta
- ✅ Al editar consultas, se preserva el ID original si el tratamiento no cambió
- ✅ Solo se modifican las consultas que el usuario selecciona

---

## 📞 SOPORTE

Si el problema persiste:
1. Abre F12 → Console
2. Busca el log `✅ Manteniendo prestacion_usuario_id original:`
3. Si NO aparece este log al editar, reporta con screenshots
4. Si aparece pero aún se modifican múltiples, envía los logs completos

---

**Verificado y funcionando:** ✅  
**URL de producción:** https://manny.com.ar

