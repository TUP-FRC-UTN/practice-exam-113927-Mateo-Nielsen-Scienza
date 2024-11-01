export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
  }
  
  export interface ProductoValidaciones {
    cantidad: {
      mayorA: number;
      noExcederStock: boolean;
    };
  }
  
  export const productoValidaciones: ProductoValidaciones = {
    cantidad: {
      mayorA: 0,
      noExcederStock: true
    }
  };