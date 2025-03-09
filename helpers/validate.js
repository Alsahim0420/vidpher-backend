const validator = require("validator");

const validate = (params) => {
    // Asegurar que los parámetros sean cadenas vacías si no están definidos
    params.username = params.username || "";
    params.email = params.email || "";
    params.password = params.password || "";
    params.bio = params.bio || "";

    // ✅ Validar username
    let username = 
        (!params.username || 
        (
            !validator.isEmpty(params.username) && 
            validator.isLength(params.username, { min: 5 }) &&
            validator.matches(params.username, /^[\w\-!@#$%^&*]+$/)
        ));

    // ✅ Validar email
    let email = !validator.isEmpty(params.email) &&
        validator.isEmail(params.email);

    // ✅ Validar password con mensajes específicos
    if (validator.isEmpty(params.password)) {
        throw new Error("La contraseña no puede estar vacía.");
    }
    if (!validator.isLength(params.password, { min: 8, max: 100 })) {
        throw new Error("La contraseña debe tener entre 8 y 100 caracteres.");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(params.password)) {
        throw new Error("La contraseña debe incluir al menos un carácter especial.");
    }

    // ✅ Validar bio solo si existe
    if (params.bio && !validator.isLength(params.bio, { max: 255 })) {
        throw new Error("La biografía no puede superar los 255 caracteres.");
    }

    // ✅ Si alguna validación falló, lanzar error
    if (!username || !email) {
        throw new Error("No se ha superado la validación: verifica username y email.");
    }

    console.log("✅ Validación superada");
};

module.exports = {
    validate
};
