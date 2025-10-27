import api from './api';
import { Paciente, PacienteCreate } from '@/types';

export const pacientesService = {
  async getPacientes(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Paciente[]> {
    const response = await api.get<Paciente[]>('/pacientes/', { params });
    return response.data;
  },

  async getPaciente(id: number): Promise<Paciente> {
    const response = await api.get<Paciente>(`/pacientes/${id}`);
    return response.data;
  },

  async createPaciente(paciente: PacienteCreate): Promise<Paciente> {
    const response = await api.post<Paciente>('/pacientes/', paciente);
    return response.data;
  },

  async updatePaciente(id: number, paciente: Partial<PacienteCreate>): Promise<Paciente> {
    const response = await api.patch<Paciente>(`/pacientes/${id}`, paciente);
    return response.data;
  },

  async deletePaciente(id: number): Promise<void> {
    await api.delete(`/pacientes/${id}`);
  },

  async mergePacientes(pacientePrincipalId: number, pacienteDuplicadoId: number): Promise<Paciente> {
    const response = await api.post<Paciente>(`/pacientes/${pacientePrincipalId}/merge/${pacienteDuplicadoId}`);
    return response.data;
  },

  async findDuplicates(): Promise<Array<{similar: Paciente[], score: number}>> {
    // Client-side duplicate detection logic
    const pacientes = await this.getPacientes({ limit: 1000 });
    const duplicates: Array<{similar: Paciente[], score: number}> = [];
    
    for (let i = 0; i < pacientes.length; i++) {
      for (let j = i + 1; j < pacientes.length; j++) {
        const p1 = pacientes[i];
        const p2 = pacientes[j];
        const score = calculateSimilarity(p1, p2);
        
        if (score > 0.7) { // 70% similarity threshold
          duplicates.push({ similar: [p1, p2], score });
        }
      }
    }
    
    return duplicates.sort((a, b) => b.score - a.score);
  },
};

// Helper function to normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses like "(cuota 1/2)"
    .replace(/\[[^\]]*\]/g, '') // Remove anything in brackets
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Helper function to calculate similarity between two patients
function calculateSimilarity(p1: Paciente, p2: Paciente): number {
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  // Check DNI first (if both have it, it's definitive)
  if (p1.dni && p2.dni && !p1.dni.startsWith('CSV-') && !p2.dni.startsWith('CSV-')) {
    // Both have real DNI (not CSV temporary)
    if (p1.dni === p2.dni) {
      return 1.0; // Perfect match
    } else {
      return 0; // Different DNI = definitely not duplicates
    }
  }
  
  // Check nombre (50% weight)
  if (p1.nombre && p2.nombre) {
    maxPossibleScore += 0.5;
    const n1 = normalizeText(p1.nombre);
    const n2 = normalizeText(p2.nombre);
    
    if (n1 === n2) {
      totalScore += 0.5; // Exact match
    } else if (n1.includes(n2) || n2.includes(n1)) {
      totalScore += 0.35; // Partial match
    } else {
      // Calculate Levenshtein-like similarity
      const longer = n1.length > n2.length ? n1 : n2;
      const shorter = n1.length > n2.length ? n2 : n1;
      const editDistance = levenshteinDistance(longer, shorter);
      const similarity = (longer.length - editDistance) / longer.length;
      totalScore += similarity * 0.5;
    }
  }
  
  // Check apellido (50% weight)
  if (p1.apellido && p2.apellido) {
    maxPossibleScore += 0.5;
    const a1 = normalizeText(p1.apellido);
    const a2 = normalizeText(p2.apellido);
    
    if (a1 === a2) {
      totalScore += 0.5; // Exact match
    } else if (a1.includes(a2) || a2.includes(a1)) {
      totalScore += 0.35; // Partial match
    } else {
      // Calculate Levenshtein-like similarity
      const longer = a1.length > a2.length ? a1 : a2;
      const shorter = a1.length > a2.length ? a2 : a1;
      const editDistance = levenshteinDistance(longer, shorter);
      const similarity = (longer.length - editDistance) / longer.length;
      totalScore += similarity * 0.5;
    }
  }
  
  // Boost score if name + surname match well
  if (p1.nombre && p2.nombre && p1.apellido && p2.apellido) {
    const fullName1 = normalizeText(`${p1.nombre} ${p1.apellido}`);
    const fullName2 = normalizeText(`${p2.nombre} ${p2.apellido}`);
    
    if (fullName1 === fullName2) {
      totalScore = Math.max(totalScore, 0.95); // Almost certain it's a duplicate
    }
  }
  
  // Check telefono (bonus points if matches)
  if (p1.telefono && p2.telefono) {
    const phone1 = p1.telefono.replace(/\D/g, '');
    const phone2 = p2.telefono.replace(/\D/g, '');
    if (phone1 === phone2 && phone1.length >= 8) {
      totalScore += 0.1;
    }
  }
  
  // Check email (bonus points if matches)
  if (p1.email && p2.email) {
    if (normalizeText(p1.email) === normalizeText(p2.email)) {
      totalScore += 0.1;
    }
  }
  
  return maxPossibleScore > 0 ? Math.min(totalScore, 1.0) : 0;
}

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
