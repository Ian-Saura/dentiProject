/**
 * Utilidades para formateo de fechas
 */

/**
 * Formatea una fecha a formato DD/MM/AAAA
 * @param date - Fecha en formato ISO (YYYY-MM-DD) o Date object
 * @returns Fecha formateada como DD/MM/AAAA o '-' si no hay fecha
 */
export const formatDateToDDMMYYYY = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar que sea una fecha válida
    if (isNaN(dateObj.getTime())) return '-';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Convierte una fecha de DD/MM/AAAA a YYYY-MM-DD (formato ISO para inputs)
 * @param date - Fecha en formato DD/MM/AAAA
 * @returns Fecha en formato YYYY-MM-DD
 */
export const convertDDMMYYYYtoISO = (date: string): string => {
  if (!date || date === '-') return '';
  
  try {
    const parts = date.split('/');
    if (parts.length !== 3) return '';
    
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    return '';
  }
};

/**
 * Formatea una fecha con hora a formato DD/MM/AAAA HH:MM
 * @param date - Fecha en formato ISO con hora
 * @returns Fecha formateada como DD/MM/AAAA HH:MM
 */
export const formatDateTimeToLocal = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param birthDate - Fecha de nacimiento en cualquier formato
 * @returns Edad en años o null si no se puede calcular
 */
export const calculateAge = (birthDate: string | Date | null | undefined): number | null => {
  if (!birthDate) return null;
  
  try {
    const dateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    if (isNaN(dateObj.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
};
