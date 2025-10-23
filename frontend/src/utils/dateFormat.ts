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
    // Si es un string en formato YYYY-MM-DD, parsearlo directamente sin timezone
    if (typeof date === 'string') {
      // Si es formato simple YYYY-MM-DD, parsear directamente
      const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
      const match = date.match(datePattern);
      
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      
      // Si tiene timestamp, usar UTC para evitar timezone shift
      if (date.includes('T') || date.includes(' ')) {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = dateObj.getUTCFullYear();
        
        return `${day}/${month}/${year}`;
      }
    }
    
    // Si es un Date object
    const dateObj = date as Date;
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
    let year: number, month: number, day: number;
    
    // Si es un string en formato YYYY-MM-DD, parsearlo directamente sin timezone
    if (typeof birthDate === 'string') {
      const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
      const match = birthDate.match(datePattern);
      
      if (match) {
        [, year, month, day] = match.map(Number);
      } else {
        // Si tiene timestamp, usar UTC
        const dateObj = new Date(birthDate);
        if (isNaN(dateObj.getTime())) return null;
        
        year = dateObj.getUTCFullYear();
        month = dateObj.getUTCMonth() + 1;
        day = dateObj.getUTCDate();
      }
    } else {
      // Si es un Date object
      const dateObj = birthDate;
      if (isNaN(dateObj.getTime())) return null;
      
      year = dateObj.getFullYear();
      month = dateObj.getMonth() + 1;
      day = dateObj.getDate();
    }
    
    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = (today.getMonth() + 1) - month;
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
};
