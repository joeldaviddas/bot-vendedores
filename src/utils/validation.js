export function validatePhoneNumber(phone) {
    // Eliminar caracteres no numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verificar longitud mínima (incluyendo código de país)
    if (cleanPhone.length < 10) return false;
    
    // Verificar que comienza con código de país válido
    const validCountryCodes = ['52', '55', '57']; // México, Brasil, Colombia
    if (!validCountryCodes.some(code => cleanPhone.startsWith(code))) return false;
    
    return true;
}
