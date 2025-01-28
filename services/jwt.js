// Importar dependencias
const JWT = require('jwt-simple');
const moment = require('moment');

//CLave secreta
const secret = "VidpherCreadoEsteaño12345@";

//Crear una funcion para generar tokens
const createToken = (user)=>{
    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        rol: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };

    // devolver un JWT codificado
    console.log(user.image);
    return JWT.encode(payload, secret);
}

module.exports = {
    createToken,
    secret
};
