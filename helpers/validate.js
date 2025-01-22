const validator = require("validator");


const validate = (params) => {
    // Asegurarse de que los parámetros sean cadenas vacías si no están definidos
    params.username = params.username || "";
    params.email = params.email || "";
    params.password = params.password || "";
    params.bio = params.bio || "";

    // Validar cada campo
    let username =
    (!params.username || // Si no existe o está vacío, lo hace opcional
        (
            !validator.isEmpty(params.username) && // No debe estar vacío si se envía
            validator.isLength(params.username, { min: 5 }) && // Mínimo 5 caracteres
            validator.matches(params.username, /^[\w\-!@#$%^&*]+$/) // Letras, números y caracteres especiales permitidos
        ));


    let email = !validator.isEmpty(params.email) &&
        validator.isEmail(params.email);

    let password = !validator.isEmpty(params.password) &&
        validator.isLength(params.password, { min: 8, max: 16 }) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(params.password); // Requiere caracteres especiales

    if(params.bio){
        let bio = validator.isLength(params.bio, { min:undefined, max: 255 });

        if (!bio) {
            throw new Error("No se ha superado la validación");
        } else {
            console.log("Validación superada");
        }
    }

    // Verificar que todas las validaciones sean correctas
    if (!username || !email || !password) {
        throw new Error("No se ha superado la validación");
    } else {
        console.log("Validación superada");
    }
};



module.exports ={
    validate
}
