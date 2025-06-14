export function validatePhoneNumber(phone) {
    try {
        // Verificar si el teléfono es una cadena válida
        if (typeof phone !== 'string') {
            throw new Error('El número de teléfono debe ser una cadena de texto.');
        }

        // Eliminar caracteres no numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Verificar longitud mínima (incluyendo código de país)
        if (cleanPhone.length < 10) {
            throw new Error('El número de teléfono es demasiado corto. Debe incluir código de país.');
        }
        
        // Definir códigos de país y sus especificaciones
        const countryCodes = {
            '52': { // México
                name: 'México',
                minDigits: 10,
                maxDigits: 10
            },
            '55': { // Brasil
                name: 'Brasil',
                minDigits: 11,
                maxDigits: 11
            },
            '57': { // Colombia
                name: 'Colombia',
                minDigits: 10,
                maxDigits: 10
            },
            '51': { // Perú
                name: 'Perú',
                minDigits: 9,
                maxDigits: 9
            },
            '53': { // Cuba
                name: 'Cuba',
                minDigits: 8,
                maxDigits: 8
            },
            '54': { // Argentina
                name: 'Argentina',
                minDigits: 10,
                maxDigits: 10
            },
            '56': { // Chile
                name: 'Chile',
                minDigits: 9,
                maxDigits: 9
            },
            '58': { // Venezuela
                name: 'Venezuela',
                minDigits: 11,
                maxDigits: 11
            },
            '591': { // Bolivia
                name: 'Bolivia',
                minDigits: 8,
                maxDigits: 8
            },
            '593': { // Ecuador
                name: 'Ecuador',
                minDigits: 9,
                maxDigits: 9
            },
            '595': { // Paraguay
                name: 'Paraguay',
                minDigits: 9,
                maxDigits: 9
            },
            '597': { // Surinam
                name: 'Surinam',
                minDigits: 7,
                maxDigits: 7
            },
            '598': { // Uruguay
                name: 'Uruguay',
                minDigits: 9,
                maxDigits: 9
            }
        };

        // Verificar que comienza con código de país válido
        const countryCode = Object.keys(countryCodes).find(code => cleanPhone.startsWith(code));
        if (!countryCode) {
            throw new Error('Código de país no válido. Los códigos permitidos son: ' + 
                Object.entries(countryCodes).map(([code, data]) => `${code} (${data.name})`).join(', '));
        }

        // Verificar longitud correcta según el país
        const countrySpec = countryCodes[countryCode];
        const digitsWithoutCode = cleanPhone.length - countryCode.length;
        if (digitsWithoutCode < countrySpec.minDigits || digitsWithoutCode > countrySpec.maxDigits) {
            throw new Error(`Número de teléfono inválido para ${countrySpec.name}. ` +
                `Debe tener entre ${countrySpec.minDigits} y ${countrySpec.maxDigits} dígitos después del código de país.`);
        }

        return {
            isValid: true,
            country: countrySpec.name,
            countryCode: countryCode
        };
    } catch (error) {
        console.error('Error al validar número de teléfono:', error);
        return {
            isValid: false,
            error: error.message
        };
    }
}
