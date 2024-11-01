export interface Cliente {
    nombre: string;
    email: string;
  }
  
  export interface ClienteValidaciones {
    nombre: {
      requerido: boolean;
      minLength: number;
    };
    email: {
      requerido: boolean;
      formatoEmail: boolean;
    };
  }
  
  export const clienteValidaciones: ClienteValidaciones = {
    nombre: {
      requerido: true,
      minLength: 3
    },
    email: {
      requerido: true,
      formatoEmail: true
    }
  };