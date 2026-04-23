import { supabase } from "../lib/core/supabase/supabase";

export async function testConnection() {
  try {
    // Intenta hacer una consulta simple a tu tabla "estudiantes"
    const { data, error } = await supabase
      .from("estudiantes")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Error al conectar con Supabase:", error.message);
      return "Error: " + error.message;
    }

    if (data && data.length > 0) {
      console.log("✅ Conexión exitosa. Datos recibidos:", data);
      return "Conexión exitosa con Supabase ✅";
    } else {
      console.log("⚠️ Conexión correcta, pero la tabla está vacía.");
      return "Conectado, pero sin datos";
    }
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    return "Error inesperado: " + err.message;
  }
}
